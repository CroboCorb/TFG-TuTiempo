from fastapi import Body, FastAPI, Depends, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware

from typing import Annotated
from datetime import datetime, timedelta, time

from pydantic import UUID4
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession

import os
import jwt
import json
import locale
import requests

import database
import modelsDB
import modelsBase

# VALORES CONSTANTES
SECRET_KEY = os.getenv("SECRET_KEY", "mysecret")
ALGORITHM = "HS256"


# CARGA DE ARCHIVO JSON CON ÍCONOS DE TIEMPO
with open("refs/IconosTiempo.json", "r", encoding="utf-8") as f:
    ICONOS_TIEMPO: dict = json.load(f)

# CARGA DE ARCHIVO JSON CON TRADUCCIONES DE FASE LUNAR
with open("refs/FasesLuna.json", "r", encoding="utf-8") as f:
    FASES_LUNA: dict = json.load(f)

# CARGA DE ARCHIVO JSON DE BRÚJULA DE 16 PUNTAS
with open("refs/Cardinalidad.json", "r", encoding="utf-8") as f:
    DIR_VIENTO: dict = json.load(f)


app = FastAPI()
locale.setlocale(locale.LC_TIME, "es_ES")

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
    if not token_encontrado or token_encontrado.expiry_date < datetime.now():
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    
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

    return token

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
    
@app.get(
    "/tokens/verificar",
    summary="Verificación de token JWT",
    description="Verifica la veradicad del token JWT, comprobando su "
    "existencia en la BBDD y su fecha de expiración",
    tags=["Token"]
)
async def verificarToken(token: str = Query(..., description="Token JWT a verificar"), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(modelsDB.SessionToken).where(modelsDB.SessionToken.token == token))
    token_db = result.scalars().first()

    if not token_db or token_db.expiry_date < datetime.now():
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    
    return token_db.token

# ============================================================

@app.get(
    "/meteorologia/ciudad",
    summary="Obtener información meteorológica según palabra clave.",
    description="Controlador encargado de recibir la información meteorológica de una ciudad por su nombre y su región.",
    tags=["Meteorología"]
)
async def infoMeteorologíaPorNombre(ciudadYRegion: str, db: db_dependency):
    url = f"http://api.weatherapi.com/v1/forecast.json?key={os.getenv('WEATHER_APIKEY')}&q={f"{ciudadYRegion},Spain"}&days=7&aqi=no&alerts=yes&lang=es"
    respuesta = requests.get(url)
    
    if respuesta.status_code == 200:
        return await limpiezaDatosPronostico(respuesta.json(), url.split("&days")[0])
    else:
        return {"error": f"Error en la solicitud: {respuesta.status_code}"}
    
@app.get(
    "/meteorologia/cardinalidad",
    summary="Obtener información meteorológica según cardinalidad",
    description="Controlador encargado de recibir la información meteorológica de un punto "
    "específico según la latitud y la longitud proporcionados.",
    tags=["Meteorología"]
)
async def infoMeteorologíaPorCardinalidad(latitud: str, longitud: str, db: db_dependency):
    url = f"http://api.weatherapi.com/v1/forecast.json?key={os.getenv('WEATHER_APIKEY')}&q={f"{latitud},{longitud}"}&days=3&aqi=no&alerts=yes&lang=es"
    respuesta = requests.get(url)

    if respuesta.status_code == 200:
        return await limpiezaDatosPronostico(respuesta.json(), url.split("&days")[0])
    else:
        return {"error": f"Error en la solicitud: {respuesta.status_code}"}

