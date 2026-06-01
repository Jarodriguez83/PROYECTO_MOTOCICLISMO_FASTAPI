from fastapi import FastAPI, HTTPException, Request, Form, Depends, Response
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select
from typing import Optional
from starlette.responses import JSONResponse
from database import create_db_and_tables, get_session
from models import Competidor, Usuario, Carrera, InscripcionCarrera
from auth import (
    hash_password, verify_password,
    create_access_token,
    get_current_user, get_current_admin,
    verify_admin_credentials
)
from datetime import datetime, date
from typing import Optional
import markupsafe

app = FastAPI(
    title="GP COLOMBIA API",
    description="Sistema de registro para campeonatos de motociclismo en Colombia",
    version="2.0.0"
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# ── Registrar filtro escapejs para Jinja2 ──
def escapejs_filter(value):
    """Escapa caracteres especiales para uso seguro en strings JS."""
    if value is None:
        return ""
    value = str(value)
    value = value.replace("\\", "\\\\")
    value = value.replace('"', '\\"')
    value = value.replace("'", "\\'")
    value = value.replace("\n", "\\n")
    value = value.replace("\r", "\\r")
    value = value.replace("<", "\\u003c")
    value = value.replace(">", "\\u003e")
    value = value.replace("&", "\\u0026")
    return markupsafe.Markup(value)

templates.env.filters["escapejs"] = escapejs_filter


# ============================================================
# HELPERS
# ============================================================

CATEGORIAS_ORDEN = ["novato", "intermedio", "experto", "elite"]
CATEGORIAS_LABEL = {
    "novato":      "NOVATO",
    "intermedio":  "INTERMEDIO",
    "experto":     "EXPERTO",
    "elite":       "ÉLITE",
}

# Umbrales para subir de categoría
UMBRALES_CATEGORIA = {
    "novato":     3,
    "intermedio": 5,
    "experto":    8,
    "elite":      None,
}

def calcular_categoria(carreras_completadas: int, categoria_actual: str) -> str:
    idx = CATEGORIAS_ORDEN.index(categoria_actual)
    if idx < len(CATEGORIAS_ORDEN) - 1:
        umbral = UMBRALES_CATEGORIA.get(categoria_actual, 999)
        if umbral and carreras_completadas >= umbral:
            return CATEGORIAS_ORDEN[idx + 1]
    return categoria_actual


# ============================================================
# HOME PÚBLICO
# ============================================================
@app.get("/", response_class=HTMLResponse)
def show_index(request: Request):
    return templates.TemplateResponse("home.html", {"request": request})


# ============================================================
# REGISTRO DE USUARIO + COMPETIDOR
# ============================================================
@app.post("/register")
def registrar_competidor(
    full_name:         str  = Form(...),
    document_type:     str  = Form(...),
    document_number:   str  = Form(...),
    birth_date:        str  = Form(...),
    city:              str  = Form(...),
    phone:             str  = Form(...),
    email:             str  = Form(...),
    password:          str  = Form(...),
    confirm_password:  str  = Form(...),
    team:              str  = Form(None),
    experience:        str  = Form(...),
    categoria:         str  = Form("novato"),
    motorcycle_brand:  str  = Form(...),
    motorcycle_model:  str  = Form(...),
    engine_cc:         int  = Form(...),
    competitor_number: int  = Form(...),
    terms: Optional[bool] = Form(default=False),
    session: Session = Depends(get_session)
):
    if password != confirm_password:
        return RedirectResponse(url="/?error=passwords_no_coinciden", status_code=303)
    if len(password) < 8:
        return RedirectResponse(url="/?error=password_muy_corta", status_code=303)
    if categoria not in CATEGORIAS_ORDEN:
        categoria = "novato"

    try:
        fecha_convertida = datetime.strptime(birth_date, "%Y-%m-%d").date()
    except ValueError:
        return RedirectResponse(url="/?error=fecha_invalida", status_code=303)

    if session.exec(select(Competidor.id).where(Competidor.numero_documento == document_number)).first():
        return RedirectResponse(url="/?error=cedula_existente", status_code=303)
    if session.exec(select(Competidor.id).where(Competidor.numero_competidor == competitor_number)).first():
        return RedirectResponse(url="/?error=numero_competidor_existente", status_code=303)
    if session.exec(select(Competidor.id).where(Competidor.nombre_completo == full_name)).first():
        return RedirectResponse(url="/?error=nombre_existente", status_code=303)
    if session.exec(select(Usuario.id).where(Usuario.correo == email)).first():
        return RedirectResponse(url="/?error=correo_existente", status_code=303)

    nuevo_competidor = Competidor(
        nombre_completo    = full_name,
        tipo_documento     = document_type,
        numero_documento   = document_number,
        fecha_nacimiento   = fecha_convertida,
        ciudad             = city,
        telefono           = phone,
        correo             = email,
        equipo             = team,
        experiencia        = experience,
        categoria          = categoria,
        marca_motocicleta  = motorcycle_brand,
        modelo_motocicleta = motorcycle_model,
        cilindraje_motor   = engine_cc,
        numero_competidor  = competitor_number,
        acepta_terminos    = terms,
    )
    session.add(nuevo_competidor)
    session.commit()
    session.refresh(nuevo_competidor)

    nuevo_usuario = Usuario(
        competidor_id = nuevo_competidor.id,
        correo        = email,
        password_hash = hash_password(password),
    )
    session.add(nuevo_usuario)
    session.commit()

    return RedirectResponse(url="/login?registro=exitoso", status_code=303)


# ============================================================
# LOGIN USUARIO
# ============================================================
@app.get("/login", response_class=HTMLResponse)
def show_login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.post("/login")
def login_usuario(
    response: Response,
    email:    str = Form(...),
    password: str = Form(...),
    session: Session = Depends(get_session)
):
    usuario = session.exec(select(Usuario).where(Usuario.correo == email)).first()
    if not usuario or not verify_password(password, usuario.password_hash):
        return RedirectResponse(url="/login?error=credenciales_invalidas", status_code=303)
    if not usuario.activo:
        return RedirectResponse(url="/login?error=cuenta_inactiva", status_code=303)

    usuario.ultimo_acceso = datetime.utcnow()
    session.add(usuario)
    session.commit()

    token = create_access_token({"sub": str(usuario.id), "role": "user"})
    redirect = RedirectResponse(url="/dashboard", status_code=303)
    redirect.set_cookie(key="access_token", value=token, httponly=True, samesite="lax", max_age=60*60*8)
    return redirect


# ============================================================
# LOGOUT USUARIO
# ============================================================
@app.get("/logout")
def logout_usuario():
    redirect = RedirectResponse(url="/login", status_code=303)
    redirect.delete_cookie("access_token")
    return redirect


# ============================================================
# DASHBOARD USUARIO (protegido)
# ============================================================
@app.get("/dashboard", response_class=HTMLResponse)
def show_dashboard(
    request: Request,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    usuario = session.get(Usuario, current_user["user_id"])
    if not usuario:
        return RedirectResponse(url="/login", status_code=303)

    competidor = session.exec(
        select(Competidor).where(Competidor.id == usuario.competidor_id)
    ).first()

    historial = []
    umbral_siguiente = None
    progreso_pct = 0

    if competidor:
        inscripciones = session.exec(
            select(InscripcionCarrera)
            .where(InscripcionCarrera.competidor_id == competidor.id)
            .order_by(InscripcionCarrera.inscrito_en.desc())
        ).all()

        for insc in inscripciones:
            carrera = session.get(Carrera, insc.carrera_id)
            if carrera:
                historial.append({"inscripcion": insc, "carrera": carrera})

        # Recalcular categoría si corresponde
        nueva_cat = calcular_categoria(competidor.carreras_completadas, competidor.categoria)
        if nueva_cat != competidor.categoria:
            competidor.categoria = nueva_cat
            session.add(competidor)
            session.commit()

        umbral_siguiente = UMBRALES_CATEGORIA.get(competidor.categoria)
        if umbral_siguiente:
            progreso_pct = min(int((competidor.carreras_completadas / umbral_siguiente) * 100), 100)
        else:
            progreso_pct = 100

    return templates.TemplateResponse("dashboard.html", {
        "request":          request,
        "usuario":          usuario,
        "competidor":       competidor,
        "historial":        historial,
        "umbral_siguiente": umbral_siguiente,
        "progreso_pct":     progreso_pct,
        "categorias_label": CATEGORIAS_LABEL,
        "umbrales":         UMBRALES_CATEGORIA,
    })


# ============================================================
# CARRERAS — PÁGINA PÚBLICA DE EVENTOS 2026
# ============================================================
from fastapi.responses import JSONResponse

@app.get("/carreras", response_class=HTMLResponse)
def show_carreras_publico(request: Request, session: Session = Depends(get_session)):
    try:
        carreras = session.exec(
            select(Carrera).where(Carrera.activa == True).order_by(Carrera.fecha.asc())
        ).all()

        total_inscritos = session.exec(select(Competidor)).all()

        access_token = request.cookies.get("access_token")
        usuario_autenticado = False

        if access_token:
            try:
                from auth import decode_token
                payload = decode_token(access_token)

                if payload.get("role") == "user":
                    usuario_autenticado = True

            except Exception as e:
                print("ERROR TOKEN:", e)

        return templates.TemplateResponse("carreras_publico.html", {
            "request": request,
            "carreras": carreras,
            "total_inscritos": len(total_inscritos),
            "usuario_autenticado": usuario_autenticado,
        })

    except Exception as e:
        print("ERROR GENERAL:", e)

        # Opcional: retornar una página de error HTML
        return templates.TemplateResponse("carreras_publico.html", {
            "request": request,
            "mensaje": str(e)
        })


# ============================================================
# INSCRIPCIÓN A CARRERA (usuario autenticado)
# ============================================================
@app.post("/inscribirse")
def inscribirse_carrera(
    carrera_id:   int  = Form(...),
    current_user: dict = Depends(get_current_user),
    session: Session   = Depends(get_session)
):
    usuario = session.get(Usuario, current_user["user_id"])
    if not usuario:
        return RedirectResponse(url="/login", status_code=303)

    competidor = session.exec(
        select(Competidor).where(Competidor.id == usuario.competidor_id)
    ).first()
    if not competidor:
        return RedirectResponse(url="/dashboard?error=sin_perfil", status_code=303)

    carrera = session.get(Carrera, carrera_id)
    if not carrera:
        return RedirectResponse(url="/carreras?error=carrera_no_existe", status_code=303)

    idx_comp   = CATEGORIAS_ORDEN.index(competidor.categoria)
    idx_minimo = CATEGORIAS_ORDEN.index(carrera.categoria_minima)
    if idx_comp < idx_minimo:
        return RedirectResponse(url="/carreras?error=categoria_insuficiente", status_code=303)

    if carrera.inscritos >= carrera.cupos_totales:
        return RedirectResponse(url="/carreras?error=sin_cupos", status_code=303)

    ya_inscrito = session.exec(
        select(InscripcionCarrera)
        .where(InscripcionCarrera.competidor_id == competidor.id)
        .where(InscripcionCarrera.carrera_id == carrera_id)
    ).first()
    if ya_inscrito:
        return RedirectResponse(url="/carreras?error=ya_inscrito", status_code=303)

    nueva = InscripcionCarrera(
        competidor_id = competidor.id,
        carrera_id    = carrera_id,
        estado        = "pendiente",
    )
    session.add(nueva)
    carrera.inscritos += 1
    session.add(carrera)
    session.commit()

    return RedirectResponse(url="/dashboard?inscripcion=exitosa", status_code=303)


# ============================================================
# ADMIN LOGIN
# ============================================================
@app.get("/admin/login", response_class=HTMLResponse)
def show_admin_login(request: Request):
    return templates.TemplateResponse("admin_login.html", {"request": request})

@app.post("/admin/login")
def login_admin(
    username: str = Form(...),
    password: str = Form(...),
):
    if not verify_admin_credentials(username, password):
        return RedirectResponse(url="/admin/login?error=credenciales_invalidas", status_code=303)

    token = create_access_token({"sub": username, "role": "admin"})
    redirect = RedirectResponse(url="/admin", status_code=303)
    redirect.set_cookie(key="admin_token", value=token, httponly=True, samesite="lax", max_age=60*60*8)
    return redirect

@app.get("/admin/logout")
def logout_admin():
    redirect = RedirectResponse(url="/admin/login", status_code=303)
    redirect.delete_cookie("admin_token")
    return redirect


# ============================================================
# ADMIN PANEL
# ============================================================
@app.get("/admin", response_class=HTMLResponse)
def show_admin_panel(
    request: Request,
    current_admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    try:
        competidores = session.exec(
            select(Competidor).order_by(Competidor.id.desc())
        ).all()

        carreras = session.exec(
            select(Carrera).order_by(Carrera.fecha.asc())
        ).all()

        marcas_lista = sorted(
            list(set([c.marca_motocicleta for c in competidores]))
        )

        marcas_unicas = len(marcas_lista)

        con_experiencia = len([
            c for c in competidores
            if c.experiencia == "si"
        ])

        por_categoria = {cat: 0 for cat in CATEGORIAS_ORDEN}

        for c in competidores:
            cat = c.categoria if c.categoria in por_categoria else "novato"
            por_categoria[cat] += 1

        return templates.TemplateResponse("admin_panel.html", {
            "request": request,
            "competidores": competidores,
            "carreras": carreras,
            "marcas_lista": marcas_lista,
            "marcas_unicas": marcas_unicas,
            "con_experiencia": con_experiencia,
            "por_categoria": por_categoria,
            "admin": current_admin,
            "categorias_label": CATEGORIAS_LABEL,
        })

    except Exception as e:
        print("ERROR ADMIN:", e)
        raise e


# ============================================================
# ADMIN — CREAR CARRERA
# ============================================================
@app.post("/admin/carrera")
def crear_carrera(
    current_admin: dict = Depends(get_current_admin),
    nombre:               str   = Form(...),
    descripcion:          str   = Form(...),
    ubicacion:            str   = Form(...),
    fecha:                str   = Form(...),
    hora:                 str   = Form(None),
    categoria_minima:     str   = Form("novato"),
    cupos_totales:        int   = Form(30),
    imagen_url:           str   = Form(None),
    circuito:             str   = Form(None),
    longitud_pista_km:    float = Form(None),
    vueltas:              int   = Form(None),
    puntos_primer_lugar:  int   = Form(25),
    puntos_segundo_lugar: int   = Form(18),
    puntos_tercer_lugar:  int   = Form(15),
    session: Session = Depends(get_session)
):
    fecha_convertida = datetime.strptime(fecha, "%Y-%m-%d").date()
    nueva = Carrera(
        nombre               = nombre,
        descripcion          = descripcion,
        ubicacion            = ubicacion,
        fecha                = fecha_convertida,
        hora                 = hora or None,
        categoria_minima     = categoria_minima,
        cupos_totales        = cupos_totales,
        imagen_url           = imagen_url or None,
        circuito             = circuito or None,
        longitud_pista_km    = longitud_pista_km,
        vueltas              = vueltas,
        puntos_primer_lugar  = puntos_primer_lugar,
        puntos_segundo_lugar = puntos_segundo_lugar,
        puntos_tercer_lugar  = puntos_tercer_lugar,
    )
    session.add(nueva)
    session.commit()
    return JSONResponse(content={"success": True, "message": "Carrera creada correctamente"})


# ============================================================
# ADMIN — ELIMINAR CARRERA
# ============================================================
@app.delete("/admin/carrera/{carrera_id}")
def eliminar_carrera(
    carrera_id: int,
    current_admin: dict = Depends(get_current_admin),
    session: Session    = Depends(get_session)
):
    carrera = session.get(Carrera, carrera_id)
    if not carrera:
        raise HTTPException(status_code=404, detail="Carrera no encontrada")

    inscripciones = session.exec(
        select(InscripcionCarrera).where(InscripcionCarrera.carrera_id == carrera_id)
    ).all()
    for insc in inscripciones:
        session.delete(insc)

    session.delete(carrera)
    session.commit()
    return JSONResponse(content={"success": True, "message": "Carrera eliminada"})


# ============================================================
# ADMIN — TOGGLE ACTIVO/INACTIVO CARRERA
# ============================================================
@app.patch("/admin/carrera/{carrera_id}/toggle")
def toggle_carrera(
    carrera_id: int,
    current_admin: dict = Depends(get_current_admin),
    session: Session    = Depends(get_session)
):
    carrera = session.get(Carrera, carrera_id)
    if not carrera:
        raise HTTPException(status_code=404, detail="Carrera no encontrada")
    carrera.activa = not carrera.activa
    session.add(carrera)
    session.commit()
    return JSONResponse(content={"success": True, "activa": carrera.activa})


# ============================================================
# ADMIN — ACTUALIZAR RESULTADO DE INSCRIPCIÓN
# ============================================================
@app.put("/admin/inscripcion/{inscripcion_id}/resultado")
def actualizar_resultado(
    inscripcion_id:   int,
    current_admin:    dict = Depends(get_current_admin),
    posicion_final:   int  = Form(None),
    puntos_obtenidos: int  = Form(0),
    tiempo_carrera:   str  = Form(None),
    vuelta_rapida:    str  = Form(None),
    estado:           str  = Form("participó"),
    session: Session       = Depends(get_session)
):
    insc = session.get(InscripcionCarrera, inscripcion_id)
    if not insc:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")

    insc.posicion_final   = posicion_final
    insc.puntos_obtenidos = puntos_obtenidos
    insc.tiempo_carrera   = tiempo_carrera
    insc.vuelta_rapida    = vuelta_rapida
    insc.estado           = estado
    session.add(insc)

    if estado == "participó":
        competidor = session.get(Competidor, insc.competidor_id)
        if competidor:
            competidor.carreras_completadas += 1
            competidor.puntos_totales       += puntos_obtenidos
            if posicion_final and posicion_final <= 3:
                competidor.podios += 1
            competidor.categoria = calcular_categoria(
                competidor.carreras_completadas, competidor.categoria
            )
            session.add(competidor)

    session.commit()
    return JSONResponse(content={"success": True})


# ============================================================
# ACTUALIZAR COMPETIDOR (solo admin)
# ============================================================
@app.put("/competidor/{competidor_id}")
def actualizar_competidor(
    competidor_id:     int,
    current_admin:     dict = Depends(get_current_admin),
    full_name:         str  = Form(...),
    document_type:     str  = Form(...),
    document_number:   str  = Form(...),
    birth_date:        str  = Form(...),
    city:              str  = Form(...),
    phone:             str  = Form(...),
    email:             str  = Form(...),
    team:              str  = Form(None),
    experience:        str  = Form(...),
    categoria:         str  = Form("novato"),
    motorcycle_brand:  str  = Form(...),
    motorcycle_model:  str  = Form(...),
    engine_cc:         int  = Form(...),
    competitor_number: int  = Form(...),
    session: Session = Depends(get_session)
):
    competidor = session.get(Competidor, competidor_id)
    if not competidor:
        raise HTTPException(status_code=404, detail="Competidor no encontrado")

    fecha_convertida = datetime.strptime(birth_date, "%Y-%m-%d").date()

    competidor.nombre_completo    = full_name
    competidor.tipo_documento     = document_type
    competidor.numero_documento   = document_number
    competidor.fecha_nacimiento   = fecha_convertida
    competidor.ciudad             = city
    competidor.telefono           = phone
    competidor.correo             = email
    competidor.equipo             = team
    competidor.experiencia        = experience
    competidor.categoria          = categoria if categoria in CATEGORIAS_ORDEN else "novato"
    competidor.marca_motocicleta  = motorcycle_brand
    competidor.modelo_motocicleta = motorcycle_model
    competidor.cilindraje_motor   = engine_cc
    competidor.numero_competidor  = competitor_number

    session.add(competidor)
    session.commit()
    session.refresh(competidor)

    return JSONResponse(content={"success": True, "message": "Competidor actualizado correctamente"})


# ============================================================
# ELIMINAR COMPETIDOR (solo admin)
# ============================================================
@app.delete("/competidor/{competidor_id}")
def eliminar_competidor(
    competidor_id: int,
    current_admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    competidor = session.get(Competidor, competidor_id)
    if not competidor:
        raise HTTPException(status_code=404, detail="Competidor no encontrado")

    inscripciones = session.exec(
        select(InscripcionCarrera).where(InscripcionCarrera.competidor_id == competidor_id)
    ).all()
    for insc in inscripciones:
        session.delete(insc)

    usuario = session.exec(
        select(Usuario).where(Usuario.competidor_id == competidor_id)
    ).first()
    if usuario:
        session.delete(usuario)

    session.delete(competidor)
    session.commit()

    return JSONResponse(content={"success": True, "message": "Competidor eliminado correctamente"})


# ============================================================
# PÁGINAS ESTÁTICAS / PLACEHOLDER
# ============================================================
@app.get("/customizacion", response_class=HTMLResponse)
def show_customizacion(request: Request):
    return templates.TemplateResponse("customizacion.html", {"request": request})

@app.get("/patrocinadores", response_class=HTMLResponse)
def show_patrocinadores(request: Request):
    return templates.TemplateResponse("patrocinadores.html", {"request": request})

@app.get("/registro", response_class=HTMLResponse)
def show_registro(request: Request):
    return templates.TemplateResponse("registro.html", {"request": request})

@app.get("/seguros")
def show_seguros(request: Request):
    return RedirectResponse(url="/patrocinadores", status_code=301)



# Ruta /mecanica mencionada en el footer
@app.get("/mecanica", response_class=HTMLResponse)
def show_mecanica(request: Request):
    # Redirige a home si no existe la plantilla
    return RedirectResponse(url="/", status_code=302)