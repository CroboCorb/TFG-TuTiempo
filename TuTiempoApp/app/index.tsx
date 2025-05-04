import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, StatusBar } from "react-native";
import {
  Card,
  Text,
  ActivityIndicator,
  Surface,
  Divider,
  Chip,
  useTheme,
  Appbar,
} from "react-native-paper";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import AddCityDialog from "./addCityDialog";

const datosEjemplo = {
  ubicacion: "New York",
  current: {
    temp: 72,
    condicion: "Parcialmente nublado",
    humidity: 65,
    windSpeed: 8,
    feelsLike: 74,
    icon: "weather-partly-cloudy",
  },
  forecast: [
    { day: "Lunes", temp: 75, icon: "weather-sunny" },
    { day: "Martes", temp: 68, icon: "weather-rainy" },
    { day: "Miércoles", temp: 70, icon: "weather-partly-cloudy" },
    { day: "Jueves", temp: 73, icon: "weather-sunny" },
    { day: "Viernes", temp: 77, icon: "weather-sunny" },
  ],
  hourly: [
    { time: "Ahora", temp: 72, icon: "weather-partly-cloudy" },
    { time: "15:00", temp: 74, icon: "weather-partly-cloudy" },
    { time: "16:00", temp: 75, icon: "weather-sunny" },
    { time: "17:00", temp: 76, icon: "weather-sunny" },
    { time: "18:00", temp: 75, icon: "weather-sunny" },
    { time: "19:00", temp: 73, icon: "weather-partly-cloudy" },
    { time: "20:00", temp: 70, icon: "weather-night-partly-cloudy" },
  ],
};