async def limpiezaDatosPronostico(pronostico, url: str):
    urlSolicitud = url.replace("forecast.json", "astronomy.json") + f"&dt={f"{datetime.now().date()}"}"
    respuesta = requests.get(urlSolicitud)

    if respuesta.status_code == 200:
        jsonRespuesta = respuesta.json()

        fechaAtardecerModificada = str(jsonRespuesta["astronomy"]["astro"]["sunset"]).replace(" PM", "")
        fechaAtardecerModificada = str(int(fechaAtardecerModificada.split(":")[0]) + 12) + ":" + fechaAtardecerModificada.split(":")[1]

        datosAstronomia = {
            "amanecer": str(jsonRespuesta["astronomy"]["astro"]["sunrise"]).replace(" AM", ""),
            "atardecer": fechaAtardecerModificada,
            "fase_lunar": FASES_LUNA.get(str(jsonRespuesta["astronomy"]["astro"]["moon_phase"])),
        }

    previsionHoy = pronostico["forecast"]["forecastday"][0]

    return {
        "ubicacion": pronostico["location"]["name"],
        "pais": pronostico["location"]["country"],
        "hora_local": pronostico["location"]["localtime"],
        "ultima_actualizacion": pronostico["current"]["last_updated"],
        "clima_actual": {
            "temperatura_c": str(pronostico["current"]["temp_c"]).split(".")[0],
            "temperatura_f": str(pronostico["current"]["temp_f"]).split(".")[0],
            "viento_kmh": pronostico["current"]["wind_kph"],
            "viento_mph": pronostico["current"]["wind_mph"],
            "viento_grados": pronostico["current"]["wind_degree"],
            "viento_direccion": DIR_VIENTO.get(str(pronostico["current"]["wind_dir"])),
            "sensacion_c": str(pronostico["current"]["feelslike_c"]).split(".")[0],
            "sensacion_f": str(pronostico["current"]["feelslike_f"]).split(".")[0],
            "presion_mb": str(pronostico["current"]["pressure_mb"]).split(".")[0],
            "presion_in": str(pronostico["current"]["pressure_in"]).split(".")[0],
            "condicion": pronostico["current"]["condition"]["text"],
            "humedad": pronostico["current"]["humidity"],
            "icono": await sustituirIconoTiempo(str(pronostico["current"]["condition"]["icon"])[-7:].replace(".png",""), -1),
        },
        "pronostico_actual": [
            {
                "hora": str(h["time"]).split(" ")[1], 
                "temp_c": str(h["temp_c"]).split(".")[0],
                "temp_f": str(h["temp_f"]).split(".")[0],
                "condicion": h["condition"]["text"],
                "icono": await sustituirIconoTiempo(str(h["condition"]["icon"])[-7:].replace(".png",""), int(h["is_day"])),
            } for h in previsionHoy["hour"]
        ],
        "pronostico_semanal": [
            {
                "fecha": datetime.fromisoformat(str(dia["date"])).strftime('%A').capitalize() + " " + str(dia["date"]).split("-")[2],
                "max_temp_c": str(dia["day"]["maxtemp_c"]).split(".")[0],
                "max_temp_f": str(dia["day"]["maxtemp_f"]).split(".")[0],
                "min_temp_c": str(dia["day"]["mintemp_c"]).split(".")[0],
                "min_temp_f": str(dia["day"]["mintemp_f"]).split(".")[0],
                "prob_lluvia": dia["day"]["daily_chance_of_rain"],
                "prob_nieve": dia["day"]["daily_chance_of_snow"],
                "condicion": dia["day"]["condition"]["text"],
                "icono": await sustituirIconoTiempo(str(dia["day"]["condition"]["icon"])[-7:].replace(".png",""), 1),
            } for dia in pronostico["forecast"]["forecastday"]
        ],
        "astronomia": datosAstronomia,
        "alertas": [
            {
                "tipo": await traducirTexto(str(alerta["msgtype"])),
                "gravedad": await traducirTexto(str(alerta["severity"])),
                "areas": alerta["areas"],
                "evento": alerta["event"],
                "fechaEfectiva": alerta["effective"],
                "fechaExpiracion": alerta["expires"],
                "descripcion": alerta["desc"],
                "instruccion": alerta["instruction"],
            } for alerta in reversed(pronostico["alerts"]["alert"])
        ]
    }

async def sustituirIconoTiempo(numIcono: str, esDia: int):
    if numIcono == "113" or numIcono == "116":
        if esDia == 1: numIcono = numIcono + "_A"
        else: numIcono = numIcono + "_B"

    iconoMDI = ICONOS_TIEMPO.get(numIcono)
    if iconoMDI:
        return iconoMDI
    else:
        return "weather-cloudy-alert"
    
async def traducirTexto(cadena: str):
    if cadena == "Alert":
        return "Alerta"
    elif cadena == "Update":
        return "Actualización"
    elif cadena == "Severe":
        return "Alta"
    elif cadena == "Moderate":
        return "Moderada"