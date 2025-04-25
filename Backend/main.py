from datetime import datetime, timedelta
from fastapi import Body, FastAPI, Depends, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware

from typing import Annotated

from pydantic import UUID4
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession

import os
import jwt
import requests

import database
import modelsDB
import modelsBase

SECRET_KEY = os.getenv("SECRET_KEY", "mysecret")
ALGORITHM = "HS256"

app = FastAPI()

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
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
    sync_engine = create_engine(os.getenv('BBDD_SYNC'))
    modelsDB.Base.metadata.create_all(bind=sync_engine)

    with Session(sync_engine) as session:
        if not session.query(modelsDB.Credentials).first():
            adminDefecto = modelsDB.Credentials(username='dbrusev', password=os.getenv('INITIAL_ADMIN_PWD'))
            session.add(adminDefecto)
            session.commit()

    sync_engine.dispose()

create_tables()

# =============== VERIFICACIÓN DE JWT Y KEYS ===============

async def crearTokenJWT(user_id: UUID4):
    expire = datetime.now() + timedelta(weeks=2)
    payload = {"sub": str(user_id), "exp": expire}
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token, expire

async def verificarTokenJWT(req: Request, db: db_dependency):
    token = req.headers.get("Authorization")
    if not token:
        raise HTTPException( status_code = 401, detail = "Sin cabecera de autorización" )
    
    resultado = await db.execute(select(modelsDB.SessionToken).where(modelsDB.SessionToken.token == token.strip().replace("Bearer ", "")))
    token_encontrado = resultado.scalars().first()
    if (not token_encontrado):
        raise HTTPException( status_code = 401, detail = "No autorizado" )
    
    return True

# ============================================================

@app.get(
    "/credenciales",
    summary="Listado de credenciales",
    description="Muestra el listado de las credenciales registradas",
    tags=["Credenciales"]
)
async def listarCredenciales(db: db_dependency, tokenValido: bool = Depends(verificarTokenJWT)):
    try:
        resultado = await db.execute(select(modelsDB.Credentials))
        return resultado.scalars().all()
    except Exception as e:
        raise HTTPException( status_code = 400, detail = 'Error en la recogida de credenciales.' )

@app.post(
    "/credenciales/login",
    summary="Inicio de sesión",
    description="Controla el inicio de sesión de un administrador, devolviendo el token " 
    "en caso de inicio de sesión correcto, o un mensaje de error en caso contrario.",
    tags=["Credenciales"]
)
async def iniciarSesion_API(db: db_dependency, username: str = Body(), password: str = Body()):
    resultado = await db.execute(select(modelsDB.Credentials).filter((modelsDB.Credentials.username == username) & (modelsDB.Credentials.password == password)))
    usuario = resultado.scalars().first()
    if not usuario:
        raise HTTPException( status_code = 404, detail = 'Login incorrecto.' )
    
    resultado = await db.execute(select(modelsDB.SessionToken).where(modelsDB.SessionToken.userid == usuario.id))
    token = resultado.scalars().first()
    if token:
        await db.delete(token)
        await db.commit()

    token, expires_at = await crearTokenJWT(usuario.id)
    db.add(modelsDB.SessionToken(token = token, expiry_date = expires_at, userid = usuario.id))
    await db.commit()

    return { "token": token, "detail": "Inicio de sesión correcto" }

@app.put(
    "/credenciales/registrar",
    summary="Registro de administrador",
    description="Gestiona el registro de un nuevo administrador",
    tags=["Credenciales"]
)
async def registrarUsuario(db: db_dependency, user: modelsBase.Credentials = Body(), tokenValido: bool = Depends(verificarTokenJWT)):
    try:
        db.add(modelsDB.Credentials(
            username = user.username,
            password = user.password
        ))
        await db.commit()
    except Exception as e:
        print(e)
        raise HTTPException( status_code = 400, detail = 'Error de registro del administrador.' )
    
    return { "detail": "Registro realizado correctamente." }

@app.get(
    "/tokens",
    summary="Listado de tokens",
    description="Muestra el listado de tokens registrados",
    tags=["Token"]
)
async def listarTokens(db: db_dependency, tokenValido: bool = Depends(verificarTokenJWT)):
    try:
        resultado = await db.execute(select(modelsDB.SessionToken))
        return resultado.scalars().all()
    except Exception as e:
        raise HTTPException( status_code = 400, detail = 'Error en la recogida de tokens.' )

# ============================================================

@app.get(
    "/meteorologia/",
    summary="Obtener información meteorológica",
    description="Controlador encargado de procesar la información solicitada y enviarla a la API maestra.",
    tags=["Meteorología"]
)
async def infoMeteorología(db: db_dependency, tokenValido: bool = Depends(verificarTokenJWT)):
    url = "https://opendata.aemet.es/opendata/api/maestro/municipios"
    querystring = {"api_key":os.getenv('AEMET_APIKEY')}
    headers = { 'cache-control': "no-cache" }

    response = requests.request("GET", url, headers=headers, params=querystring)
    return response.text