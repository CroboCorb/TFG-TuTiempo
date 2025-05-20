import * as Location from 'expo-location';

export async function UbicacionActual() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permiso denegado para acceder a la ubicación');
  }

  const location = await Location.getCurrentPositionAsync({accuracy: Location.Accuracy.Balanced});
  return [location.coords.latitude, location.coords.longitude];
}