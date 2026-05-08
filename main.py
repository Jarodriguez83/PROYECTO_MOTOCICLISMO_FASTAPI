from fastapi import FastAPI, HTTPException, Request, Form, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select
from sqlalchemy import or_
from starlette.responses import JSONResponse
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
    create_db_and_tables()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


# ============================================================
# HOME
# ============================================================
@app.get("/", response_class=HTMLResponse)
def show_index(request: Request):
    return templates.TemplateResponse("home.html", {"request": request})


# ============================================================
# CARRERAS — GESTIÓN DE COMPETIDORES
# ============================================================
@app.get("/carreras", response_class=HTMLResponse)
def show_carreras(request: Request, session: Session = Depends(get_session)):
    competidores = session.exec(
        select(Competidor).order_by(Competidor.id.desc())
    ).all()

    marcas_lista    = sorted(list(set([c.marca_motocicleta for c in competidores])))
    marcas_unicas   = len(marcas_lista)
    con_experiencia = len([c for c in competidores if c.experiencia == "si"])

    return templates.TemplateResponse("carreras.html", {
        "request":        request,
        "competidores":   competidores,
        "marcas_lista":   marcas_lista,
        "marcas_unicas":  marcas_unicas,
        "con_experiencia": con_experiencia,
    })


# ============================================================
# REGISTRO DE COMPETIDOR
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
    team:              str  = Form(None),
    experience:        str  = Form(...),
    motorcycle_brand:  str  = Form(...),
    motorcycle_model:  str  = Form(...),
    engine_cc:         int  = Form(...),
    competitor_number: int  = Form(...),
    terms:             bool = Form(...),
    session: Session = Depends(get_session)
):
    fecha_convertida = datetime.strptime(birth_date, "%Y-%m-%d").date()

    # VALIDACIONES DE DUPLICADOS
    existe_cedula = session.exec(
        select(Competidor.id).where(Competidor.numero_documento == document_number)
    ).first()
    if existe_cedula is not None:
        return RedirectResponse(url="/?error=cedula_existente", status_code=303)

    existe_numero = session.exec(
        select(Competidor.id).where(Competidor.numero_competidor == competitor_number)
    ).first()
    if existe_numero is not None:
        return RedirectResponse(url="/?error=numero_competidor_existente", status_code=303)

    existe_nombre = session.exec(
        select(Competidor.id).where(Competidor.nombre_completo == full_name)
    ).first()
    if existe_nombre is not None:
        return RedirectResponse(url="/?error=nombre_existente", status_code=303)

    nuevo_competidor = Competidor(
        id                 = None,
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

    return RedirectResponse(url="/?registro=exitoso", status_code=303)


# ============================================================
# ACTUALIZAR COMPETIDOR   PUT /competidor/{id}
# ============================================================
@app.put("/competidor/{competidor_id}")
def actualizar_competidor(
    competidor_id:     int,
    full_name:         str = Form(...),
    document_type:     str = Form(...),
    document_number:   str = Form(...),
    birth_date:        str = Form(...),
    city:              str = Form(...),
    phone:             str = Form(...),
    email:             str = Form(...),
    team:              str = Form(None),
    experience:        str = Form(...),
    motorcycle_brand:  str = Form(...),
    motorcycle_model:  str = Form(...),
    engine_cc:         int = Form(...),
    competitor_number: int = Form(...),
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
# ELIMINAR COMPETIDOR   DELETE /competidor/{id}
# ← RUTA UNIFICADA (antes era /eliminar_competidor/{id})
# ============================================================
@app.delete("/competidor/{competidor_id}")
def eliminar_competidor(
    competidor_id: int,
    session: Session = Depends(get_session)
):
    competidor = session.get(Competidor, competidor_id)
    if not competidor:
        raise HTTPException(status_code=404, detail="Competidor no encontrado")

    session.delete(competidor)
    session.commit()

    return JSONResponse(content={"success": True, "message": "Competidor eliminado correctamente"})