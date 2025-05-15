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

const CIUDADES = "@usrCities";

export default function Ciudades() {
  const theme = useTheme();

  const [ciudades, setCiudades] = useState<
    { nombre: string; maxtemp: number; mintemp: number }[]
  >([]);
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

  /** Método de carga de ciudades guardadas */
  const cargarCiudades = useCallback(() => {
    const cargar = async () => {
      try {
        const ciudades = await AsyncStorage.getItem(CIUDADES);
        if (ciudades) {
          setCiudades(JSON.parse(ciudades));
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

  /** Método encargado de comparar si la ciudad es correcta
   * y de guardarla en el AsyncStorage designado */
  const guardarNuevaCiudad = async () => {
    try {
      const ciudadExiste = City.getCitiesOfCountry("ES")!.some(
        (c) => c.name.toLowerCase() === ciudadConsulta.toLowerCase()
      );

      if (ciudadExiste && (!ciudades[0] || ciudades[0].nombre !== ciudadConsulta)) {
        const nuevasCiudades = [
          ...ciudades,
          {
            nombre: ciudadConsulta,
            maxtemp: 0,
            mintemp: 0,
          },
        ];

        setCiudades(nuevasCiudades);
        await AsyncStorage.setItem(CIUDADES, JSON.stringify(nuevasCiudades));
        console.log("Ciudad guardada correctamente.");
      } else console.warn("La ciudad ya está registrada.");
    } catch (e) {
      console.error("Error al guardar la ciudad: ", e);
    }
  };

  /**
   * Método encargado de eliminar una ciudad del AsyncStorage
   * @param ciudad Ciudad a eliminar de AsyncStorage
   */
  const eliminarCiudad = async (nombreCiudad: string) => {
    try {
      const nuevasCiudades = ciudades.filter(
        (c) => c.nombre.toLowerCase() !== nombreCiudad.toLowerCase()
      );

      setCiudades(nuevasCiudades);
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
              onPress={async () => guardarNuevaCiudad()}
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

        {/* UBICACIÓN ACTUAL DEL USUARIO */}
        <Card
          style={{ marginTop: 15 }}
          onPress={async () => console.log("ubi actual")}
          onLongPress={async () => console.log("opciones")}
        >
          <View style={styles.contenedor}>
            <Card.Title
              style={{ width: "70%" }}
              title="Ubicación actual"
              titleVariant="titleMedium"
            />
            <View style={[{ width: "30%" }, styles.centrador]}>
              <Text style={styles.texto}>MAXº - MINº</Text>
            </View>
          </View>
        </Card>

        <Divider style={{ marginTop: 15 }} />

        {/* UBICACIONES GUARDADAS */}
        {ciudades.map((ciudad) => (
          <Card
            key={ciudad.nombre}
            style={{ marginTop: 15 }}
            onPress={async () => console.log(ciudades.indexOf(ciudad))}
            onLongPress={async () => eliminarCiudad(ciudad.nombre)}
          >
            <View style={styles.contenedor}>
              <Card.Title
                style={{ width: "70%" }}
                title={ciudad.nombre}
                titleVariant="titleMedium"
              />
              <View style={[{ width: "30%" }, styles.centrador]}>
                <Text style={styles.texto}>
                  {ciudad.maxtemp}° - {ciudad.mintemp}°
                </Text>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    flexWrap: "wrap",
    flexDirection: "row",
    alignItems: "center",
  },
  columna: {
    width: "50%",
  },
  centrador: {
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  texto: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
});
