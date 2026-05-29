from fastapi import FastAPI, HTTPException, Request, Form, Depends, Response
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select
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

def calcular_categoria(carreras_completadas: int, categoria_actual: str) -> str:
    """
    Determina si el competidor puede subir de categoría.
    novato → intermedio: 3 carreras
    intermedio → experto: 5 carreras
    experto → elite: 8 carreras
    """
    umbrales = {"novato": 3, "intermedio": 5, "experto": 8}
    idx = CATEGORIAS_ORDEN.index(categoria_actual)
    if idx < len(CATEGORIAS_ORDEN) - 1:
        siguiente = CATEGORIAS_ORDEN[idx + 1]
        if carreras_completadas >= umbrales.get(categoria_actual, 999):
            return siguiente
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
    terms:             bool = Form(...),
    session: Session = Depends(get_session)
):
    # ── Validar contraseñas ──
    if password != confirm_password:
        return RedirectResponse(url="/?error=passwords_no_coinciden", status_code=303)

    if len(password) < 8:
        return RedirectResponse(url="/?error=password_muy_corta", status_code=303)

    # Validar categoría
    if categoria not in CATEGORIAS_ORDEN:
        categoria = "novato"

    fecha_convertida = datetime.strptime(birth_date, "%Y-%m-%d").date()

    # ── Validaciones de duplicados ──
    if session.exec(select(Competidor.id).where(Competidor.numero_documento == document_number)).first():
        return RedirectResponse(url="/?error=cedula_existente", status_code=303)

    if session.exec(select(Competidor.id).where(Competidor.numero_competidor == competitor_number)).first():
        return RedirectResponse(url="/?error=numero_competidor_existente", status_code=303)

    if session.exec(select(Competidor.id).where(Competidor.nombre_completo == full_name)).first():
        return RedirectResponse(url="/?error=nombre_existente", status_code=303)

    if session.exec(select(Usuario.id).where(Usuario.correo == email)).first():
        return RedirectResponse(url="/?error=correo_existente", status_code=303)

    # ── Crear Competidor ──
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

    # ── Crear Usuario vinculado ──
    nuevo_usuario = Usuario(
        competidor_id = nuevo_competidor.id,
        correo        = email,
        password_hash = hash_password(password),
    )
    session.add(nuevo_usuario)
    session.commit()

    return RedirectResponse(url="/login?registro=exitoso", status_code=303)


# ============================================================
# LOGIN USUARIO — GET
# ============================================================
@app.get("/login", response_class=HTMLResponse)
def show_login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})


# ============================================================
# LOGIN USUARIO — POST
# ============================================================
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
    redirect.set_cookie(
        key="access_token", value=token,
        httponly=True, samesite="lax", max_age=60 * 60 * 8
    )
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

    # Historial de inscripciones del competidor
    inscripciones = []
    if competidor:
        inscripciones = session.exec(
            select(InscripcionCarrera)
            .where(InscripcionCarrera.competidor_id == competidor.id)
            .order_by(InscripcionCarrera.inscrito_en.desc())
        ).all()

        # Enriquecer con datos de la carrera
        historial = []
        for insc in inscripciones:
            carrera = session.get(Carrera, insc.carrera_id)
            if carrera:
                historial.append({
                    "inscripcion": insc,
                    "carrera": carrera,
                })

        # Calcular si puede subir de categoría
        nueva_cat = calcular_categoria(competidor.carreras_completadas, competidor.categoria)
        if nueva_cat != competidor.categoria:
            competidor.categoria = nueva_cat
            session.add(competidor)
            session.commit()

        # Umbral de la siguiente categoría
        umbrales = {"novato": 3, "intermedio": 5, "experto": 8, "elite": None}
        umbral_siguiente = umbrales.get(competidor.categoria)
        if umbral_siguiente:
            progreso_pct = min(int((competidor.carreras_completadas / umbral_siguiente) * 100), 100)
        else:
            progreso_pct = 100
    else:
        historial = []
        umbral_siguiente = None
        progreso_pct = 0

    return templates.TemplateResponse("dashboard.html", {
        "request":          request,
        "usuario":          usuario,
        "competidor":       competidor,
        "historial":        historial,
        "umbral_siguiente": umbral_siguiente,
        "progreso_pct":     progreso_pct,
        "categorias_label": CATEGORIAS_LABEL,
    })


# ============================================================
# LOGOUT USUARIO
# ============================================================
@app.get("/logout")
def logout_usuario():
    redirect = RedirectResponse(url="/login", status_code=303)
    redirect.delete_cookie("access_token")
    return redirect


