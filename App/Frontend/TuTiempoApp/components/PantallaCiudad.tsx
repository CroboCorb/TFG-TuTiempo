import React, { useEffect } from "react";
import { ScrollView, View, StyleSheet, Linking } from "react-native";
import {
  Card,
  Chip,
  Divider,
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

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Configuracion } from "@/types/Configuracion";
import { InfoMeteorologia } from "@/types/InfoMeteorologia";

const COORDS_DEFECTO = [40.4165, -3.70256];

export default function PantallaCiudad({
  infoMeteorologia,
  configuracion,
}: {
  infoMeteorologia: InfoMeteorologia;
  configuracion: Configuracion;
}) {
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

  return (
    <View>
      <ScrollView
      // refreshControl={
      //   <RefreshControl refreshing={recarga} onRefresh={actualizarInfo} />
      // }
      >
        {/* CABECERA DE INFORMACIÓN PRINCIPAL */}
        <View
          style={[
            styles.tiempoActual,
            { backgroundColor: theme.colors.primary, paddingBottom: 25 },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 15 }}>
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
          <Text style={{ fontSize: 18, color: theme.colors.surface, marginBottom: 8 }}>
            {infoMeteorologia.clima_actual.condicion}
          </Text>
          <Text style={{ fontSize: 14, color: theme.colors.surfaceVariant, fontStyle: 'italic', marginBottom: -12 }}>
            {new Date(infoMeteorologia.ultima_actualizacion).toLocaleString().slice(0, -3)}
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
                <Text>
                  {infoMeteorologia.pronostico_semanal[0].prob_lluvia}%
                </Text>
              </Text>
              <Text style={{ fontWeight: "bold" }}>
                Nieve:{" "}
                <Text>
                  {infoMeteorologia.pronostico_semanal[1].prob_nieve}%
                </Text>
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