export default function PantallaTiempo() {
  const theme = useTheme();

  const [settings, setSettings] = useState({
    unidadTemperatura: "celsius",
    unidadMedidaViento: "kmh",
    unidadMedidaPresion: "hPa",
  });

  const [meteorologia, setMeteorologia] = useState(datosEjemplo);
  const [cargando, setEstadoCarga] = useState(false);

  const [visibilidadModalNuevaCiudad, setVisibilidadModalNuevaCiudad] =
    useState(false);

  const escalaIcono = useSharedValue(1);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem("@appConfig");
        if (saved) setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Error al cargar configuración:", e);
      }
    };

    fetchSettings();

    // Animación
    const interval = setInterval(() => {
      escalaIcono.value = withSpring(1.1, { damping: 2 });
      setTimeout(() => {
        escalaIcono.value = withSpring(1, { damping: 2 });
      }, 500);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const estiloAnimadoIcono = useAnimatedStyle(() => {
    return {
      transform: [{ scale: escalaIcono.value }],
    };
  });

  // MÉTODO DE CONVERSIÓN DE TEMPERATURA
  const convertirTemperatura = (tempF: number) => {
    return settings.unidadTemperatura === "celsius"
      ? Math.round((tempF - 32) * (5 / 9))
      : tempF;
  };

  // MÉTODO DE CONVERSIÓN DE VELOCIDAD
  const convertirVelocidad = (velocidadMph: number) => {
    return settings.unidadMedidaViento === "kmh"
      ? Math.round(velocidadMph * 1.60934)
      : velocidadMph;
  };

  // MÉTODO DE CONVERSIÓN DE PRESIÓN
  const convertirPresion = (valorHpa: number) => {
    switch (settings.unidadMedidaPresion) {
      case "mmHg":
        return Math.round(valorHpa * 0.750062);
      case "atm":
        return (valorHpa / 1013.25).toFixed(2);
      case "hPa":
      default:
        return valorHpa;
    }
  };

  return (
    <View
      style={[styles.contenedor, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar barStyle="dark-content" />

      <View
        style={[styles.cabecera, { backgroundColor: theme.colors.primary }]}
      >
        <SafeAreaView style={styles.contenidoCabecera}>
          <Appbar.Header
            style={{
              backgroundColor: "#00FFFFFFFF",
              marginTop: 0,
              marginBottom: -25,
              zIndex: 10,
            }}
          >
            <Appbar.Action
              isLeading={true}
              icon={"plus"}
              iconColor={theme.colors.surface}
              onPress={async () => {
                setVisibilidadModalNuevaCiudad(true);
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

          <View style={[styles.tiempoActual, {marginTop: 0}]}>
            <Text style={[styles.ubicacion, { color: theme.colors.surface }]}>
              {meteorologia.ubicacion}
            </Text>
            <View style={styles.contenedorTemporal}>
              <Animated.Text
                style={[styles.temperatura, { color: theme.colors.surface }]}
              >
                {convertirTemperatura(meteorologia.current.temp)}°
              </Animated.Text>
              <Animated.View style={estiloAnimadoIcono}>
                <MaterialCommunityIcons
                  name={meteorologia.current.icon}
                  size={70}
                  color={theme.colors.surface}
                />
              </Animated.View>
            </View>
            <Text style={[styles.condicion, { color: theme.colors.surface }]}>
              {meteorologia.current.condicion}
            </Text>
          </View>
        </SafeAreaView>
      </View>

      {cargando ? (
        <View style={styles.contenedorCarga}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 10 }}>Actualizando datos...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          <Surface style={styles.tarjetaInformacion}>
            <View style={styles.detallesTiempo}>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons
                  name="water-percent"
                  size={24}
                  color={theme.colors.primary}
                />
                <Text style={styles.detailValue}>
                  {meteorologia.current.humidity}%
                </Text>
                <Text style={styles.detailLabel}>Humedad</Text>
              </View>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons
                  name="weather-windy"
                  size={24}
                  color={theme.colors.primary}
                />
                <Text style={styles.detailValue}>
                  {convertirVelocidad(meteorologia.current.windSpeed)}{" "}
                  {settings.unidadMedidaViento === "kmh" ? "km/h" : "mph"}
                </Text>
                <Text style={styles.detailLabel}>Viento</Text>
              </View>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons
                  name="thermometer"
                  size={24}
                  color={theme.colors.primary}
                />
                <Text style={styles.detailValue}>
                  {convertirTemperatura(meteorologia.current.feelsLike)}°
                </Text>
                <Text style={styles.detailLabel}>Sensación</Text>
              </View>
            </View>
          </Surface>

          <Card style={styles.tarjetaPrevision}>
            <Card.Title title="Previsión por horas" />
            <Card.Content>
              <View style={styles.contenedorPorHora}>
                {meteorologia.hourly.map((hour, index) => (
                  <View key={index} style={styles.objetoPorHora}>
                    <Text style={styles.hourlyTime}>{hour.time}</Text>
                    <MaterialCommunityIcons
                      name={hour.icon}
                      size={28}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.temperaturaPorHoras}>
                      {convertirTemperatura(hour.temp)}°
                    </Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.tarjetaPrevision}>
            <Card.Title title="Previsión semanal" />
            <Card.Content>
              {meteorologia.forecast.map((day, index) => (
                <React.Fragment key={index}>
                  <View style={styles.previsionDiaria}>
                    <Text style={styles.diaPrevision}>{day.day}</Text>
                    <View style={styles.contenedorIconoPrevision}>
                      <MaterialCommunityIcons
                        name={day.icon}
                        size={28}
                        color={theme.colors.primary}
                      />
                    </View>
                    <Text style={styles.previsionTemperatura}>
                      {convertirTemperatura(day.temp)}°
                    </Text>
                  </View>
                  {index < meteorologia.forecast.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </Card.Content>
          </Card>

          <Card style={styles.tarjetaPrevision}>
            <Card.Title title="Alertas meteorológicas" />
            <Card.Content>
              <Chip
                icon="alert"
                style={{ backgroundColor: theme.colors.primaryContainer }}
                textStyle={{ color: theme.colors.onPrimaryContainer }}
              >
                Sin alertas meteorológicas
              </Chip>
            </Card.Content>
          </Card>

          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {visibilidadModalNuevaCiudad ? (
        <AddCityDialog
          visible={visibilidadModalNuevaCiudad}
          hideDialog={async () => setVisibilidadModalNuevaCiudad(false)}
        />
      ) : (
        <View />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  cabecera: {
    height: 300,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: "hidden",
  },
  contenidoCabecera: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  tiempoActual: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ubicacion: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  contenedorTemporal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  temperatura: {
    fontSize: 80,
    fontWeight: "bold",
  },
  condicion: {
    fontSize: 18,
    marginTop: 5,
  },
  scrollView: {
    flex: 1,
    marginTop: 300,
    zIndex: 1,
  },
  contenedorCarga: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 300,
  },
  tarjetaInformacion: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 4,
  },
  detallesTiempo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailItem: {
    alignItems: "center",
    flex: 1,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
  },
  detailLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  tarjetaPrevision: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  contenedorPorHora: {
    flexDirection: "row",
    paddingVertical: 10,
  },
  objetoPorHora: {
    alignItems: "center",
    marginRight: 20,
  },
  hourlyTime: {
    fontSize: 12,
    marginBottom: 5,
  },
  temperaturaPorHoras: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 5,
  },
  previsionDiaria: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  diaPrevision: {
    flex: 1,
    fontSize: 16,
  },
  contenedorIconoPrevision: {
    flex: 1,
    alignItems: "center",
  },
  previsionTemperatura: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "right",
  },
});
