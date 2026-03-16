from fastapi import FastAPI, Request, Form, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session
from database import create_db_and_tables, get_session
from models import Competidor
from datetime import datetime
app = FastAPI(

    title="GP COLOMBIA API",
    description="Sistema de registro para campeonatos de motociclismo en Colombia",
    version="0.0.1"
)

@app.on_event("startup")
def on_startup():
    # CREAR TABLAS EN LA BASE DE DATOS
    create_db_and_tables()

#CONFIGURAR LOS ARCHIVOS ESTATICOS COMO HTML Y CSS
app.mount("/static", StaticFiles(directory="static"), name="static")

# CONFIGURAR TEMPLATES HTML
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
def show_index(request: Request):

    return templates.TemplateResponse(
        "home.html",
        {"request": request}
    )

@app.post("/register")
def registrar_competidor(

    # DATOS PERSONALES
    full_name: str = Form(...),
    document_type: str = Form(...),
    document_number: str = Form(...),
    birth_date: str = Form(...),
    city: str = Form(...),
    phone: str = Form(...),
    email: str = Form(...),

    # INFORMACIÓN DEL EQUIPO
    team: str = Form(None),
    experience: str = Form(...),

    # INFORMACIÓN DE LA MOTO
    motorcycle_brand: str = Form(...),
    motorcycle_model: str = Form(...),
    engine_cc: int = Form(...),
    competitor_number: int = Form(...),

    # TÉRMINOS
    terms: bool = Form(...),

    # SESIÓN DE BASE DE DATOS
    session: Session = Depends(get_session)

):
    fecha_convertida = datetime.strptime(birth_date, "%Y-%m-%d").date()
    # ==========================================
    # CREACIÓN DEL OBJETO COMPETIDOR
    # ==========================================

    nuevo_competidor = Competidor(

        nombre_completo = full_name,
        tipo_documento = document_type,
        numero_documento = document_number,
        fecha_nacimiento = fecha_convertida,
        ciudad = city,
        telefono = phone,
        correo = email,

        equipo = team,
        experiencia = experience,

        marca_motocicleta = motorcycle_brand,
        modelo_motocicleta = motorcycle_model,
        cilindraje_motor = engine_cc,
        numero_competidor = competitor_number,

        acepta_terminos = terms

    )


    # ==========================================
    # GUARDAR EN BASE DE DATOS
    # ==========================================

    session.add(nuevo_competidor)
    session.commit()
    session.refresh(nuevo_competidor)


    # ==========================================
    # REDIRECCIÓN A LA PÁGINA PRINCIPAL
    # ==========================================

    return RedirectResponse(
        url="/?registro=exitoso",
        status_code=303
    )