import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, FlatList, Dimensions } from "react-native";
import { useTheme, Appbar, Snackbar } from "react-native-paper";

import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";

import CabeceraCentrada from "@/components/CabeceraCentrada";
import PantallaCiudad from "@/components/PantallaCiudad";
import PantallaCarga from "@/components/PantallaCarga";

import * as GestorAsyncStorage from "@/functions/GestorAsyncStorage";
import {
  infoSegunCardinalidad_API,
  infoSegunNombre_API,
} from "@/functions/GestorAPI";
import { UbicacionActual } from "@/functions/GestorUbicacion";

import { Configuracion } from "@/types/Configuracion";
import { Ciudad } from "@/types/ListadoCiudades";

const ANCHO_PANTALLA = Dimensions.get("window").width;
const CONN_ERROR = "Hubo un error en la conexión.";

export default function PantallaTiempo() {
  const theme = useTheme();

  // Constantes de control de carga y actualización
  const esPrimeraCarga = useRef(true);
  const [cargando, setEstadoCarga] = useState(true);

  // Constantes de datos del usuario
  const [configuracion, setConfiguracion] = useState<Configuracion>({
    unidadTemperatura: "celsius",
    unidadMedidaViento: "kmh",
    unidadMedidaPresion: "hPa",
    notificacionesActivadas: false,
  });
  const [listadoCiudades, setListadoCiudades] = useState<Ciudad[]>([]);

  // Constantes de control de errores de Snackbar
  const [snackbarError, setSnackbarError] = useState(false);
  const [snackbarErrorTXT, setSnackbarErrorTXT] = useState("");
  const [controlRefrescoFlatlist, setControlRefrescoFlatlist] =
    useState<number>();

  /** Método de carga de la configuración del usuario. */
  const cargarConfig = async () => {
    try {
      const config = await GestorAsyncStorage.cargarConfiguracion();
      if (config) {
        setConfiguracion(JSON.parse(config));
        console.info("INDEX > Configuración cargada correctamente.");
      }
    } catch (e) {
      console.error("OPTIONS > Error al cargar la configuración:", e);
    }
  };

  /**
   * Método de carga del listado de ciudades del usuario.
   * @returns Listado de ciudades del usuario, nulo si es vacío.
   */
  const cargarCiudades = async (): Promise<Ciudad[] | null> => {
    try {
      const ciudades = await GestorAsyncStorage.cargarListadoCiudades();
      if (ciudades) {
        setListadoCiudades(ciudades);
        console.info("INDEX > Ciudades cargadas correctamente.");

        return ciudades;
      } else return null;
    } catch (e) {
      console.error("INDEX > Error al cargar las ciudades: ", e);
      return null;
    }
  };

  // Renderizado inicial
  useEffect(() => {
    const inicializar = async () => {
      try {
        await cargarConfig();
        const ciudades = await cargarCiudades();

        if (!ciudades) await obtenerUbicacionInicial();
        else await actualizarTodasLasCiudades(ciudades);

        setEstadoCarga(false);
      } catch (e) {
        console.error("Error durante la inicialización:", e);
      }
    };

    if (cargando) inicializar();
  }, [cargando]);

  // Actualizar al enfocar
  useFocusEffect(
    useCallback(() => {
      if (esPrimeraCarga.current) {
        esPrimeraCarga.current = false;
        return;
      }

      cargarConfig();
      cargarCiudades();
    }, [])
  );

  /**
   * Método encargado de inicializar la configuración del usuario y obtener
   * la información meteorológica de su ciudad actual a través de su
   * ubicación, agregándolo al listado en caso de haber recibido su
   * ubicación y los datos pertinentes, o forzando a que agregue
   * una ciudad manualmente en caso de error. */
  const obtenerUbicacionInicial = async () => {
    const inicializacionConfig = await GestorAsyncStorage.guardarConfiguracion(
      JSON.stringify(configuracion)
    );
    if (inicializacionConfig)
      console.log("INDEX > Configuración inicializada.");
    else console.error("INDEX > Error de inicialización de configuración.");

    let resultado;
    const ubicacionActual = await UbicacionActual();

    if (ubicacionActual) {
      resultado = await infoSegunCardinalidad_API(
        ubicacionActual[0].toString(),
        ubicacionActual[1].toString()
      );
    }

    if (resultado && resultado.status === 200) {
      const nuevaCiudad: Ciudad = {
        nombre: resultado.data.ubicacion,
        usaUbicacion: true,
        ultimaActualizacion: new Date(),
        meteorologia: resultado.data,
      };

      const valorRetorno = await GestorAsyncStorage.actualizarListadoCiudades(
        nuevaCiudad
      );
      if (valorRetorno) {
        setListadoCiudades(valorRetorno);
        console.log("INDEX > Listado de ciudades inicializado correctamente.");
      } else
        console.error("INDEX > Error al actualizar el listado de ciudades.");
    } else if (!resultado || (resultado && resultado.status !== 200)) {
      setSnackbarError(true);

      if (!resultado) setSnackbarErrorTXT(CONN_ERROR);
      else if (resultado && resultado.status !== 200)
        router.replace("/ciudades");
    }
  };

  /**
   * Método encargado de actualizar la información meteorológica de
   * todas las ciudades guardadas en el listado, controlando si fueron
   * guardadas como ubicación (para actualizar la ciudad en caso necesario)
   * o no (para actualizar los datos según el nombre y región).
   * @param ciudades Listado de ciudades del usuario.
   */
  const actualizarTodasLasCiudades = async (ciudades: Ciudad[]) => {
    const ciudadesActualizadas: Ciudad[] = [];

    for (const ciudad of ciudades) {
      // Si la última actualización fue hace más de 15 minutos, solicita actualización
      if (
        (new Date().getTime() - new Date(ciudad.ultimaActualizacion).getTime()) / 6000 >=
        15
      ) {
        try {
          let respuesta;

          if (ciudad.usaUbicacion) {
            const ubicacionActual = await UbicacionActual();
            if (ubicacionActual) {
              respuesta = await infoSegunCardinalidad_API(
                ubicacionActual[0].toString(),
                ubicacionActual[1].toString()
              );
            }
          } else respuesta = await infoSegunNombre_API(ciudad.nombre);

          if (respuesta?.status === 200) {
            ciudadesActualizadas.push({
              ...ciudad,
              ultimaActualizacion: new Date(),
              meteorologia: respuesta.data,
            });
            console.info(
              `INDEX > Datos de ciudad actualizada: ${ciudad.nombre}`
            );
          } else {
            ciudadesActualizadas.push(ciudad);
            console.warn(
              `INDEX > Datos de ciudad sin actualizar: ${ciudad.nombre}`
            );
          }
        } catch (e) {
          ciudadesActualizadas.push(ciudad);
          console.error(
            `INDEX > Error al actualizar los datos de ${ciudad.nombre}: ${e}`
          );
        }
      } else ciudadesActualizadas.push(ciudad);
    }

    const nuevoListado =
      await GestorAsyncStorage.actualizarListadoCiudadesCompleto(
        ciudadesActualizadas
      );
    if (nuevoListado) setListadoCiudades(nuevoListado);
    else setListadoCiudades(ciudadesActualizadas);
  };

  /**
   * Método encargado de manejar la actualización de datos de la
   * Flatlist al recargar el listado y enviar un valor de refresco.
   * @param index Índice de ciudad que solicitó una actualización.
   */
  const manejarActualizacionCiudad = (index: number) => {
    const recargaCiudades = async () => {
      const ciudades = await GestorAsyncStorage.cargarListadoCiudades();
      if (ciudades) {
        setListadoCiudades(ciudades);
        setControlRefrescoFlatlist(Date.now());
        console.info(
          "INDEX > Datos de ciudad en índice",
          index,
          "actualizados."
        );
      }
    };

    recargaCiudades();
  };

  // =====================================

  if (cargando) return <PantallaCarga />;

  return listadoCiudades.length >= 1 ? (
    <View style={{ flex: 1, backgroundColor: theme.colors.primary }}>
      <StatusBar
        style="light"
        backgroundColor={theme.colors.primary}
        translucent={false}
      />

      <FlatList
        data={listadoCiudades}
        extraData={controlRefrescoFlatlist}
        horizontal
        pagingEnabled
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.nombre}
        renderItem={({ item, index }) => (
          <View style={{ width: ANCHO_PANTALLA }}>
            <PantallaCiudad
              infoMeteorologia={item.meteorologia}
              configuracion={configuracion}
              ultimaActualizacion={item.ultimaActualizacion}
              esPorUbicacion={item.usaUbicacion}
              onUpdate={() => manejarActualizacionCiudad(index)}
            />
          </View>
        )}
      />
    </View>
  ) : (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar
        style="light"
        backgroundColor={theme.colors.primary}
        translucent={false}
      />
      <Appbar.Header
        style={{
          backgroundColor: theme.colors.primary,
          position: "absolute",
          marginTop: 0,
          marginBottom: -63,
          zIndex: 10,
        }}
      >
        <Appbar.Action
          icon="plus"
          iconColor={theme.colors.surface}
          style={{ backgroundColor: theme.colors.onPrimaryContainer }}
          onPress={async () => router.navigate("/ciudades")}
        />
        <CabeceraCentrada
          title={""}
          style={{ color: theme.colors.surface, fontWeight: "bold" }}
          variant="titleLarge"
        />
        <Appbar.Action
          icon="cog"
          iconColor={theme.colors.surface}
          style={{ backgroundColor: theme.colors.onPrimaryContainer }}
          onPress={async () => router.navigate("/options")}
        />
      </Appbar.Header>
      <View style={{ backgroundColor: theme.colors.background }} />
      <Snackbar
        visible={snackbarError}
        onDismiss={async () => {
          setSnackbarError(false);
        }}
      >
        {snackbarErrorTXT}
      </Snackbar>
    </View>
  );
}
