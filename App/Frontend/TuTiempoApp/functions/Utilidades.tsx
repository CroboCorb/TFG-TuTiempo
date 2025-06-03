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
  const valor = parseFloat(valorEnKmh);
  switch (tipoMedida) {
    case "beaufort":
      const beaufort = await calcularEscalaBeaufort(valor);
      return `${beaufort} bft`;
    case "kmh":
      return `${valor.toFixed(1)} km/h`;
    case "mph":
      return `${(valor * 0.621371).toFixed(1)} mph`;
    case "ms":
      return `${(valor / 3.6).toFixed(1)} m/s`;
    case "kn":
      return `${(valor / 1.852).toFixed(1)} kn`;
    default:
      return `${valor.toFixed(1)} km/h`;
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
  const valor = parseFloat(valorEnMbar);
  switch (tipoMedida) {
    case "hPa":
      return `${valorEnMbar} hPa`;
    case "mmHg":
      return `${(valor * 0.750062).toFixed(2)} mmHg`;
    case "inHg":
      return `${(valor * 0.0393701).toFixed(2)} inHg`
    case "atm":
      return `${(valor / 1013.25).toFixed(2)} atm`;
    default:
      return "";
  }
}