import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, StatusBar, FlatList, Dimensions } from "react-native";
import { useTheme, Appbar, Snackbar } from "react-native-paper";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";

import CabeceraCentrada from "@/components/CabeceraCentrada";
import PantallaCiudad from "@/components/PantallaCiudad";
import PantallaCarga from "@/components/PantallaCarga";

import { UbicacionActual } from "@/hooks/useLocationManager";
import { consultaMeteorologiaPorCardinalidad_API } from "@/hooks/useAPIManager";

import { InfoMeteorologia } from "@/types/InfoMeteorologia";
import { Configuracion } from "@/types/Configuracion";
import { Ciudad } from "@/types/ListadoCiudades";

// CONSTANTES DE VENTANA
const CIUDADES = "@usrCities";
const CONFIG = "@appConfig";

const CONN_ERROR =
  "Hubo un error en la conexión. Inténtelo de nuevo más tarde.";
const LOCATION_ERROR =
  "Hubo un error al procesar su ubicación. Añada su ciudad manualmente.";

// FUNCIÓN PRINCIPAL DEL PROGRAMA
export default function PantallaTiempo() {
  const theme = useTheme();

  // Valores de configuración del usuario por defecto
  const [configuracion, setConfiguracion] = useState<Configuracion>({
    unidadTemperatura: "celsius",
    unidadMedidaViento: "kmh",
    unidadMedidaPresion: "mb",
  });

  const esPrimeraCarga = useRef(true);
  const [cargando, setEstadoCarga] = useState(true);
  const [recarga, setRecarga] = useState(false);
  const [renderizarPantalla, setRenderizadoPantalla] = useState(false);

  const [listadoCiudades, setListadoCiudades] = useState<Ciudad[]>([]);
  const [infoMeteorologia, setInfoMeteorologia] = useState<InfoMeteorologia>(
    {}
  );

  const [snackbarError, setSnackbarError] = useState(false);
  const [snackbarErrorTXT, setSnackbarErrorTXT] = useState("");

  /** Método de carga de configuracion */
  const cargarConfiguracion = async () => {
    try {
      const config = await AsyncStorage.getItem(CONFIG);
      if (config) {
        setConfiguracion(JSON.parse(config));
        console.log("INDEX > Configuración cargada correctamente.");
      }
    } catch (e) {
      console.error("OPTIONS > Error al cargar la configuración:", e);
    }
  };

  /** Método de carga de ciudades */
  const cargarCiudades = async () => {
    try {
      const ciudades = await AsyncStorage.getItem(CIUDADES);
      if (ciudades) {
        const ciudadesParseadas: Ciudad[] = JSON.parse(ciudades);
        setListadoCiudades(ciudadesParseadas);
        console.log("INDEX > Ciudades cargadas correctamente.");

        return ciudadesParseadas;
      }
    } catch (e) {
      console.error("INDEX > Error al cargar las ciudades: ", e);
    }
  };

  // Renderizado inicial
  useEffect(() => {
    const inicializar = async () => {
      if (cargando) {
        await cargarConfiguracion();
        const ciudades = await cargarCiudades();

        while (!ciudades) return;

        await obtenerPrevision(ciudades);
      }
    };

    inicializar();
  }, [cargando]);

  // Recarga al enfocar
  useFocusEffect(
    useCallback(() => {
      if (esPrimeraCarga.current) {
        esPrimeraCarga.current = false;
        return;
      }

      cargarConfiguracion();
      cargarCiudades();
    }, [])
  );

  /** Método encargado de obtener la previsión del
   * tiempo según la ubicación actual del usuario. */
  const obtenerPrevision = async (ciudades: Ciudad[]) => {
    setRenderizadoPantalla(ciudades.length > 0);

    let resultado;
    const ubicacionActual = await UbicacionActual();

    if (ubicacionActual) {
      resultado = await consultaMeteorologiaPorCardinalidad_API(
        ubicacionActual[0].toString(),
        ubicacionActual[1].toString()
      );
    }

    if (resultado && resultado.status === 200) {
      setInfoMeteorologia(resultado.data);
      await guardarInformacion(resultado.data, true);
    } else if (!resultado || (resultado && resultado.status !== 200)) {
      setSnackbarError(true);

      if (!resultado) setSnackbarErrorTXT(CONN_ERROR);
      else if (resultado && resultado.status !== 200)
        setSnackbarErrorTXT(LOCATION_ERROR);
    }

    setEstadoCarga(false);
  };

  /** Método de recarga de información meteorológica */
  const actualizarInfo = useCallback(async () => {
    setRecarga(true);
    await obtenerPrevision(listadoCiudades);
    setRecarga(false);
  }, []);

  /** Método encargado de guardar el valor en AsyncStorage, actualizando
   * ciudades si ya existían o insertándolos en caso contrario.
   * @param resultado Información meteorológica recibida del backend
   * @param ubicacionUsada Valor de control, indica si se ha usado la
   * ubicación para determinar la ciudad más cercana al usuario. */
  const guardarInformacion = useCallback(
    async (resultado: InfoMeteorologia, ubicacionUsada: boolean) => {
      try {
        const nuevaCiudad: Ciudad = {
          nombre: resultado.ubicacion,
          usaUbicacion: ubicacionUsada,
          ultimaActualizacion: new Date(),
          meteorologia: resultado,
        };

        let nuevoListado: Ciudad[] = [];
        let ciudadActualizada = false;

        for (const ciudad of listadoCiudades) {
          if (
            (ciudad.usaUbicacion && ubicacionUsada) ||
            (!ubicacionUsada && ciudad.nombre === resultado.ubicacion)
          ) {
            nuevoListado.push(nuevaCiudad);
            ciudadActualizada = true;
          } else nuevoListado.push(ciudad);
        }

        if (!ciudadActualizada) nuevoListado.push(nuevaCiudad);

        setListadoCiudades(nuevoListado);
        await AsyncStorage.setItem(CIUDADES, JSON.stringify(nuevoListado));
        console.log("INDEX > Listado de ciudades actualizado correctamente.");
      } catch (error) {
        console.error("INDEX > ", error);
      }
    },
    [listadoCiudades]
  );

  // =====================================

  if (cargando) return <PantallaCarga />;

  return renderizarPantalla ? (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle="dark-content" />

      {/* ---------- CABECERA ---------- */}
      <Appbar.Header
        style={{
          backgroundColor: theme.colors.primary,
          marginTop: 0,
          marginBottom: -25,
          zIndex: 10,
        }}
      >
        <Appbar.Action
          icon="plus"
          iconColor={theme.colors.surface}
          onPress={() => router.navigate("/ciudades")}
        />
        <CabeceraCentrada
          title={listadoCiudades[0].nombre}
          style={{ color: theme.colors.surface, fontWeight: "bold" }}
          variant="titleLarge"
        />
        <Appbar.Action
          icon="cog"
          iconColor={theme.colors.surface}
          onPress={() => router.navigate("/options")}
        />
      </Appbar.Header>

      <FlatList
        data={listadoCiudades}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.nombre}
        renderItem={({ item }) => (
          <View style={{ width: Dimensions.get("window").width }}>
            <PantallaCiudad
              infoMeteorologia={item.meteorologia}
              configuracion={configuracion}
            />
          </View>
        )}
      />
    </View>
  ) : (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle="dark-content" />
      <Appbar.Header
        style={{
          backgroundColor: theme.colors.primary,
          marginTop: 0,
          marginBottom: -35,
          zIndex: 10,
        }}
      >
        <Appbar.Action
          isLeading={true}
          icon={"plus"}
          iconColor={theme.colors.surface}
          onPress={async () => {
            router.navigate("/ciudades");
          }}
        />
        <Appbar.Content title="" />
        <Appbar.Action
          isLeading={false}
          icon={"cog"}
          iconColor={theme.colors.surface}
          onPress={async () => {
            router.navigate("/options");
          }}
        />
      </Appbar.Header>
      <View style={{ backgroundColor: theme.colors.background }} />
      <Snackbar
        visible={snackbarError}
        onDismiss={() => {
          setSnackbarError(false);
        }}
      >
        {snackbarErrorTXT}
      </Snackbar>
    </View>
  );
}
