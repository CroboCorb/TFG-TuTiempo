import GetLocation from 'react-native-get-location'

export async function ubicacionActual() {
    GetLocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 60000,
    })
    .then(location => {
        return location
    })
    .catch(error => {
        return error;
    })
}