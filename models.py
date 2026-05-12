# ============================================
# MODELOS DE BASE DE DATOS - GP COLOMBIA
# ============================================

from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import date, datetime


# ============================================
# MODELO DE USUARIO (CUENTA DE ACCESO)
# ============================================

class Usuario(SQLModel, table=True):
    """
    Representa la cuenta de acceso de un piloto registrado.
    Se crea simultáneamente con el Competidor en el registro.
    """
    __tablename__ = "usuarios"

    id: Optional[int] = Field(default=None, primary_key=True)

    # Vinculación con el competidor
    competidor_id: int = Field(foreign_key="competidores.id", unique=True)

    # Credenciales
    correo: str = Field(unique=True, index=True)
    password_hash: str

    # Metadata
    activo: bool = Field(default=True)
    creado_en: datetime = Field(default_factory=datetime.utcnow)
    ultimo_acceso: Optional[datetime] = None


# ============================================
# MODELO DE COMPETIDOR
# ============================================

class Competidor(SQLModel, table=True):

    __tablename__ = "competidores"

    id: Optional[int] = Field(default=None, primary_key=True)

    # ── INFORMACIÓN PERSONAL ──
    nombre_completo: str
    tipo_documento: str
    numero_documento: str
    fecha_nacimiento: date
    ciudad: str
    telefono: str
    correo: str

    # ── INFORMACIÓN DE COMPETENCIA ──
    equipo: Optional[str] = None
    experiencia: str

    # ── INFORMACIÓN DE LA MOTOCICLETA ──
    marca_motocicleta: str
    modelo_motocicleta: str
    cilindraje_motor: int
    numero_competidor: int

    # ── ACEPTACIÓN DE TÉRMINOS ──
    acepta_terminos: bool