import React, { useCallback, useEffect, useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import {
  Appbar,
  Button,
  Card,
  Divider,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

import { router, useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { City, ICity } from "country-state-city";
import { StatusBar } from "expo-status-bar";
import debounce from "lodash.debounce";

import { Ciudad } from "@/types/ListadoCiudades";

import { buscarCiudad, indexarCiudades } from "@/interface/EstadoYPaisDeCiudad";

import { infoSegunNombre_API } from "@/functions/GestorAPI";
import {
  actualizarListadoCiudades,
  cargarConfiguracion,
  cargarListadoCiudades,
} from "@/functions/GestorAsyncStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Configuracion } from "@/types/Configuracion";

const CIUDADES = "user_cities";
const indexCiudades = indexarCiudades();

export default function Ciudades() {
  const theme = useTheme();

  // Valores de configuración del usuario por defecto
  const [configuracion, setConfiguracion] = useState<Configuracion>({
    unidadTemperatura: "celsius",
    unidadMedidaViento: "kmh",
    unidadMedidaPresion: "hPa",
    notificacionesActivadas: false,
  });

  // Constantes de datos del usuario, control de búsqueda y sugerencias
  const [listadoCiudades, setListadoCiudades] = useState<Ciudad[]>([]);
  const [ciudadConsulta, setCiudadConsulta] = useState<string>("");
  const [sugerenciasCiudades, setSugerenciasCiudades] = useState<ICity[]>([]);

  // Constantes de control de snackbars
  const [snackbarVisibilidad, setSnackbarVisibilidad] =
    useState<boolean>(false);
  const [snackbarTexto, setSnackbarTexto] = useState<string>("");
  const cerrarSnackbar = async () => setSnackbarVisibilidad(false);

  /** Método de carga de la configuración del usuario. */
  const cargarConfig = async () => {
    const preferencias = await cargarConfiguracion();
    if (preferencias) {
      console.info("CIUDADES > Configuración cargada correctamente.");
      setConfiguracion(JSON.parse(preferencias));
    } else console.error("CIUDADES > Error al cargar la configuración");
  };

  /** Método de carga del listado de ciudades del usuario. */
  const cargarCiudades = useCallback(async () => {
    const ciudades = await cargarListadoCiudades();
    if (ciudades) {
      setListadoCiudades(ciudades);
      console.info("CIUDADES > Ciudades cargadas correctamente.");
    } else
      console.error("CIUDADES > Error al cargar el listado de ciudades.");
  }, []);

  /** Filtrado con debounce (optimización de UX) */
  const filtrarCiudades = debounce((input) => {
    if (input.length < 2) {
      setSugerenciasCiudades([]);
      return;
    }
    const resultados = City.getCitiesOfCountry("ES")!
      .filter((c) => c.name.toLowerCase().startsWith(input.toLowerCase()))
      .slice(0, 10);
    setSugerenciasCiudades(resultados);
  }, 100);

  useEffect(() => {
    filtrarCiudades(ciudadConsulta);
  }, [ciudadConsulta]);

  // Recarga al enfocar
  useFocusEffect(
    useCallback(() => {
      cargarConfig();
      cargarCiudades();
    }, [])
  );

  /**
   * Método encargado de agregar la ciudad solicitada al listado,
   * buscando la región en la que se encuentra, reemplazando carácteres
   * inválidos para mejorar las coincidencias, y solicitando datos a la API.
   */
  const agregarNuevaCiudad = async () => {
    if (listadoCiudades.length <= 10) {
      const resultadoBusqueda = buscarCiudad(indexCiudades, ciudadConsulta);
      const resultadoMeteo = await infoSegunNombre_API(
        resultadoBusqueda[0].ciudad.replaceAll("'", "a ") +
          "," +
          resultadoBusqueda[0].nombreRegion
      );

      if (resultadoMeteo && resultadoMeteo.status === 200) {
        const nuevaCiudad: Ciudad = {
          nombre: resultadoMeteo.data.ubicacion,
          usaUbicacion: false,
          ultimaActualizacion: new Date(),
          meteorologia: resultadoMeteo.data,
        };

        const resultado = await actualizarListadoCiudades(nuevaCiudad);
        if (resultado) {
          setListadoCiudades(resultado);
          console.info(
            "CIUDADES > Listado de ciudades actualizado correctamente."
          );
        } else
          console.error(
            "CIUDADES > Error al actualizar el listado de ciudades."
          );
      } else {
        setSnackbarTexto("Error de comunicación. Inténtelo más tarde.");
        setSnackbarVisibilidad(true);
      }
    }
  };

  /**
   * Método encargado de eliminar una ciudad de AsyncStorage.
   * @param ciudad Ciudad a eliminar de AsyncStorage.
   */
  const eliminarCiudad = async (
    nombreCiudad: string,
    usaUbicacion: boolean
  ) => {
    if (!usaUbicacion && listadoCiudades.length !== 1) {
      try {
        const nuevasCiudades = listadoCiudades.filter(
          (c) => c.nombre.toLowerCase() !== nombreCiudad.toLowerCase()
        );

        setListadoCiudades(nuevasCiudades);
        await AsyncStorage.setItem(CIUDADES, JSON.stringify(nuevasCiudades));

        console.info('CIUDADES > Ciudad eliminada correctamente.')
        setSnackbarTexto("Ciudad eliminada correctamente.");
        setSnackbarVisibilidad(true);
      } catch (error) {
        console.error("Error al eliminar la ciudad:", error);
      }
    }
  };

  return (
    <View style={{ backgroundColor: theme.colors.background, flex: 1 }}>
      <StatusBar
        style="auto"
        backgroundColor={theme.colors.background}
        translucent={false}
      />
      <Appbar.Header>
        <Appbar.BackAction
          onPress={async () => {
            router.back();
          }}
        />
        <Appbar.Content title="Ciudades" />
      </Appbar.Header>

      <Divider />

      <ScrollView style={{ margin: 15 }}>
        <TextInput
          label="Ciudad"
          value={ciudadConsulta}
          mode="outlined"
          onChangeText={setCiudadConsulta}
          right={
            <TextInput.Icon
              icon="send"
              onPress={async () => agregarNuevaCiudad()}
            />
          }
        />

        {ciudadConsulta.length > 1 && sugerenciasCiudades.length > 0 && (
          <Card
            style={{
              marginTop: 10,
              backgroundColor: theme.colors.elevation.level1,
            }}
          >
            <Card.Content>
              {sugerenciasCiudades.map((ciudad, index) => (
                <Button
                  key={index}
                  onPress={async () => {
                    setCiudadConsulta(ciudad.name);
                    setSugerenciasCiudades([]);
                  }}
                  style={{ alignItems: "flex-start" }}
                  contentStyle={{ justifyContent: "flex-start" }}
                >
                  {ciudad.name}
                </Button>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* UBICACIONES GUARDADAS */}
        {listadoCiudades.map((ciudad, index) => (
          <View key={index}>
            <Card
              style={{ marginTop: 15 }}
              onLongPress={async () =>
                eliminarCiudad(ciudad.nombre, ciudad.usaUbicacion)
              }
            >
              <View style={styles.contenedor}>
                <View style={{ flex: 1, flexDirection: "row" }}>
                  <MaterialCommunityIcons
                    name={
                      ciudad.usaUbicacion
                        ? "map-marker-radius-outline"
                        : "map-marker-plus-outline"
                    }
                    size={24}
                    color={theme.colors.primary}
                  />
                  <Text style={{ marginLeft: 8 }} variant="titleMedium">
                    {ciudad.nombre}
                  </Text>
                </View>

                <Text
                  variant="titleMedium"
                  style={{
                    textAlign: "center",
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  {configuracion.unidadTemperatura === "celsius"
                    ? ciudad.meteorologia.pronostico_semanal[0].max_temp_c +
                      "°C"
                    : ciudad.meteorologia.pronostico_semanal[0].max_temp_f +
                      "°F"}
                  {" // "}
                  {configuracion.unidadTemperatura === "celsius"
                    ? ciudad.meteorologia.pronostico_semanal[0].min_temp_c +
                      "°C"
                    : ciudad.meteorologia.pronostico_semanal[0].min_temp_f +
                      "°F"}
                </Text>
              </View>
            </Card>

            {ciudad.usaUbicacion ? (
              <Divider style={{ marginTop: 15 }} />
            ) : (
              <View />
            )}
          </View>
        ))}
      </ScrollView>

      <Snackbar
        visible={snackbarVisibilidad}
        onDismiss={cerrarSnackbar}
        duration={2500}
      >
        {snackbarTexto}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    flexDirection: "row",
    padding: 12,
  },
  centrador: {
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
});
