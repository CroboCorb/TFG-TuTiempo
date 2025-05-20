export type InfoMeteorologia = {
    ubicacion: string,
    pais: string,
    hora_local: string,
    clima_actual: {
        temperatura_c: string,
        temperatura_f: string,
        viento_kmh: string,
        viento_mph: string,
        viento_grados: string,
        viento_direccion: string,
        sensacion_c: string,
        sensacion_f: string,
        presion_mb: string,
        presion_in: string,
        condicion: string,
        humedad: string,
        icono: string,
    },
    pronostico_actual: {
        hora: string, 
        temp_c: string,
        temp_f: string,
        condicion: string,
        icono: string,
    },
    pronostico_semanal: {
        fecha: string,
        max_temp_c: string,
        max_temp_f: string,
        min_temp_c: string,
        min_temp_f: string,
        prob_lluvia: string,
        prob_nieve: string,
        condicion: string,
        icono: string,
    },
    astronomia: {
        amanecer: string,
        atardecer: string,
        fase_lunar: string,
    },
    // alertas: {

    // }
}