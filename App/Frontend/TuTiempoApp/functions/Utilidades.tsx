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
export async function encriptarTexto(cadena: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    cadena
  );
}

/**
 * 
 * @param tipoMedida 
 * @param valorEnKmh 
 * @returns 
 */
export async function convertirMedidaViento(
  tipoMedida: string,
  valorEnKmh: string
): Promise<string> {
  switch (tipoMedida) {
    case "beaufort":
      return (await calcularEscalaBeaufort(parseFloat(valorEnKmh))).toString();
    case "kmh":
      return valorEnKmh;
    case "mph":
      return (parseFloat(valorEnKmh) * 0.621371).toFixed(2);
    case "ms":
      return (parseFloat(valorEnKmh) / 3.6).toFixed(2);
    case "kn":
      return (parseFloat(valorEnKmh) / 1.852).toFixed(2);
    default:
      return "";
  }
}

/**
 * 
 * @param valorEnKmh 
 * @returns 
 */
async function calcularEscalaBeaufort(valorEnKmh: number): Promise<number> {
  const escalas = [
    { max: 1, nivel: 0 },
    { max: 5, nivel: 1 },
    { max: 11, nivel: 2 },
    { max: 19, nivel: 3 },
    { max: 28, nivel: 4 },
    { max: 38, nivel: 5 },
    { max: 49, nivel: 6 },
    { max: 61, nivel: 7 },
    { max: 74, nivel: 8 },
    { max: 88, nivel: 9 },
    { max: 102, nivel: 10 },
    { max: 117, nivel: 11 },
  ];

  for (const escala of escalas) 
    if (valorEnKmh <= escala.max) return escala.nivel;
  return 12;
}

/**
 * 
 * @param tipoMedida 
 * @param valorEnMbar 
 */
export async function convertirMedidaPresion(
  tipoMedida: string,
  valorEnMbar: string
): Promise<string> {
  switch (tipoMedida) {
    case "hPa":
      return valorEnMbar;
    case "mmHg":
      return (parseFloat(valorEnMbar) * 0.750062).toFixed(2);
    case "atm":
      return (parseFloat(valorEnMbar) / 1013.25).toFixed(2);
    default:
      return "";
  }
}