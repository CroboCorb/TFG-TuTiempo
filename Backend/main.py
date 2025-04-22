from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware

from typing import Annotated

from pydantic import UUID4
from sqlalchemy import create_engine, select
from sqlalchemy.ext.asyncio import AsyncSession

import os
import jwt

import database
import modelsDB
import modelsBase

ALGORITHM = "HS256"

app = FastAPI()

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["*"],
)

async def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        await db.close()

db_dependency = Annotated[AsyncSession, Depends(get_db)]

def create_tables():
    sync_engine = create_engine(os.getenv('DATABASE_URL_SYNC'))
    modelsDB.Base.metadata.create_all(bind=sync_engine)
    sync_engine.dispose()

create_tables()

# =============== VERIFICACIÓN DE JWT ===============

async def crearTokenJWT(user_id: UUID4):
    expire = datetime.now() + timedelta(weeks=2)
    payload = {"sub": str(user_id), "exp": expire}
    token = jwt.encode(payload, algorithm=ALGORITHM)
    return token, expire

async def verificarTokenJWT(req: Request, db: db_dependency):
    token = req.headers.get("Authorization")
    if not token:
        raise HTTPException( status_code = 401, detail = "Sin cabecera de autorización" )
    
    resultado = await db.execute(select(modelsDB.Token).where(modelsDB.Token.token == token.replace("Bearer ", "")))
    token_encontrado = resultado.scalars().first()
    if (not token_encontrado):
        raise HTTPException( status_code = 401, detail = "No autorizado" )
    
    return True

# =============== CONTROLADORES DE FASTAPI ===============

@app.get(
    "/usuarios/",
    summary="Obtener información de un usuario",
    description="Devuelve la información de un usuario según la UUID recibida.",
    tags=["Usuarios"]
)
async def infoUsuario(db: db_dependency, id: UUID4 = Query(), autorizado: bool = Depends(verificarTokenJWT)):
    resultado = await db.execute(select(modelsDB.Credentials).filter(modelsDB.User.id == id))
    usuario = resultado.scalars().first()
    if not usuario:
        raise HTTPException( status_code = 404, detail = 'Usuario no existente.' )
    return usuario

@app.post(
    "/usuarios/login",
    summary="Inicio de sesión",
    description="Controla el inicio de sesión de un administrador, devolviendo sus datos en caso de "
    "inicio de sesión correcto, o un mensaje de error en caso contrario.",
    tags=["Usuarios"]
)
async def iniciarSesion(username: str, password: str, db: db_dependency):
    resultado = await db.execute(select(modelsDB.Credentials).filter((modelsDB.Credentials.username == username) & (modelsDB.Credentials.password == password)))
    usuario = resultado.scalars().first()
    if not usuario:
        raise HTTPException( status_code = 404, detail = 'Login incorrecto.' )
    return usuario

@app.put(
    "/usuarios/registro",
    summary="Registro de nuevo usuario",
    description="Gestiona el registro de un nuevo usuario administrador",
    tags=["Usuarios"]
)
async def registrarUsuario(user: modelsBase.Credentials, db: db_dependency, autorizado: bool = Depends(verificarTokenJWT)):
    try:
        db.add(user)
        await db.commit()
    except Exception as e:
        raise HTTPException( status_code = 400, detail = 'Error de registro del usuario.' )
    
    return { "detail": "Registro realizado correctamente." }

@app.get(
    "/meteorologia/",
    summary="Obtener información meteorológica",
    description="Controlador encargado de procesar la información solicitada y enviarla a la API maestra.",
    tags=["Meteorología"]
)
async def infoMeteorología(db: db_dependency, autorizado: bool = Depends(verificarTokenJWT)):
    return { 'status': 200, 'detail': 'Por implementar' }