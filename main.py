from fastapi import FastAPI, Request, Form, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select
from sqlalchemy import or_
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


@app.get("/carreras", response_class=HTMLResponse)
def show_carreras(request: Request, session: Session = Depends(get_session)):
    # OBTENER TODOS LOS COMPETIDORES
    competidores = session.exec(
        select(Competidor).order_by(Competidor.id.desc())
    ).all()

    # OBTENER LISTAS ÚNICAS PARA FILTROS
    marcas_lista = sorted(list(set([c.marca_motocicleta for c in competidores])))
    marcas_unicas = len(marcas_lista)
    con_experiencia = len([c for c in competidores if c.experiencia == 'si'])

    return templates.TemplateResponse(
        "carreras.html",
        {
            "request": request,
            "competidores": competidores,
            "marcas_lista": marcas_lista,
            "marcas_unicas": marcas_unicas,
            "con_experiencia": con_experiencia
        }
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
    # VALIDACIONES DE DUPLICADOS
    # ==========================================

    # 1. Validación de Cédula/Documento
    existe_cedula = session.exec(
        select(Competidor.id).where(Competidor.numero_documento == document_number)
    ).first()
    if existe_cedula is not None:
        return RedirectResponse(
            url="/?error=cedula_existente",
            status_code=303
        )

    # 2. Validación de Número de Competidor
    existe_numero_competidor = session.exec(
        select(Competidor.id).where(Competidor.numero_competidor == competitor_number)
    ).first()
    if existe_numero_competidor is not None:
        return RedirectResponse(
            url="/?error=numero_competidor_existente",
            status_code=303
        )

    # 3. NUEVA: Validación de Nombre Completo
    # Se recomienda usar .lower() o una comparación insensible a mayúsculas si tu DB lo permite
    existe_nombre = session.exec(
        select(Competidor.id).where(Competidor.nombre_completo == full_name)
    ).first()
    if existe_nombre is not None:
        return RedirectResponse(
            url="/?error=nombre_existente",
            status_code=303
        )

    # (Opcional) Validación combinada final revisada
    # Esto sirve como una última malla de seguridad antes de insertar
    existe_alguno = session.exec(
        select(Competidor.id).where(
            or_(
                Competidor.numero_documento == document_number,
                Competidor.numero_competidor == competitor_number,
                Competidor.nombre_completo == full_name
            )
        )
    ).first()

    if existe_alguno is not None:
        return RedirectResponse(
            url="/?error=registro_duplicado",
            status_code=303
        )
    # ==========================================
    # CREACIÓN DEL OBJETO COMPETIDOR
    # ==========================================

    nuevo_competidor = Competidor(

        id = None,
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


# ==========================================
# ELIMINAR COMPETIDOR
# ==========================================

@app.delete("/eliminar_competidor/{competidor_id}")
def eliminar_competidor(competidor_id: int, session: Session = Depends(get_session)):
    competidor = session.get(Competidor, competidor_id)
    if not competidor:
        return {"error": "Competidor no encontrado"}, 404
    
    session.delete(competidor)
    session.commit()
    
    return {"mensaje": "Competidor eliminado correctamente"}