import React, { useCallback, useEffect, useState } from "react";
import {
  Appbar,
  Button,
  Card,
  Divider,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import debounce from "lodash.debounce";
import { City } from "country-state-city";
import { View, ScrollView, StyleSheet } from "react-native";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ciudad } from "@/types/ListadoCiudades";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const CIUDADES = "@usrCities";

export default function Ciudades() {
  const theme = useTheme();

  // Valores de preferencias del usuario por defecto
  const [configuracion, setConfiguracion] = useState({
    unidadTemperatura: "celsius",
    unidadMedidaViento: "kmh",
    unidadMedidaPresion: "mb",
  });

  const [listadoCiudades, setListadoCiudades] = useState<Ciudad[]>([]);
  const [ciudadConsulta, setCiudadConsulta] = useState("");
  const [sugerenciasCiudades, setSugerenciasCiudades] = useState([]);

  // Filtrado con debounce (mejor UX)
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

  /** Método de carga de preferencias */
  const cargarPreferencias = async () => {
    try {
      const preferencias = await AsyncStorage.getItem(CONFIG);
      if (preferencias) {
        console.log("INDEX > Configuración cargada correctamente.");
        setConfiguracion(JSON.parse(preferencias));
      }
    } catch (e) {
      console.error("OPTIONS > Error al cargar la configuración:", e);
    }
  };

  /** Método de carga de ciudades guardadas */
  const cargarCiudades = useCallback(() => {
    const cargar = async () => {
      try {
        const ciudades = await AsyncStorage.getItem(CIUDADES);
        if (ciudades) {
          const ciudadesParseadas: Ciudad[] = JSON.parse(ciudades);
          setListadoCiudades(ciudadesParseadas);
          console.log("CIUDADES > Ciudades cargadas correctamente.");
        }
      } catch (e) {
        console.error("CIUDADES > Error al cargar las ciudades: ", e);
      }
    };

    cargar();
  }, []);

  // Ejecución al recibir enfoque
  useFocusEffect(useCallback(() => cargarCiudades(), []));

  /**
   * Método encargado de eliminar una ciudad del AsyncStorage
   * @param ciudad Ciudad a eliminar de AsyncStorage
   */
  const eliminarCiudad = async (nombreCiudad: string) => {
    try {
      const nuevasCiudades = listadoCiudades.filter(
        (c) => c.nombre.toLowerCase() !== nombreCiudad.toLowerCase()
      );

      setListadoCiudades(nuevasCiudades);
      await AsyncStorage.setItem(CIUDADES, JSON.stringify(nuevasCiudades));
      console.log("Ciudad eliminada correctamente.");
    } catch (error) {
      console.error("Error al eliminar la ciudad:", error);
    }
  };

  return (
    <View style={{ backgroundColor: theme.colors.background, flex: 1 }}>
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
              onPress={async () => console.log("a")}
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
          <View>
            <Card
              key={index}
              style={{ marginTop: 15 }}
              onLongPress={async () => ciudad.usaUbicacion ? {} : eliminarCiudad(ciudad.nombre)}
            >
              <View style={styles.contenedor}>
                <View style={{ flex: 1, flexDirection: "row" }}>
                  <MaterialCommunityIcons
                    name={ciudad.usaUbicacion ? "map-marker-radius-outline" : "map-marker-plus-outline"}
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
                    ? ciudad.meteorologia.pronostico_semanal[0].max_temp_c
                    : ciudad.meteorologia.pronostico_semanal[0].max_temp_f}
                  {"° - "}
                  {configuracion.unidadTemperatura === "celsius"
                    ? ciudad.meteorologia.pronostico_semanal[0].min_temp_c
                    : ciudad.meteorologia.pronostico_semanal[0].min_temp_f}
                  °
                </Text>
              </View>
            </Card>

            <Divider style={{ marginTop: 15 }} />
          </View>
        ))}
      </ScrollView>
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
