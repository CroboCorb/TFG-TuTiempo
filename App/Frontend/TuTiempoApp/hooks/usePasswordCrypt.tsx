export default function encriptar(cadena: string) {
    const CryptoJS = require("crypto-js");
    return CryptoJS.SHA256(cadena).toString()
}