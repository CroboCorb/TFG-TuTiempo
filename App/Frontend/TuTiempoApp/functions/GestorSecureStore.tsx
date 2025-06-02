import * as SecureStore from "expo-secure-store";
import { verificarToken_API } from "./GestorAPI";

const TOKEN = "user_token";

/**
 * Intenta cargar el token guardado en SecureStore, y si existiese,
 * lo verifica con la API para comprobar su validez.
 * @returns Token si existe y es válido, nulo en caso contrario.
 */
export async function cargarToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync(TOKEN);
  if (token) {
    const respuesta = await verificarToken_API(token);
    if (respuesta && respuesta.status === 200)
      return token;
    else {
      await SecureStore.deleteItemAsync(TOKEN);
      return null;
    }
  } else 
    return null;
}

/**
 * Guarda el token recibido en SecureStore
 * @param tokenAGuardar Token a guardar en SecureStore
 * @returns Verdadero si el valor se ha guardado, falso en caso contrario.
 */
export async function guardarToken(tokenAGuardar: string): Promise<boolean> {
  await SecureStore.setItemAsync(TOKEN, tokenAGuardar);
  const token = await cargarToken();
  if (token) return true;
  else return false;
}

/**
 * Elimina el token del usuario de SecureStore
 * @returns Verdadero si el token no existe tras la eliminación, falso en caso contrario.
 */
export async function eliminarToken() {
  await SecureStore.deleteItemAsync(TOKEN);
  const token = await cargarToken();
  if (!token) console.info('SecureStore > Token eliminado correctamente.');
  else console.error('SecureStore > Token del usuario no eliminado correctamente.');
}