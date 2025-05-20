/**
 * Metodo de encriptación de cadenas
 * @param cadena Cadena a encriptar a SHA-256
 * @returns Cadena encriptada en SHA-256
 */
export default function encriptar(cadena: string) {
    const CryptoJS = require("crypto-js");
    return CryptoJS.SHA256(cadena).toString()
}