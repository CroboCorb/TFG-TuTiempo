import { Ciudad } from "@/types/Ciudad";
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
export async function cargarListadoCiudades(): Promise<Ciudad[] | null> {
  try {
    const ciudades = await AsyncStorage.getItem(CIUDADES);
    return ciudades ? JSON.parse(ciudades) : null;
  } catch {
    return null;
  }
}

/**
 * Actualiza el listado de ciudades (listadoOriginal) para agregar la nueva ciudad
 * (o actualizar sus datos), comparando cadenas normalizadas, comprobando existencia
 * y coincidencia de ciudades, alternando valores de "usaUbicacion" y reordenándolo.
 * @param nuevaCiudad Nueva ciudad a añadir o actualizar en el listado.
 * @returns Listado de ciudades modificado con la nueva ciudad, nulo en caso de error.
 */
export async function actualizarListadoCiudades(
  nuevaCiudad: Ciudad
): Promise<Ciudad[] | null> {
  try {
    let nuevoListado: Ciudad[] = [];
    const listadoCiudades = await cargarListadoCiudades();

    if (listadoCiudades) {
      const existe = listadoCiudades.some(
        (ciudad) =>
          normalizarTexto(ciudad.nombre) === normalizarTexto(nuevaCiudad.nombre)
      );

      if (existe) {
        nuevoListado = listadoCiudades.map((ciudad) => {
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
        nuevoListado = listadoCiudades.map((ciudad) =>
          nuevaCiudad.usaUbicacion ? { ...ciudad, usaUbicacion: false } : ciudad
        );
        nuevoListado.push(nuevaCiudad);
      }

      nuevoListado = nuevoListado.sort(
        (a, b) => (b.usaUbicacion ? 1 : 0) - (a.usaUbicacion ? 1 : 0)
      );
      await AsyncStorage.setItem(CIUDADES, JSON.stringify(nuevoListado));
      return nuevoListado;
    } else {
      nuevoListado.push(nuevaCiudad);
      await AsyncStorage.setItem(CIUDADES, JSON.stringify(nuevoListado));
      return nuevoListado;
    }
  } catch (error) {
    return null;
  }
}

/**
 *
 * @param listadoCiudadesActualizadas
 * @returns
 */
export async function actualizarListadoCiudadesCompleto(
  listadoCiudadesActualizadas: Ciudad[]
): Promise<Ciudad[] | null> {
  try {
    await AsyncStorage.setItem(
      CIUDADES,
      JSON.stringify(
        listadoCiudadesActualizadas.sort(
          (a, b) => (b.usaUbicacion ? 1 : 0) - (a.usaUbicacion ? 1 : 0)
        )
      )
    );

    const listado = await AsyncStorage.getItem(CIUDADES);
    return listado ? JSON.parse(listado) : null;
  } catch {
    return null;
  }
}
