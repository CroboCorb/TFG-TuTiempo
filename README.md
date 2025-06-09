# Tu Tiempo

> Proyecto de fin de grado de Desarrollo de Aplicaciones Multiplataforma del **IES Martínez Montañés**, el cual obtiene la ubicación actual del usuario *(o la solicitada)* y obtiene la previsión meteorológica de los próximos tres días, presentando dichos datos en una interfaz amigable.

---

## ⚙️ Tecnologías

* **Frontend**: React Expo `(SDK 52)`
* **Backend**: FastAPI con autenticación JWT
* **Base de Datos**: PostgreSQL 15

---

## 🚀 Instalación local

Para ejecutar una instalación local, se requiere **[Node.JS](https://nodejs.org/es/download)** v22.16.0 y **[Python](https://www.python.org/downloads/release/python-3134/)** v3.13.4.

### 1. Clonación del proyecto

```bash
git clone https://github.com/CroboCorb/TFG-TuTiempo.git
cd TFG-TuTiempo
```

### 2. Backend - FastAPI

```bash
cd .\App\Backend\
python -m venv .venv
pip install -r requirements.txt
```

Edita `.env_example` con tus valores *('WEATHER_API_KEY' debe de ser una clave API de ***[WeatherAPI](https://www.weatherapi.com/)***)*:

```env
BBDD_ASYNC=postgresql+asyncpg://<usuario>:<contraseña>@<IP>/<bbdd>
BBDD_SYNC=postgresql://<usuario>:<contraseña>@<IP>/<bbdd>

ENCRYPTION_KEY=<Clave de encriptación>
INITIAL_ADMIN_PWD=<Contraseña en SHA-256 con ENCRYPTION_KEY de salteado>

WEATHER_APIKEY=<Clave API>
```

Ejecuta el servidor:

* Windows:

```console
.\.venv\Scripts\activate
fastapi run main.py
```

* Linux:

```bash
source .venv/bin/activate
fastapi run main.py
```

### 3. Frontend - React Expo

```bash
cd ..\Frontend\
npm install
```

Tras la instalación de los paquetes, abre el archivo `GestorAPI.tsx` localizado en la carpeta `functions`, y cambia \<IP DEL SERVIDOR> por tu dirección IP interna:

```typescript
const API_URL = "http://\<IP DEL SERVIDOR>:8000";
```

Guarda los cambios y ejecuta React Expo:

```bash
npx expo start

--go: Si quieres usar la aplicación Expo Go
--dev: Si quieres usar la aplicación de desarrollo
```

---

### 📝 Anexo

* Para compilar una build de producción, [lee la guía oficial](https://docs.expo.dev/guides/local-app-production/).
* Para compilar una build de desarrollo, usa el siguiente comando:

```bash
npx expo run:android
```

## 🛠️ TODO / A implementar

* Uso de gráficas para la previsión de 3 días.
* Temas preestablecidos y personalizables.
* Actualizaciones periodicas con notificaciones.
* Sonidos opcionales de ambiente según el tiempo actual.
