import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  Linking,
  RefreshControl,
} from "react-native";
import {
  Card,
  Text,
  Surface,
  Divider,
  Chip,
  useTheme,
  Appbar,
  Tooltip,
  Snackbar,
} from "react-native-paper";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import CabeceraCentrada from "@/components/CabeceraCentrada";
import PantallaCarga from "@/components/PantallaCarga";

import { ComprobarPermisos, UbicacionActual } from "@/hooks/useLocationManager";
import { consultaMeteorologiaPorCardinalidad_API } from "@/hooks/useAPIManager";

import { InfoMeteorologia } from "@/types/InfoMeteorologia";
import { Ciudad } from "@/types/ListadoCiudades";

const CIUDADES = "@usrCities";
const CONFIG = "@appConfig";

const COORDS_DEFECTO = [40.4165, -3.70256];

export default function PantallaTiempo() {
  const theme = useTheme();

  // Valores de ícono animado de temperatura
  const escalaIcono = useSharedValue(1);
  const estiloAnimadoIcono = useAnimatedStyle(() => {
    return {
      transform: [{ scale: escalaIcono.value }],
    };
  });

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

  // Valores de preferencias del usuario por defecto
  const [configuracion, setConfiguracion] = useState({
    unidadTemperatura: "celsius",
    unidadMedidaViento: "kmh",
    unidadMedidaPresion: "mb",
  });

  const esPrimeraCarga = useRef(true);
  const [cargando, setEstadoCarga] = useState(true);
  const [recarga, setRecarga] = useState(false);

  const [listadoCiudades, setListadoCiudades] = useState<Ciudad[]>([]);
  const [snackbarUbicacionVisible, setSnackbarUbicacionVisible] =
    useState(false);
  const [infoMeteorologia, setInfoMeteorologia] = useState<InfoMeteorologia>({});

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

  /** Método de carga de ciudades */
  const cargarCiudades = async () => {
    try { 
      const ciudades = await AsyncStorage.getItem(CIUDADES);
      if (ciudades) {
        const ciudadesParseadas: Ciudad[] = JSON.parse(ciudades);
        setListadoCiudades(ciudadesParseadas);
        console.log("INDEX > Ciudades cargadas correctamente.");
      }
    } catch (e) {
      console.error("INDEX > Error al cargar las ciudades: ", e);
    }
  };

  // Renderizado inicial
  useEffect(() => {
    cargarPreferencias();
    cargarCiudades();

    if (cargando) obtenerPrevision();
  }, [cargando]);

  // Recarga al enfocar
  useFocusEffect(
    useCallback(() => {
      if (esPrimeraCarga.current) {
        esPrimeraCarga.current = false;
        return;
      }

      cargarPreferencias();
      cargarCiudades();
    }, [])
  );

  /** Método encargado de obtener la previsión del 
   * tiempo según la ubicación actual del usuario. */
  const obtenerPrevision = async () => {
    if (await ComprobarPermisos()) {
      const ubicacionActual = await UbicacionActual();
      let resultado;

      if (ubicacionActual) {
        resultado = await consultaMeteorologiaPorCardinalidad_API(
          ubicacionActual[0].toString(),
          ubicacionActual[1].toString()
        );
      } else {
        if (listadoCiudades) {
          
        } else {
          setSnackbarUbicacionVisible(true);
          resultado = await consultaMeteorologiaPorCardinalidad_API(
            COORDS_DEFECTO[0].toString(),
            COORDS_DEFECTO[1].toString()
          );
        }
      }

      if (resultado && resultado.status === 200) {
        setInfoMeteorologia(resultado.data);
        await guardarInformacion(resultado.data, true);
      }
    }

    setEstadoCarga(false);
  };

  /** Método de recarga de información meteorológica */
  const actualizarInfo = useCallback(async () => {
    setRecarga(true);
    await obtenerPrevision();
    setRecarga(false);
  }, []);

  /** Método encargado de guardar el valor en AsyncStorage, actualizando 
   * ciudades si ya existían o insertándolos en caso contrario.
   * @param resultado Información meteorológica recibida del backend
   * @param ubicacionUsada Valor de control, indica si se ha usado la
   * ubicación para determinar la ciudad más cercana al usuario. */
  const guardarInformacion = useCallback(async (resultado: InfoMeteorologia, ubicacionUsada: boolean) => {
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
        } else 
          nuevoListado.push(ciudad);
      }

      if (!ciudadActualizada) 
        nuevoListado.push(nuevaCiudad);

      setListadoCiudades(nuevoListado);
      await AsyncStorage.setItem(CIUDADES, JSON.stringify(nuevoListado));
      console.log("INDEX > Listado de ciudades actualizado correctamente.");
    } catch (error) {
      console.error('INDEX > ', error);
    }
  }, [listadoCiudades]);

  // =====================================

  if (cargando) return <PantallaCarga />;

  return (
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
        <CabeceraCentrada
          title={infoMeteorologia.ubicacion}
          style={{ color: theme.colors.surface, fontWeight: "bold" }}
          variant="titleLarge"
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

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={recarga} onRefresh={actualizarInfo} />
        }
      >
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
                ? infoMeteorologia.clima_actual.temperatura_c
                : infoMeteorologia.clima_actual.temperatura_f}
              °
            </Animated.Text>
            <Animated.View style={estiloAnimadoIcono}>
              <MaterialCommunityIcons
                name={
                  infoMeteorologia.pronostico_actual[new Date().getHours()].icono
                }
                size={70}
                color={theme.colors.surface}
              />
            </Animated.View>
          </View>
          <Text style={[styles.condicion, { color: theme.colors.surface }]}>
            {infoMeteorologia.clima_actual.condicion}
          </Text>
        </View>

        {/* RESUMEN GENERAL */}
        <Surface style={styles.tarjetaInformacion}>
          <View style={styles.detallesTiempo}>
            {/* HUMEDAD */}
            <View style={styles.elementoResumen}>
              <MaterialCommunityIcons
                name="water-percent"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.txtValor}>
                {infoMeteorologia.clima_actual.humedad}%
              </Text>
              <Text style={styles.txtResumen}>Humedad</Text>
            </View>

            {/* VIENTO */}
            <Tooltip
              title={
                infoMeteorologia.clima_actual.viento_direccion +
                " - " +
                infoMeteorologia.clima_actual.viento_grados +
                "°"
              }
              enterTouchDelay={250}
            >
              <View style={styles.elementoResumen}>
                <MaterialCommunityIcons
                  name="weather-windy"
                  size={24}
                  color={theme.colors.primary}
                />
                <Text style={styles.txtValor}>
                  {configuracion.unidadMedidaViento === "kmh"
                    ? infoMeteorologia.clima_actual.viento_kmh
                    : infoMeteorologia.clima_actual.viento_mph}{" "}
                  {configuracion.unidadMedidaViento === "kmh" ? "km/h" : "mph"}
                </Text>
                <Text style={styles.txtResumen}>Viento</Text>
              </View>
            </Tooltip>

            {/* SENSACIÓN */}
            <View style={styles.elementoResumen}>
              <MaterialCommunityIcons
                name="thermometer"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.txtValor}>
                {configuracion.unidadTemperatura === "celsius"
                  ? infoMeteorologia.clima_actual.temperatura_c
                  : infoMeteorologia.clima_actual.temperatura_f}
                °
              </Text>
              <Text style={styles.txtResumen}>Sensación</Text>
            </View>
          </View>
        </Surface>

        {/* PRONÓSTICO DEL DÍA */}
        <Card style={styles.tarjetaPrevision}>
          <Card.Title title="Previsión del día" />
          <Card.Content>
            <ScrollView
              contentContainerStyle={styles.contenedorPorHora}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {infoMeteorologia.pronostico_actual.map(
                (pronostico: any, index: any) => (
                  <View key={index} style={{ alignItems: "center" }}>
                    {index === new Date().getHours() ? (
                      <View style={{ alignItems: "center" }}>
                        <Text
                          style={[
                            styles.txtPrevisionHora,
                            { fontWeight: "bold" },
                          ]}
                        >
                          AHORA
                        </Text>
                        <Animated.View style={estiloAnimadoIcono}>
                          <MaterialCommunityIcons
                            name={pronostico.icono}
                            size={32}
                            color={theme.colors.primary}
                          />
                        </Animated.View>
                      </View>
                    ) : (
                      <View style={{ alignItems: "center" }}>
                        <Text style={styles.txtPrevisionHora}>
                          {pronostico.hora}
                        </Text>
                        <MaterialCommunityIcons
                          name={pronostico.icono}
                          size={32}
                          color={theme.colors.primary}
                        />
                      </View>
                    )}
                    <Text style={styles.temperaturaPorHoras}>
                      {configuracion.unidadTemperatura === "celsius"
                        ? pronostico.temp_c
                        : pronostico.temp_f}
                      °
                    </Text>
                  </View>
                )
              )}
            </ScrollView>
          </Card.Content>
        </Card>

        {/* PRONÓSTICO DE PRÓXIMOS 3 DÍAS */}
        <Card style={styles.tarjetaPrevision}>
          <Card.Title title="Previsión de 3 días" />
          <Card.Content>
            {infoMeteorologia.pronostico_semanal.map((dia: any, index: number) => (
              <React.Fragment key={dia.fecha}>
                <View style={styles.previsionDiaria}>
                  <Text style={styles.diaPrevision}>
                    {index === 0 ? "Hoy" : dia.fecha}
                  </Text>
                  <MaterialCommunityIcons
                    name={dia.icono}
                    size={32}
                    color={theme.colors.primary}
                  />
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
                {index < infoMeteorologia.pronostico_semanal.length - 1 && (
                  <Divider />
                )}
              </React.Fragment>
            ))}
          </Card.Content>
        </Card>

        {/* INFORMACIÓN VARIADA */}
        <View
          style={{
            flexDirection: "row",
            columnGap: 16,
            marginBottom: 16,
            marginHorizontal: 16,
          }}
        >
          {/* INFORMACION ASTRONÓMICA */}
          <Card style={{ flex: 1 }}>
            <Card.Title title="Astronomía" />
            <Card.Content>
              <Text style={{ fontWeight: "bold" }}>
                Amanecer: <Text>{infoMeteorologia.astronomia.amanecer}</Text>
              </Text>
              <Text style={{ fontWeight: "bold" }}>
                Atardecer: <Text>{infoMeteorologia.astronomia.atardecer}</Text>
              </Text>
              <Text style={{ fontWeight: "bold" }}>
                Fase: <Text>{infoMeteorologia.astronomia.fase_lunar}</Text>
              </Text>
            </Card.Content>
          </Card>

          {/* INFORMACIÓN GENERAL */}
          <Card style={{ flex: 1 }}>
            <Card.Title title="General" />
            <Card.Content>
              <Text style={{ fontWeight: "bold" }}>
                Lluvia:{" "}
                <Text>{infoMeteorologia.pronostico_semanal[0].prob_lluvia}%</Text>
              </Text>
              <Text style={{ fontWeight: "bold" }}>
                Nieve:{" "}
                <Text>{infoMeteorologia.pronostico_semanal[1].prob_nieve}%</Text>
              </Text>
              <Text style={{ fontWeight: "bold" }}>
                Presión:{" "}
                <Text>
                  {configuracion.unidadMedidaPresion === "mb"
                    ? infoMeteorologia.clima_actual.presion_mb + " mb"
                    : infoMeteorologia.clima_actual.presion_in + " in"}
                </Text>
              </Text>
              <Text style={{ fontWeight: "bold" }}>
                Hora local:{" "}
                <Text>{infoMeteorologia.hora_local.split(" ")[1]}</Text>
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* ALERTAS METEOROLÓGICAS */}
        <Card style={styles.tarjetaPrevision}>
          <Card.Title title="Alertas meteorológicas" />
          <Card.Content style={{ display: "flex" }}>
            <Chip
              icon="alert"
              style={{ backgroundColor: theme.colors.primaryContainer }}
              textStyle={{ color: theme.colors.onPrimaryContainer }}
            >
              Por implementar
            </Chip>
          </Card.Content>
        </Card>

        <Text
          style={{ textAlign: "center", fontStyle: "italic", color: "grey" }}
          variant="bodySmall"
          onPress={async () => {
            Linking.openURL("https://www.weatherapi.com");
          }}
        >
          Datos obtenidos a través de WeatherAPI.com
        </Text>
      </ScrollView>

      <Snackbar
        visible={snackbarUbicacionVisible}
        onDismiss={() => {
          console.log("Snackbar cerrado");
        }}
        action={{
          label: "OK",
          onPress: async () => {
            setSnackbarUbicacionVisible(false);
          },
        }}
      >
        Ubicación no disponible. Se usará una por defecto.
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  iconoCabecera: {
    width: 100,
    height: 100,
    marginLeft: -5,
    marginRight: -15,
  },
  iconoPrevHoras: {
    width: 60,
    height: 60,
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
    marginTop: 25,
  },
  temperatura: {
    fontSize: 64,
    fontWeight: "bold",
  },
  condicion: {
    fontSize: 18,
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
    fontWeight: "bold",
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
    justifyContent: "space-evenly",
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
