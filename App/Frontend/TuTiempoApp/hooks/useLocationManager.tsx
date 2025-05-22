import * as Location from 'expo-location';

/**
 * Método de comprobación de permisos de ubicación
 * @returns Verdadero si el permiso está concedido, falso en caso contrario
 */
export async function ComprobarPermisosUbicacion() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted' ? true : false;
}

/**
 * Método encargado de devolver la ubicación aproximada (a 1km) del usuario
 * @returns Array con latitud y longitud actual del usuario
 */
export async function UbicacionActual() {
  if (await ComprobarPermisosUbicacion()) {
    const location = await Location.getCurrentPositionAsync({accuracy: Location.Accuracy.Low});
    return [location.coords.latitude, location.coords.longitude];
  }
}