import * as Crypto from "expo-crypto";

/**
 * Elimina los diacríticos del texto introducido
 * @param texto Texto a normalizar
 * @returns Texto normalizado
 */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Encripta el texto recibido a SHA-256
 * @param cadena Cadena a encriptar
 * @returns Cadena encriptada en SHA-256
 */
export default async function encriptarTexto(cadena: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    cadena
  );
}