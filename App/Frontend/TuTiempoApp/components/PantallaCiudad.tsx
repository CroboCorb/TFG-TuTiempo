import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  Linking,
  RefreshControl,
} from "react-native";
import {
  Appbar,
  Card,
  Chip,
  Divider,
  MD3Colors,
  Surface,
  Text,
  Tooltip,
  useTheme,
} from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Configuracion } from "@/types/Configuracion";
import { InfoMeteorologia } from "@/types/InfoMeteorologia";
import { Ciudad } from "@/types/Ciudad";

import { UbicacionActual } from "@/functions/GestorUbicacion";
import { actualizarListadoCiudades } from "@/functions/GestorAsyncStorage";
import {
  infoSegunCardinalidad_API,
  infoSegunNombre_API,
} from "@/functions/GestorAPI";

import CabeceraCentrada from "./CabeceraCentrada";
import ModalAlerta from "./ModalAlerta";
import {
  convertirMedidaPresion,
  convertirMedidaViento,
} from "@/functions/Utilidades";

export default function PantallaCiudad({
  infoMeteorologia,
  configuracion,
  ultimaActualizacion,
  esPorUbicacion,
  onUpdate,
}: {
  infoMeteorologia: InfoMeteorologia;
  configuracion: Configuracion;
  ultimaActualizacion: Date;
  esPorUbicacion: boolean;
  onUpdate?: () => void;
}) {
  const theme = useTheme();

  // Constante de control de recarga
  const [recarga, setEstadoRecarga] = useState(false);

  // Constantes de control de conversión de medidas
  const [climaActualViento, setClimaActualViento] = useState<string>("");
  const [climaActualPresion, setClimaActualPresion] = useState<string>("");

  // Constantes de control de visibilidad de modales de alerta
  const [datosModal, setDatosModal] = useState<InfoMeteorologia["alertas"]>();
  const [visibilidadModal, setVisibilidadModal] = useState<boolean>(false);

  // Constantes de ícono animado de temperatura
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

  /**
   * Método encargado de actualizar la información meteorológica de la
   * pantalla actual, diferenciando las solicitudes según si la ciudad
   * fue solicitada / guardada con ubicación o no, y llamando al método
   * padre "onUpdate()" para actualizar la Flatlist desde el índice.
   */
  const actualizarInfo = async () => {
    setEstadoRecarga(true);
    let resultado: any;

    if (
      (new Date().getTime() - new Date(ultimaActualizacion).getTime()) /
        60000 >=
      15
    ) {
      if (esPorUbicacion) {
        const ubicacionActual = await UbicacionActual();

        if (ubicacionActual) {
          resultado = await infoSegunCardinalidad_API(
            ubicacionActual[0].toString(),
            ubicacionActual[1].toString()
          );
        }
      } else resultado = await infoSegunNombre_API(infoMeteorologia.ubicacion);

      if (resultado && resultado.status === 200) {
        const nuevaCiudad: Ciudad = {
          nombre: resultado.data.ubicacion,
          usaUbicacion: esPorUbicacion,
          ultimaActualizacion: new Date(),
          meteorologia: resultado.data,
        };

        const valorRetorno = await actualizarListadoCiudades(nuevaCiudad);
        if (valorRetorno) {
          onUpdate?.();
        } else
          console.error("INDEX > Error al actualizar el listado de ciudades.");
      } else if (!resultado || (resultado && resultado.status !== 200)) {
        console.error("PantallaCiudad > CONN ERROR.");
      }
    }

    setEstadoRecarga(false);
  };

  // Convierte los datos a la medida preferida del usuario
  useEffect(() => {
    const convertir = async () => {
      if (!recarga) {
        setClimaActualViento(
          await convertirMedidaViento(
            configuracion.unidadMedidaViento,
            infoMeteorologia.clima_actual.viento_kmh
          )
        );
        setClimaActualPresion(
          await convertirMedidaPresion(
            configuracion.unidadMedidaPresion,
            infoMeteorologia.clima_actual.presion_mb
          )
        );
      }
    };

    convertir();
  }, [recarga, infoMeteorologia, configuracion]);

  return (
    <View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={recarga} onRefresh={actualizarInfo} />
        }
      >
        {/* ---------- CABECERA ---------- */}
        <Appbar.Header
          style={{
            backgroundColor: "#0000",
            marginTop: 0,
            marginBottom: -25,
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
            title={infoMeteorologia.ubicacion}
            style={{ color: theme.colors.surface, fontWeight: "bold" }}
            variant="titleLarge"
            esPorUbicacion={esPorUbicacion}
          />
          <Appbar.Action
            icon="cog"
            iconColor={theme.colors.surface}
            style={{ backgroundColor: theme.colors.onPrimaryContainer }}
            onPress={async () => router.navigate("/options")}
          />
        </Appbar.Header>

        {/* CABECERA DE INFORMACIÓN PRINCIPAL */}
        <View
          style={[
            styles.tiempoActual,
            { backgroundColor: theme.colors.primary, paddingBottom: 25 },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 15,
            }}
          >
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
                  infoMeteorologia.pronostico_actual[new Date().getHours()]
                    .icono
                }
                size={70}
                color={theme.colors.surface}
              />
            </Animated.View>
          </View>
          <Text
            style={{
              fontSize: 18,
              color: theme.colors.surface,
              marginBottom: 8,
            }}
          >
            {infoMeteorologia.clima_actual.condicion}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.surfaceVariant,
              fontStyle: "italic",
              marginBottom: -12,
            }}
          >
            {new Date(infoMeteorologia.ultima_actualizacion)
              .toLocaleString()
              .slice(0, -3)}
          </Text>
        </View>

        {/* RESUMEN GENERAL */}
        <View style={{ backgroundColor: theme.colors.background }}>
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
                enterTouchDelay={0}
                leaveTouchDelay={1000}
              >
                <View style={styles.elementoResumen}>
                  <MaterialCommunityIcons
                    name="weather-windy"
                    size={24}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.txtValor}>{climaActualViento}</Text>
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
                    ? infoMeteorologia.clima_actual.sensacion_c
                    : infoMeteorologia.clima_actual.sensacion_f}
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
                nestedScrollEnabled={true}
                showsHorizontalScrollIndicator={false}
              >
                {infoMeteorologia.pronostico_actual.map(
                  (pronostico: any, index: number) => (
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
              {infoMeteorologia.pronostico_semanal.map(
                (dia: any, index: number) => (
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
                )
              )}
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
            <Card
              style={{
                flex: 1,
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Card.Title title="Astronomía" />
              <Card.Content>
                <Text style={{ fontWeight: "bold" }}>
                  Amanecer: <Text>{infoMeteorologia.astronomia.amanecer}</Text>
                </Text>
                <Text style={{ fontWeight: "bold" }}>
                  Atardecer:{" "}
                  <Text>{infoMeteorologia.astronomia.atardecer}</Text>
                </Text>
                <Text style={{ fontWeight: "bold" }}>
                  Fase: <Text>{infoMeteorologia.astronomia.fase_lunar}</Text>
                </Text>
              </Card.Content>
            </Card>

            {/* INFORMACIÓN GENERAL */}
            <Card
              style={{
                flex: 1,
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Card.Title title="General" />
              <Card.Content>
                <Text style={{ fontWeight: "bold" }}>
                  Lluvia:{" "}
                  <Text>
                    {infoMeteorologia.pronostico_semanal[0].prob_lluvia}%
                  </Text>
                </Text>
                <Text style={{ fontWeight: "bold" }}>
                  Nieve:{" "}
                  <Text>
                    {infoMeteorologia.pronostico_semanal[0].prob_nieve}%
                  </Text>
                </Text>
                <Text style={{ fontWeight: "bold" }}>
                  Presión:{" "}
                  <Text>
                    {/* {configuracion.unidadMedidaPresion === "mb"
                      ? infoMeteorologia.clima_actual.presion_mb + " mb"
                      : infoMeteorologia.clima_actual.presion_in + " in"} */}
                    {climaActualPresion}
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
          {infoMeteorologia.alertas.length > 0 ? (
            <Card style={styles.tarjetaPrevision}>
              <View style={{ marginTop: 8 }} />
              {infoMeteorologia.alertas.map((alerta, index) => (
                <Chip
                  key={index}
                  icon={() => (
                    <MaterialCommunityIcons
                      name="alert"
                      size={18}
                      color={
                        alerta.gravedad === "Alta"
                          ? MD3Colors.error50
                          : MD3Colors.error70
                      }
                    />
                  )}
                  style={{
                    backgroundColor: theme.colors.primaryContainer,
                    margin: 8,
                    marginStart: 12,
                    marginEnd: 12,
                  }}
                  elevated={true}
                  elevation={1}
                  onPress={async () => {
                    setDatosModal(alerta);
                    setVisibilidadModal(true);
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      flexWrap: "wrap",
                      color: theme.colors.onPrimaryContainer,
                    }}
                  >
                    {alerta.evento}
                  </Text>
                </Chip>
              ))}
              <View style={{ marginBottom: 8 }} />
            </Card>
          ) : (
            <Card style={styles.tarjetaPrevision}>
              <Card.Title title="Alertas meteorológicas" />
              <Card.Content style={{ display: "flex" }}>
                <Chip
                  icon="check"
                  style={{ backgroundColor: theme.colors.primaryContainer }}
                  textStyle={{ color: theme.colors.onPrimaryContainer }}
                >
                  Sin alertas
                </Chip>
              </Card.Content>
            </Card>
          )}

          <Text
            style={{
              textAlign: "center",
              fontStyle: "italic",
              color: "grey",
              marginBottom: 16,
            }}
            variant="bodySmall"
            onPress={async () => {
              Linking.openURL("https://www.weatherapi.com");
            }}
          >
            Datos obtenidos a través de WeatherAPI.com
          </Text>
        </View>
      </ScrollView>

      {visibilidadModal && (
        <ModalAlerta
          visibilidadModal={visibilidadModal}
          cerrarModal={async () => setVisibilidadModal(false)}
          infoAlerta={datosModal}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tiempoActual: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  temperatura: {
    fontSize: 64,
    fontWeight: "bold",
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
