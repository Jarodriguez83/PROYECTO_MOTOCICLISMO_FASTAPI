from fastapi import FastAPI, HTTPException, Request, Form, Depends, Response
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select
from starlette.responses import JSONResponse
from database import create_db_and_tables, get_session
from models import Competidor, Usuario
from auth import (
    hash_password, verify_password,
    create_access_token,
    get_current_user, get_current_admin,
    verify_admin_credentials
)
from datetime import datetime

app = FastAPI(
    title="GP COLOMBIA API",
    description="Sistema de registro para campeonatos de motociclismo en Colombia",
    version="1.0.0"
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


# ============================================================
# HOME PÚBLICO
# ============================================================
@app.get("/", response_class=HTMLResponse)
def show_index(request: Request):
    return templates.TemplateResponse("home.html", {"request": request})


# ============================================================
# REGISTRO DE USUARIO + COMPETIDOR
# Crea simultáneamente la cuenta de acceso y el registro
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
# LOGIN USUARIO — GET (formulario)
# ============================================================
@app.get("/login", response_class=HTMLResponse)
def show_login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})


# ============================================================
# LOGIN USUARIO — POST (autenticación)
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

    # Actualizar último acceso
    usuario.ultimo_acceso = datetime.utcnow()
    session.add(usuario)
    session.commit()

    # Emitir JWT en cookie HttpOnly
    token = create_access_token({"sub": str(usuario.id), "role": "user"})
    redirect = RedirectResponse(url="/dashboard", status_code=303)
    redirect.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 8  # 8 horas
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

    return templates.TemplateResponse("dashboard.html", {
        "request":    request,
        "usuario":    usuario,
        "competidor": competidor,
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
# ADMIN LOGIN — GET (formulario)
# ============================================================
@app.get("/admin/login", response_class=HTMLResponse)
def show_admin_login(request: Request):
    return templates.TemplateResponse("admin_login.html", {"request": request})


# ============================================================
# ADMIN LOGIN — POST (autenticación con credenciales fijas)
# ============================================================
@app.post("/admin/login")
def login_admin(
    username: str = Form(...),
    password: str = Form(...),
):
    if not verify_admin_credentials(username, password):
        return RedirectResponse(url="/admin/login?error=credenciales_invalidas", status_code=303)

    token = create_access_token({"sub": username, "role": "admin"})
    redirect = RedirectResponse(url="/carreras", status_code=303)
    redirect.set_cookie(
        key="admin_token",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 8
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
# CARRERAS — GESTIÓN DE COMPETIDORES (protegido: solo admin)
# ============================================================
@app.get("/carreras", response_class=HTMLResponse)
def show_carreras(
    request: Request,
    current_admin: dict = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    competidores    = session.exec(select(Competidor).order_by(Competidor.id.desc())).all()
    marcas_lista    = sorted(list(set([c.marca_motocicleta for c in competidores])))
    marcas_unicas   = len(marcas_lista)
    con_experiencia = len([c for c in competidores if c.experiencia == "si"])

    return templates.TemplateResponse("carreras.html", {
        "request":         request,
        "competidores":    competidores,
        "marcas_lista":    marcas_lista,
        "marcas_unicas":   marcas_unicas,
        "con_experiencia": con_experiencia,
        "admin":           current_admin,
    })


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

    # Eliminar también el usuario vinculado
    usuario = session.exec(
        select(Usuario).where(Usuario.competidor_id == competidor_id)
    ).first()
    if usuario:
        session.delete(usuario)

    session.delete(competidor)
    session.commit()

    return JSONResponse(content={"success": True, "message": "Competidor eliminado correctamente"})