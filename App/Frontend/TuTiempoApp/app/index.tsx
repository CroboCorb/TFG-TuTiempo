import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, FlatList, Dimensions } from "react-native";
import { useTheme, Appbar, Snackbar } from "react-native-paper";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";

import CabeceraCentrada from "@/components/CabeceraCentrada";
import PantallaCiudad from "@/components/PantallaCiudad";
import PantallaCarga from "@/components/PantallaCarga";

import { infoSegunCardinalidad_API } from "@/functions/GestorAPI";
import { UbicacionActual } from "@/functions/GestorUbicacion";

import { Configuracion } from "@/types/Configuracion";
import { Ciudad } from "@/types/ListadoCiudades";
import {
  actualizarListadoCiudades,
  cargarConfiguracion,
  cargarListadoCiudades,
} from "@/functions/GestorAsyncStorage";

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

  const [listadoCiudades, setListadoCiudades] = useState<Ciudad[]>([]);

  const [snackbarError, setSnackbarError] = useState(false);
  const [snackbarErrorTXT, setSnackbarErrorTXT] = useState("");

  /** Método de carga de configuracion */
  const cargarConfig = async () => {
    try {
      const config = await cargarConfiguracion();
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
      const ciudades = await cargarListadoCiudades();
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
      try {
        await cargarConfig();
        const ciudades = await cargarCiudades();

        if (ciudades) await obtenerPrevision(ciudades);
        else if (!ciudades) await obtenerPrevision(listadoCiudades);
      } catch (e) {
        console.error("Error durante la inicialización:", e);
      }
    };

    if (cargando) inicializar();
  }, [cargando]);

  // Recarga al enfocar
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

  /** Método encargado de obtener la previsión del
   * tiempo según la ubicación actual del usuario. */
  const obtenerPrevision = async (ciudades: Ciudad[]) => {
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

      const valorRetorno = await actualizarListadoCiudades(
        listadoCiudades,
        nuevaCiudad,
        false
      );
      if (valorRetorno) {
        setListadoCiudades(valorRetorno);
        console.log("INDEX > Listado de ciudades actualizado correctamente.");
      } else
        console.error("INDEX > Error al actualizar el listado de ciudades.");
    } else if (!resultado || (resultado && resultado.status !== 200)) {
      setSnackbarError(true);

      if (!resultado) setSnackbarErrorTXT(CONN_ERROR);
      else if (resultado && resultado.status !== 200)
        setSnackbarErrorTXT(LOCATION_ERROR);
    }

    setEstadoCarga(false);
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
        horizontal
        pagingEnabled
        showsVerticalScrollIndicator={false}
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
      <StatusBar
        style="light"
        backgroundColor={theme.colors.primary}
        translucent={false}
      />
      <Appbar.Header
        style={{
          backgroundColor: theme.colors.primary,
          position: "fixed",
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
        onDismiss={() => {
          setSnackbarError(false);
        }}
      >
        {snackbarErrorTXT}
      </Snackbar>
    </View>
  );
}
