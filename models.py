# ============================================
# MODELOS DE BASE DE DATOS - GP COLOMBIA
# ============================================

from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import date, datetime


# ============================================
# CATEGORÍAS DE COMPETIDOR
# ============================================
# novato | intermedio | experto | elite
# Las competencias mínimas para subir de nivel:
#   novato      → intermedio : 3 carreras completadas
#   intermedio  → experto    : 5 carreras completadas
#   experto     → elite      : 8 carreras completadas


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

    # ── CATEGORÍA DEL PILOTO ──
    # Valores: novato | intermedio | experto | elite
    categoria: str = Field(default="novato")

    # ── INFORMACIÓN DE LA MOTOCICLETA ──
    marca_motocicleta: str
    modelo_motocicleta: str
    cilindraje_motor: int
    numero_competidor: int

    # ── ACEPTACIÓN DE TÉRMINOS ──
    acepta_terminos: bool

    # ── ESTADÍSTICAS ──
    carreras_completadas: int = Field(default=0)
    podios: int = Field(default=0)
    puntos_totales: int = Field(default=0)


# ============================================
# MODELO DE CARRERA / EVENTO
# ============================================

class Carrera(SQLModel, table=True):
    """
    Representa una competencia o evento del campeonato GP Colombia.
    Solo el admin puede crear/editar/eliminar carreras.
    """
    __tablename__ = "carreras"

    id: Optional[int] = Field(default=None, primary_key=True)

    # ── INFORMACIÓN GENERAL ──
    nombre: str
    descripcion: str
    ubicacion: str
    fecha: date
    hora: Optional[str] = None                    # HH:MM en formato 24h

    # ── CATEGORÍA MÍNIMA REQUERIDA ──
    # novato | intermedio | experto | elite
    categoria_minima: str = Field(default="novato")

    # ── CUPOS Y ESTADO ──
    cupos_totales: int = Field(default=30)
    inscritos: int = Field(default=0)
    activa: bool = Field(default=True)

    # ── IMAGEN BANNER ──
    imagen_url: Optional[str] = None

    # ── CIRCUITO / PISTA ──
    circuito: Optional[str] = None
    longitud_pista_km: Optional[float] = None
    vueltas: Optional[int] = None

    # ── PUNTOS EN JUEGO ──
    puntos_primer_lugar: int = Field(default=25)
    puntos_segundo_lugar: int = Field(default=18)
    puntos_tercer_lugar: int = Field(default=15)

    # ── METADATA ──
    creado_en: datetime = Field(default_factory=datetime.utcnow)


# ============================================
# MODELO DE INSCRIPCIÓN A CARRERA
# ============================================

class InscripcionCarrera(SQLModel, table=True):
    """
    Vincula un Competidor con una Carrera específica.
    Registra el resultado si ya se disputó.
    """
    __tablename__ = "inscripciones_carreras"

    id: Optional[int] = Field(default=None, primary_key=True)

    competidor_id: int = Field(foreign_key="competidores.id")
    carrera_id: int    = Field(foreign_key="carreras.id")

    # ── ESTADO ──
    # pendiente | confirmada | participó | no_se_presentó
    estado: str = Field(default="pendiente")

    # ── RESULTADO (se llena después de la carrera) ──
    posicion_final: Optional[int] = None     # 1, 2, 3, … o None si no terminó
    puntos_obtenidos: int = Field(default=0)
    tiempo_carrera: Optional[str] = None     # MM:SS.mmm
    vuelta_rapida: Optional[str] = None

    # ── METADATA ──
    inscrito_en: datetime = Field(default_factory=datetime.utcnow)