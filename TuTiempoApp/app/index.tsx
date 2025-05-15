import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, StatusBar, RefreshControl } from "react-native";
import {
  Card,
  Text,
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

import { MaterialCommunityIcons } from "@expo/vector-icons";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import CabeceraCentrada from "@/components/CabeceraCentrada";
import PantallaCarga from "@/components/PantallaCarga";
import { UbicacionActual } from "@/hooks/useLocationManager";
import { consultaMeteorologiaPorCardinalidad_API } from "@/hooks/useAPIManager";

const CIUDADES = "@usrCities";
const CONFIG = "@appConfig";

export default function PantallaTiempo() {
  const theme = useTheme();

  // Ícono animado de temperatura
  const escalaIcono = useSharedValue(1);
  const estiloAnimadoIcono = useAnimatedStyle(() => {
    return {
      transform: [{ scale: escalaIcono.value }],
    };
  });

  const [configuracion, setConfiguracion] = useState({
    unidadTemperatura: "celsius",
    unidadMedidaViento: "kmh",
    unidadMedidaPresion: "hPa",
  });

  const [cargando, setEstadoCarga] = useState(true);
  const [meteorologia, setMeteorologia] = useState("");

  // Método de recarga de configuración y ciudades al enfocar
  useFocusEffect(
    useCallback(() => {
      /** Método de carga de configuración */
      const cargarConfiguracion = async () => {
        try {
          const preferencias = await AsyncStorage.getItem(CONFIG);
          if (preferencias) setConfiguracion(JSON.parse(preferencias));
        } catch (e) {
          console.error("OPTIONS > Error al cargar la configuración:", e);
        }
      };

      /** Método de carga de ciudades */
      const cargarCiudades = async () => {
        try {
          const ciudades = await AsyncStorage.getItem(CIUDADES);
          if (ciudades) {
            // ESTABLECER LISTADO EN VARIABLE
            console.log("INDEX > Ciudades cargadas correctamente.");
          }
        } catch (e) {
          console.error("CIUDADES > Error al cargar las ciudades: ", e);
        }
      };

      cargarConfiguracion();
      cargarCiudades();
    }, [])
  );

  useEffect(() => {
    const infoUbicacionActual = async () => {
      const ubicacionActual = await UbicacionActual();

      const resultado = await consultaMeteorologiaPorCardinalidad_API(
        ubicacionActual[0].toString(),
        ubicacionActual[1].toString()
      );
      if (resultado && resultado.status === 200)
        setMeteorologia(resultado.data);
      setEstadoCarga(false);
    };

    if (cargando) infoUbicacionActual();
  }, [cargando]);

  // Método de renderizado de animación
  useEffect(() => {
    const interval = setInterval(() => {
      escalaIcono.value = withSpring(1.1, { damping: 2 });
      setTimeout(() => {
        escalaIcono.value = withSpring(1, { damping: 2 });
      }, 500);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (cargando) return <PantallaCarga />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle="dark-content" />
      <Appbar.Header
        style={{
          backgroundColor: theme.colors.primary,
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
            router.navigate("/ciudades");
          }}
        />
        <CabeceraCentrada
          title={meteorologia.ubicacion}
          style={{ color: theme.colors.surface }}
          variant="titleMedium"
        />
        <Appbar.Action
          isLeading={false}
          icon={"cog"}
          iconColor={theme.colors.surface}
          onPress={async () => {
            router.navigate("/options");
          }}
        />
      </Appbar.Header>

      <ScrollView>
        {/* CABECERA DE INFORMACIÓN PRINCIPAL */}
        <View
          style={[
            styles.tiempoActual,
            { backgroundColor: theme.colors.primary, paddingBottom: 25 },
          ]}
        >
          <View style={styles.contenedorTemporal}>
            <Animated.Text
              style={[styles.temperatura, { color: theme.colors.surface }]}
            >
              {configuracion.unidadTemperatura === "celsius"
                ? meteorologia.clima_actual.temperatura_c
                : meteorologia.clima_actual.temperatura_f}
              °
            </Animated.Text>
            <Animated.View style={estiloAnimadoIcono}>
              {/* <MaterialCommunityIcons
                name={meteorologia.current.icon}
                size={70}
                color={theme.colors.surface}
              /> */}
            </Animated.View>
          </View>
          <Text style={[styles.condicion, { color: theme.colors.surface }]}>
            {meteorologia.clima_actual.condicion}
          </Text>
        </View>

        {/* RESUMEN GENERAL */}
        <Surface style={styles.tarjetaInformacion}>
          <View style={styles.detallesTiempo}>
            <View style={styles.elementoResumen}>
              <MaterialCommunityIcons
                name="water-percent"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.txtValor}>
                {meteorologia.clima_actual.humedad}%
              </Text>
              <Text style={styles.txtResumen}>Humedad</Text>
            </View>
            <View style={styles.elementoResumen}>
              <MaterialCommunityIcons
                name="weather-windy"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.txtValor}>
                {configuracion.unidadMedidaViento === "kmh"
                  ? meteorologia.clima_actual.viento_kmh
                  : meteorologia.clima_actual.viento_mph}{" "}
                {configuracion.unidadMedidaViento === "kmh" ? "km/h" : "mph"}
              </Text>
              <Text style={styles.txtResumen}>Viento</Text>
            </View>
            <View style={styles.elementoResumen}>
              <MaterialCommunityIcons
                name="thermometer"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.txtValor}>
                {configuracion.unidadTemperatura === "celsius"
                  ? meteorologia.clima_actual.temperatura_c
                  : meteorologia.clima_actual.temperatura_f}
                °
              </Text>
              <Text style={styles.txtResumen}>Sensación</Text>
            </View>
          </View>
        </Surface>

        {/* PRONÓSTICO DEL DÍA */}
        <Card style={styles.tarjetaPrevision}>
          <Card.Title title="Previsión por horas" />
          <Card.Content>
            <ScrollView
              contentContainerStyle={styles.contenedorPorHora}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {meteorologia.pronostico_actual.map((pronostico) => (
                <View key={pronostico.hora} style={{ alignItems: "center" }}>
                  <Text style={styles.txtPrevisionHora}>{pronostico.hora}</Text>
                  <MaterialCommunityIcons
                    name={"weather-cloudy"}
                    size={28}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.temperaturaPorHoras}>
                    {configuracion.unidadTemperatura === "celsius"
                      ? pronostico.temp_c
                      : pronostico.temp_f}
                    °
                  </Text>
                </View>
              ))}
            </ScrollView>
          </Card.Content>
        </Card>

        {/* PRONÓSTICO SEMANAL */}
        <Card style={styles.tarjetaPrevision}>
          <Card.Title title="Previsión semanal" />
          <Card.Content>
            {meteorologia.pronostico_semanal.map((dia, index) => (
              <React.Fragment key={dia.fecha}>
                <View style={styles.previsionDiaria}>
                  <Text style={styles.diaPrevision}>
                    {dia.fecha}
                  </Text>
                  <View>
                    {/* <MaterialCommunityIcons
                      name={day.icon}
                      size={28}
                      color={theme.colors.primary}
                    /> */}
                  </View>
                  <Text style={styles.previsionTemperatura}>
                    {configuracion.unidadTemperatura === "celsius"
                      ? dia.max_temp_c
                      : dia.max_temp_f}
                    ° /{" "}
                    {configuracion.unidadTemperatura === "celsius"
                      ? dia.min_temp_c
                      : dia.min_temp_f}
                    °
                  </Text>
                </View>
                {index < meteorologia.pronostico_semanal.length - 1 && (
                  <Divider />
                )}
              </React.Fragment>
            ))}
          </Card.Content>
        </Card>

        {/* ALERTAS METEOROLÓGICAS */}
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    marginTop: 15,
  },
  temperatura: {
    fontSize: 64,
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
  elementoResumen: {
    alignItems: "center",
    flex: 1,
  },
  txtValor: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
  },
  txtResumen: {
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
    justifyContent: "space-evenly",
    gap: 10,
  },
  txtPrevisionHora: {
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
  previsionTemperatura: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "right",
  },
});
