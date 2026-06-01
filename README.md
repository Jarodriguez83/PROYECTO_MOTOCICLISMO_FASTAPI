# GP COLOMBIA

Sistema web de gestión de campeonatos de motociclismo en Colombia. Permite registrar competidores, administrar carreras y manejar inscripciones de forma segura con autenticación de usuario y panel administrativo.

## Descripción del proyecto

GP COLOMBIA es una aplicación desarrollada con FastAPI y SQLModel que simula un sistema de inscripción y administración de eventos de motociclismo. Los competidores pueden registrarse, iniciar sesión, ver carreras disponibles y gestionar su perfil. Los administradores pueden crear carreras, gestionar competidores, validar resultados y controlar el estado de los eventos.

## Características principales

- Registro de competidores con información personal, datos de motocicleta y experiencia.
- Autenticación de usuario con inicio y cierre de sesión.
- Dashboard de competidor con historial de inscripciones y progreso de categoría.
- Publicación de carreras disponibles para el público y gestión de cupos.
- Inscripción a carreras con validación de categoría mínima y cupos disponibles.
- Panel administrativo para:
  - Crear, editar y eliminar carreras.
  - Activar o desactivar eventos.
  - Actualizar el resultado de inscripciones.
  - Gestionar competidores registrados.
- Lógica de avance de categoría automática basada en carreras completadas:
  - Novato → Intermedio: 3 carreras completadas.
  - Intermedio → Experto: 5 carreras completadas.
  - Experto → Élite: 8 carreras completadas.

## Tecnologías usadas

- Python 3
- FastAPI
- SQLModel
- SQLite
- Jinja2
- Uvicorn
- python-jose (JWT)
- passlib (bcrypt)
- JavaScript y CSS para frontend estático

## Estructura del proyecto

- `main.py` - Controlador principal de la aplicación y rutas.
- `models.py` - Definición de los modelos de datos: Usuario, Competidor, Carrera e Inscripción.
- `auth.py` - Funciones de autenticación, hashing de contraseñas, JWT y dependencias.
- `database.py` - Configuración de la base de datos SQLite y la sesión.
- `templates/` - Plantillas HTML del frontend.
- `static/` - Archivos estáticos CSS y JavaScript.

## Instalación

1. Crear y activar el entorno virtual en Windows:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

2. Instalar las dependencias:

```powershell
pip install -r requirements.txt
```

3. Iniciar la aplicación:

```powershell
uvicorn main:app --reload
```

4. Abrir en el navegador:

```
http://127.0.0.1:8000/
```

## Uso

### Registro de competidor
- Ir a la página de inicio.
- Completar el formulario de registro con datos personales, moto y experiencia.
- El sistema crea una cuenta de usuario asociada al competidor.

### Login de competidor
- Acceder a `/login`.
- Iniciar sesión con correo y contraseña.
- El dashboard muestra el historial de carreras, estado de inscripciones y porcentaje de progreso hacia la siguiente categoría.

### Ver carreras disponibles
- Acceder a `/carreras` para ver las carreras públicas activas.
- Inscribirse a una carrera si se cumple la categoría mínima y hay cupos disponibles.

### API de soporte
- `/api/inscribirse` — Inscripción AJAX a carrera con correo y contraseña.
- `/api/sesion` — Verifica sesión activa y retorna datos del competidor.
- `/api/mis-inscripciones` — Obtiene las carreras en las que está inscrito el competidor.

## Panel administrativo

### Acceso
- Ingresar a `/admin/login`.
- Credenciales por defecto (configurables con variables de entorno):
  - Usuario: `admin`
  - Contraseña: `GPColombia2026!`

### Funcionalidades
- Ver todos los competidores registrados y estadísticas de categorías.
- Ver las carreras disponibles y su estado.
- Crear nuevas carreras con datos de evento, cupos, categoría mínima y puntajes.
- Eliminar carreras y competidores.
- Marcar carreras como activas o inactivas.
- Actualizar resultados de inscripciones para sumar puntos y podios.

## Configuración opcional

Se pueden definir estas variables de entorno para seguridad y personalización:

- `SECRET_KEY` — Clave secreta para firmar JWT.
- `ADMIN_USERNAME` — Usuario administrador.
- `ADMIN_PASSWORD` — Contraseña del administrador.

## Base de datos

- Archivo SQLite generado: `database_gpcolom.db`.
- Se crea automáticamente al iniciar el servidor.
- Tablas principales:
  - `usuarios`
  - `competidores`
  - `carreras`
  - `inscripciones_carreras`

## Notas importantes

- El proyecto está pensado como una plataforma de gestión de campeonatos de motociclismo.
- La lógica de negocio se centra en el registro seguro, la inscripción a carreras y la administración de resultados.
- Para producción, se recomienda cambiar la clave secreta y las credenciales de administrador mediante variables de entorno.

## Contacto

Para mejoras o ajustes, revise las plantillas en `templates/` y el código de rutas en `main.py`.
