import axios from "axios";

// ========== CONSTANTES ==========

const REQUEST_TIMEOUT = 5000;

const API_URL = "http://10.244.23.195:8000";

const API_LISTADOCREDENCIALES = API_URL + "/credenciales";
const API_LOGIN = API_URL + "/credenciales/login";
const API_REGISTRO = API_URL + "/credenciales/registrar";

const API_LISTADOTOKENS = API_URL + "/tokens/";
const API_VERIFICARTOKEN = API_URL + "/tokens/verificar";

const API_METEOROLOGIA_CIUDAD = API_URL + "/meteorologia/ciudad";
const API_METEOROLOGIA_CARDINALIDAD = API_URL + "/meteorologia/cardinalidad";

// ========== MÉTODOS ==========

/**
 * Solicita a la API todas las credenciales almacenadas en la BBDD
 * @param token Token JWT de autorización
 * @returns JSON con listado de credenciales, aviso en caso de error
 */
export const listadoCredenciales_API = async (token: string) => {
  try {
    const respuesta = await axios.get(API_LISTADOCREDENCIALES, {
      timeout: REQUEST_TIMEOUT,
      headers: { Authorization: `Bearer ${token}` },
      params: { token: token },
    });

    return respuesta;
  } catch (err: any) {
    if (err.status === 503)
      return {
        status: 503,
        mensaje: "No se pudo establecer conexión con el servidor.",
      };
    else if (err.status === 404)
      return { status: 404, mensaje: "Datos no encontrados." };
  }
};

/**
 * Solicita a la API todos los tokens almacenados en la BBDD
 * @param token Token JWT de autorización
 * @returns JSON con listado de tokens, aviso en caso de error
 */
export const listadoTokens_API = async (token: string) => {
  try {
    const respuesta = await axios.get(API_LISTADOTOKENS, {
      timeout: REQUEST_TIMEOUT,
      headers: { Authorization: `Bearer ${token}` },
      params: { token: token },
    });

    return respuesta;
  } catch (err: any) {
    if (err.status === 503)
      return {
        status: 503,
        mensaje: "No se pudo establecer conexión con el servidor.",
      };
    else if (err.status === 404)
      return { status: 404, mensaje: "Datos no encontrados." };
  }
};

/**
 * Método para la comprobación del inicio de sesión
 * @param username Nombre del usuario
 * @param password Contraseña del usuario, encriptada en SHA-256
 * @returns Token del usuario si el logueo es correcto, mensaje de error en caso contrario
 */
export const iniciarSesion_API = async (username: string, password: string) => {
  try {
    const respuesta = await axios.post(
      API_LOGIN,
      { username, password },
      {
        timeout: REQUEST_TIMEOUT,
        headers: { "Content-Type": "application/json" },
      }
    );

    return respuesta;
  } catch (err: any) {
    if (err.status === 503)
      return {
        status: 503,
        mensaje: "No se pudo establecer conexión con el servidor.",
      };
    else if (err.status === 404)
      return { status: 404, mensaje: "Datos no encontrados." };
  }
};

/**
 * Método para registrar a un nuevo administrador
 * @param username Nombre del usuario administrador
 * @param password Contraseña del usuario administrador, encriptada en SHA-256
 * @param userid ID del usuario asociado
 * @returns Mensaje de respuesta
 */
export const registrarUsuario_API = async (
  token: string,
  username: string,
  password: string
) => {
  try {
    const respuesta = await axios.put(
      API_REGISTRO,
      { username: username, password: password },
      {
        timeout: REQUEST_TIMEOUT,
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return respuesta;
  } catch (err: any) {
    if (err.message === "Network Error")
      return {
        status: 503,
        mensaje: "No se pudo establecer conexión con el servidor.",
      };
  }
};

/**
 * Método para la verificación del token JWT de sesión
 * @param token Token JWT del usuario
 * @returns Token en caso correcto, mensaje de error en caso contrario
 */
export const verificarToken_API = async (token: string) => {
  try {
    const respuesta = await axios.get(API_VERIFICARTOKEN, {
      timeout: REQUEST_TIMEOUT,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        token: token,
      },
    });

    return respuesta;
  } catch (err: any) {
    if (err.status === 503)
      return {
        status: 503,
        mensaje: "No se pudo establecer conexión con el servidor.",
      };
  }
};

/**
 * Método encargado de consultar los datos meteorológicos de la ciudad solicitada
 * @param ciudadRegionYPais Nombre de la ciudad (+ región y país) a buscar
 * @returns JSON con datos meteorológicos
 */
export const infoSegunNombre_API = async (ciudadRegionYPais: string) => {
  try {
    const respuesta = await axios.get(API_METEOROLOGIA_CIUDAD, {
      timeout: REQUEST_TIMEOUT,
      params: { ciudadRegionYPais: ciudadRegionYPais },
    });

    return respuesta;
  } catch (err: any) {
    if (err.status === 503)
      return {
        status: 503,
        mensaje: "No se pudo establecer conexión con el servidor.",
      };
    else if (err.status === 404)
      return { status: 404, mensaje: "Datos no encontrados." };
  }
};

/**
 * Método encargado de consultar los datos meteorológicos de la
 * ciudad más cercana a la ubicación actual del usuario
 * @param latitud Latitud del usuario
 * @param longitud Longitud del usuario
 * @returns JSON con datos meteorológicos
 */
export const infoSegunCardinalidad_API = async (
  latitud: string,
  longitud: string
) => {
  try {
    const respuesta = await axios.get(API_METEOROLOGIA_CARDINALIDAD, {
      timeout: REQUEST_TIMEOUT,
      params: { latitud: latitud, longitud: longitud },
    });

    return respuesta;
  } catch (err: any) {
    if (err.status === 503)
      return {
        status: 503,
        mensaje: "No se pudo establecer conexión con el servidor.",
      };
    else if (err.status === 404)
      return { status: 404, mensaje: "Datos no encontrados." };
  }
};