# ============================================================
# CARRERAS — PÁGINA PÚBLICA DE EVENTOS 2026
# ============================================================
@app.get("/carreras", response_class=HTMLResponse)
def show_carreras_publico(request: Request, session: Session = Depends(get_session)):
    """Página pública: muestra el calendario de competencias del año."""
    carreras = session.exec(
        select(Carrera)
        .where(Carrera.activa == True)
        .order_by(Carrera.fecha.asc())
    ).all()

    total_inscritos = session.exec(select(Competidor)).all()

    return templates.TemplateResponse("carreras_publico.html", {
        "request":        request,
        "carreras":       carreras,
        "total_inscritos": len(total_inscritos),
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

    # Verificar categoría mínima
    idx_comp   = CATEGORIAS_ORDEN.index(competidor.categoria)
    idx_minimo = CATEGORIAS_ORDEN.index(carrera.categoria_minima)
    if idx_comp < idx_minimo:
        return RedirectResponse(url="/carreras?error=categoria_insuficiente", status_code=303)

    # Verificar cupos
    if carrera.inscritos >= carrera.cupos_totales:
        return RedirectResponse(url="/carreras?error=sin_cupos", status_code=303)

    # Verificar inscripción duplicada
    ya_inscrito = session.exec(
        select(InscripcionCarrera)
        .where(InscripcionCarrera.competidor_id == competidor.id)
        .where(InscripcionCarrera.carrera_id == carrera_id)
    ).first()
    if ya_inscrito:
        return RedirectResponse(url="/carreras?error=ya_inscrito", status_code=303)

    # Crear inscripción
    nueva = InscripcionCarrera(
        competidor_id = competidor.id,
        carrera_id    = carrera_id,
        estado        = "pendiente",
    )
    session.add(nueva)

    # Actualizar contador de la carrera
    carrera.inscritos += 1
    session.add(carrera)
    session.commit()

    return RedirectResponse(url="/dashboard?inscripcion=exitosa", status_code=303)


# ============================================================
# ADMIN LOGIN — GET
# ============================================================
@app.get("/admin/login", response_class=HTMLResponse)
def show_admin_login(request: Request):
    return templates.TemplateResponse("admin_login.html", {"request": request})


# ============================================================
# ADMIN LOGIN — POST
# ============================================================
@app.post("/admin/login")
def login_admin(
    username: str = Form(...),
    password: str = Form(...),
):
    if not verify_admin_credentials(username, password):
        return RedirectResponse(url="/admin/login?error=credenciales_invalidas", status_code=303)

    token = create_access_token({"sub": username, "role": "admin"})
    redirect = RedirectResponse(url="/admin", status_code=303)
    redirect.set_cookie(
        key="admin_token", value=token,
        httponly=True, samesite="lax", max_age=60 * 60 * 8
    )
    return redirect


# ============================================================
# ADMIN LOGOUT
# ============================================================
@app.get("/admin/logout")
def logout_admin():
    redirect = RedirectResponse(url="/admin/login", status_code=303)
    redirect.delete_cookie("admin_token")
    return redirect


# ============================================================
# ADMIN PANEL — GESTIÓN DE COMPETIDORES Y CARRERAS
# ============================================================
@app.get("/admin", response_class=HTMLResponse)
def show_admin_panel(
    request: Request,
    current_admin: dict = Depends(get_current_admin),
    session: Session    = Depends(get_session)
):
    """Panel administrativo: lista de competidores + gestión de carreras."""
    competidores    = session.exec(select(Competidor).order_by(Competidor.id.desc())).all()
    carreras        = session.exec(select(Carrera).order_by(Carrera.fecha.asc())).all()
    marcas_lista    = sorted(list(set([c.marca_motocicleta for c in competidores])))
    marcas_unicas   = len(marcas_lista)
    con_experiencia = len([c for c in competidores if c.experiencia == "si"])

    # Estadísticas por categoría
    por_categoria = {cat: 0 for cat in CATEGORIAS_ORDEN}
    for c in competidores:
        cat = c.categoria if c.categoria in por_categoria else "novato"
        por_categoria[cat] += 1

    return templates.TemplateResponse("admin_panel.html", {
        "request":         request,
        "competidores":    competidores,
        "carreras":        carreras,
        "marcas_lista":    marcas_lista,
        "marcas_unicas":   marcas_unicas,
        "con_experiencia": con_experiencia,
        "por_categoria":   por_categoria,
        "admin":           current_admin,
        "categorias_label": CATEGORIAS_LABEL,
    })


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

    # Eliminar inscripciones relacionadas
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
    inscripcion_id:  int,
    current_admin:   dict = Depends(get_current_admin),
    posicion_final:  int  = Form(None),
    puntos_obtenidos: int = Form(0),
    tiempo_carrera:  str  = Form(None),
    vuelta_rapida:   str  = Form(None),
    estado:          str  = Form("participó"),
    session: Session      = Depends(get_session)
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

    # Actualizar estadísticas del competidor si participó
    if estado == "participó":
        competidor = session.get(Competidor, insc.competidor_id)
        if competidor:
            competidor.carreras_completadas += 1
            competidor.puntos_totales       += puntos_obtenidos
            if posicion_final and posicion_final <= 3:
                competidor.podios += 1
            # Recalcular categoría
            competidor.categoria = calcular_categoria(
                competidor.carreras_completadas,
                competidor.categoria
            )
            session.add(competidor)

    session.commit()
    return JSONResponse(content={"success": True})


# ============================================================
# ACTUALIZAR COMPETIDOR — PUT /competidor/{id} (solo admin)
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
# ELIMINAR COMPETIDOR — DELETE /competidor/{id} (solo admin)
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

    # Eliminar inscripciones del competidor
    inscripciones = session.exec(
        select(InscripcionCarrera).where(InscripcionCarrera.competidor_id == competidor_id)
    ).all()
    for insc in inscripciones:
        session.delete(insc)

    # Eliminar usuario vinculado
    usuario = session.exec(
        select(Usuario).where(Usuario.competidor_id == competidor_id)
    ).first()
    if usuario:
        session.delete(usuario)

    session.delete(competidor)
    session.commit()

    return JSONResponse(content={"success": True, "message": "Competidor eliminado correctamente"})


# ============================================================
# CUSTOMIZACIÓN — ruta existente (placeholder)
# ============================================================
@app.get("/customizacion", response_class=HTMLResponse)
def show_customizacion(request: Request):
    return templates.TemplateResponse("customizacion.html", {"request": request})


# ============================================================
# SEGUROS — ruta existente (placeholder)
# ============================================================
@app.get("/seguros", response_class=HTMLResponse)
def show_seguros(request: Request):
    return templates.TemplateResponse("seguros.html", {"request": request})