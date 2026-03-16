from sqlmodel import SQLModel, create_engine, Session 

#ARCHIVO PARA LA BASE DE DATOS 
sqlite_file_name = "database_gpcolom.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

#CREAR EL ENGINE DE LA BASE DE DATOS
engine = create_engine(sqlite_url, echo=True)

#FUNCIÓN PARA CREAR LAS TABLAS EN LA BASE DE DATOS
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

#FUNCIÓN PARA OBTENER UNA SESIÓN DE LA BASE DE DATOS
def get_session():
    with Session(engine) as session:
        yield session