# ============================================
# MODELOS DE BASE DE DATOS - GP COLOMBIA
# ============================================

# IMPORTACIÓN DE SQLMODEL Y TIPOS DE DATOS
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import date


# ============================================
# MODELO DE COMPETIDOR
# ESTE MODELO REPRESENTA LA TABLA DE REGISTROS
# ============================================

class Competidor(SQLModel, table=True):

    # NOMBRE DE LA TABLA EN LA BASE DE DATOS
    __tablename__ = "competidores"


    # ============================================
    # IDENTIFICADOR PRINCIPAL
    # ============================================

    id: Optional[int] = Field(default=None, primary_key=True)


    # ============================================
    # INFORMACIÓN PERSONAL
    # ============================================

    nombre_completo: str

    tipo_documento: str

    numero_documento: str

    fecha_nacimiento: date

    ciudad: str

    telefono: str

    correo: str


    # ============================================
    # INFORMACIÓN DE COMPETENCIA
    # ============================================

    equipo: Optional[str] = None

    experiencia: str


    # ============================================
    # INFORMACIÓN DE LA MOTOCICLETA
    # ============================================

    marca_motocicleta: str

    modelo_motocicleta: str

    cilindraje_motor: int

    numero_competidor: int


    # ============================================
    # ACEPTACIÓN DE TÉRMINOS
    # ============================================

    acepta_terminos: bool