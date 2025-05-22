import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Divider,
  Text,
  List,
  RadioButton,
  useTheme,
  TouchableRipple,
  Snackbar,
} from "react-native-paper";

import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { Animation, FadeIn } from "react-native-reanimated";

const CONFIG = "@appConfig";

const SNACKBAR_DURACION = 2500;

export default function Options() {
  const theme = useTheme();

  const [visibilidadSnackbarMenuSecreto, setVisibilidadSnackbarMenuSecreto] =
    useState(false);
  const cerrarSnackbarMenuSecreto = async () =>
    setVisibilidadSnackbarMenuSecreto(false);

  const [visibilidadSnackbarInformacion, setVisibilidadSnackbarInformacion] =
    useState(false);
  const cerrarSnackbarInformacion = async () =>
    setVisibilidadSnackbarInformacion(false);

  const [valorLogin, setValorLogin] = useState(0);
  useEffect(() => {
    if (valorLogin === 5) setVisibilidadSnackbarMenuSecreto(true);
  }, [valorLogin]);

  const [unidadTemperatura, setUnidadTemperatura] = useState("celsius");
  const [unidadMedidaViento, setUnidadMedidaViento] = useState("kmh");
  const [unidadMedidaPresion, setUnidadMedidaPresion] = useState("hPa");

  const [cargando, setEstadoCarga] = useState(true);

  // Cargar la configuración del usuario
  useEffect(() => {
    const cargarConfiguracion = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem(CONFIG);
        if (jsonValue) {
          const saved = JSON.parse(jsonValue);
          setUnidadTemperatura(saved.unidadTemperatura || "celsius");
          setUnidadMedidaViento(saved.unidadMedidaViento || "kmh");
          setUnidadMedidaPresion(saved.unidadMedidaPresion || "mb");
        }
      } catch (e) {
        console.error("OPTIONS > Error al cargar la configuración:", e);
      } finally {
        console.log("OPTIONS > Configuración cargada correctamente.");
        setEstadoCarga(false);
      }
    };

    cargarConfiguracion();
  }, []);

  // Guardar los cambios del usuario
  const guardarConfiguracion = async (newSettings: any) => {
    try {
      const updated = {
        unidadTemperatura,
        unidadMedidaViento,
        unidadMedidaPresion,
        ...newSettings,
      };
      await AsyncStorage.setItem(CONFIG, JSON.stringify(updated));
      console.log("OPTIONS > Configuración guardada correctamente.");
    } catch (e) {
      console.error(
        "OPTIONS > Error al guardar los cambios en la configuración:",
        e
      );
    }
  };

  if (cargando) return <ActivityIndicator style={{ marginTop: 50 }} />;

  return (
    <View style={{ backgroundColor: theme.colors.background, flex: 1 }}>
      <Appbar.Header>
        <Appbar.BackAction
          onPress={async () => {
            router.back();
          }}
        />
        <Appbar.Content title="Configuración" />
        {valorLogin >= 5 ? (
          <Animated.View entering={FadeIn.duration(100)}>
            <Appbar.Action
              icon="shield-crown"
              onPress={async () => router.navigate("/admin/login")}
            />
          </Animated.View>
        ) : (
          <View />
        )}
      </Appbar.Header>

      <Divider />

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Control de unidad de temperatura */}
        <List.Section>
          <List.Subheader
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
          >
            Unidad de temperatura
          </List.Subheader>
          <RadioButton.Group
            value={unidadTemperatura}
            onValueChange={(value) => {
              setUnidadTemperatura(value);
              guardarConfiguracion({ unidadTemperatura: value });
            }}
          >
            <RadioButton.Item label="Celsius (°C)" value="celsius" />
            <RadioButton.Item label="Fahrenheit (°F)" value="fahrenheit" />
          </RadioButton.Group>
        </List.Section>

        <Divider />

        {/* Control de unidad de viento */}
        <List.Section>
          <List.Subheader
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
          >
            Unidad de velocidad del viento
          </List.Subheader>
          <RadioButton.Group
            value={unidadMedidaViento}
            onValueChange={(value) => {
              setUnidadMedidaViento(value);
              guardarConfiguracion({ unidadMedidaViento: value });
            }}
          >
            <RadioButton.Item label="Kilómetros por hora (km/h)" value="kmh" />
            <RadioButton.Item label="Millas por hora (mph)" value="mph" />
          </RadioButton.Group>
        </List.Section>

        <Divider />

        {/* Control de unidad de presión atmosférica */}
        <List.Section>
          <List.Subheader
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
          >
            Unidad de presión atmosférica
          </List.Subheader>
          <RadioButton.Group
            value={unidadMedidaPresion}
            onValueChange={(value) => {
              setUnidadMedidaPresion(value);
              guardarConfiguracion({ unidadMedidaPresion: value });
            }}
          >
            <RadioButton.Item label="Milibares (mb)" value="mb" />
            <RadioButton.Item label="Pulgadas (in)" value="in" />
          </RadioButton.Group>
        </List.Section>

        <Divider />

        {/* Apartado secundario */}
        <List.Section>
          <List.Subheader
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
          >
            Otros
          </List.Subheader>

          <TouchableRipple
            style={{ padding: 15 }}
            onPress={async () => {
              if (!visibilidadSnackbarInformacion)
                setVisibilidadSnackbarInformacion(true);
            }}
          >
            <Text variant="bodyLarge">Información</Text>
          </TouchableRipple>

          <TouchableRipple
            style={{ padding: 15 }}
            onPress={async () => setValorLogin(valorLogin + 1)}
          >
            <Text variant="bodyLarge">Menú de testeo</Text>
          </TouchableRipple>
        </List.Section>
      </ScrollView>

      {/* SNACKBARS */}
      <Snackbar
        duration={SNACKBAR_DURACION}
        visible={visibilidadSnackbarInformacion}
        onDismiss={cerrarSnackbarInformacion}
      >
        <Text style={{ textAlign: "center", color: theme.colors.surface }}>
          Daniel Brugués Severyn - CFGS 2º DAM
        </Text>
      </Snackbar>
      <Snackbar
        duration={SNACKBAR_DURACION}
        visible={visibilidadSnackbarMenuSecreto}
        onDismiss={cerrarSnackbarMenuSecreto}
      >
        <Text style={{ textAlign: "center", color: theme.colors.surface }}>
          ¡Menú de administración activado!
        </Text>
      </Snackbar>
    </View>
  );
}
