import * as Location from 'expo-location';

/**
 * Método de comprobación de permisos y servicios de ubicación
 * @returns Verdadero si el permiso está concedido y la ubicación
 * se encuentra activada, falso en caso contrario
 */
export async function ComprobarUbicacionActivada() {
  const { granted } = await Location.requestForegroundPermissionsAsync();  
  const locationEnabled = await Location.hasServicesEnabledAsync();
  return granted && locationEnabled ? true : false;
}

/**
 * Método encargado de devolver la ubicación aproximada (a 1km) del usuario
 * @returns Array con latitud y longitud actual del usuario, null si
 * el usuario no tiene la ubicación activada
 */
export async function UbicacionActual() {
  if (await ComprobarUbicacionActivada()) {
    const location = await Location.getCurrentPositionAsync({accuracy: Location.Accuracy.Balanced, mayShowUserSettingsDialog: false});
    return [location.coords.latitude, location.coords.longitude];
  } else return null;
}