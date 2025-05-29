import { Ciudad } from "@/types/ListadoCiudades";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizarTexto } from "./Utilidades";

const CIUDADES = "user_cities";
const CONFIG = "user_config";

/**
 * Método encargado de cargar la configuración almacenado AsyncStorage
 * @returns Cadena con la configuración si existiese,
 * nulo en caso de no existir o en caso de error
 */
export async function cargarConfiguracion(): Promise<string | null> {
  try {
    const configuracion = await AsyncStorage.getItem(CONFIG);
    return configuracion;
  } catch {
    return null;
  }
}

/**
 * Método encargado de guardar la configuración del usuario.
 * @param configuracion Configuración a guardar en AsyncStorage, convertido a cadena.
 * @returns Verdadero si se ha guardado correctamente, falso en caso contrario.
 */
export async function guardarConfiguracion(
  configuracion: string
): Promise<boolean> {
  try {
    await AsyncStorage.setItem(CONFIG, configuracion);
    return true;
  } catch {
    return false;
  }
}

// --------------------------

/**
 * Método encargado de cargar el listado de ciudades almacenado en AsyncStorage
 * @returns Cadena guardada de ciudades en AsyncStorage, nulo en caso de no existir
 */
export async function cargarListadoCiudades(): Promise<string | null> {
  try {
    const ciudades = await AsyncStorage.getItem(CIUDADES);
    return ciudades;
  } catch {
    return null;
  }
}

/**
 * Actualiza el listado de ciudades (listadoOriginal) para agregar la nueva ciudad
 * (o actualizar sus datos), comparando cadenas normalizadas, comprobando existencia
 * y coincidencia de ciudades, alternando valores de "usaUbicacion" y reordenándolo.
 * @param listadoOriginal Listado original de ciudades.
 * @param nuevaCiudad Nueva ciudad a añadir o actualizar en el listado.
 * @param usaUbicacion Determina si los datos se obtuvieron por geolocalización.
 * @returns Listado de ciudades modificado con la nueva ciudad, nulo en caso de error.
 */
export async function actualizarListadoCiudades(listadoOriginal: Ciudad[], nuevaCiudad: Ciudad, usaUbicacion: boolean): Promise<Ciudad[] | null> {
  try {
    const existe = listadoOriginal.some(
      (ciudad) =>
        normalizarTexto(ciudad.nombre) ===
        normalizarTexto(nuevaCiudad.nombre)
    );

    let nuevoListado: Ciudad[] = [];

    if (existe) {
      nuevoListado = listadoOriginal.map((ciudad) => {
        const mismaCiudad =
          normalizarTexto(ciudad.nombre) ===
          normalizarTexto(nuevaCiudad.nombre);

        if (mismaCiudad)
          return {
            ...nuevaCiudad,
            usaUbicacion: ciudad.usaUbicacion || nuevaCiudad.usaUbicacion,
          };

        return nuevaCiudad.usaUbicacion
          ? { ...ciudad, usaUbicacion: false }
          : ciudad;
      });
    } else {
      nuevoListado = listadoOriginal.map((ciudad) =>
        nuevaCiudad.usaUbicacion
          ? { ...ciudad, usaUbicacion: false }
          : ciudad
      );
      nuevoListado.push(nuevaCiudad);
    }

    await AsyncStorage.setItem(CIUDADES, JSON.stringify(nuevoListado));

    return nuevoListado.sort(
      (a, b) => (b.usaUbicacion ? 1 : 0) - (a.usaUbicacion ? 1 : 0)
    );
  } catch (error) {
    return null
  }
}
