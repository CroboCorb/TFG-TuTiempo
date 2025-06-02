import { useEffect, useState } from "react";
import { Linking, ScrollView, View } from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Divider,
  Text,
  List,
  useTheme,
  TouchableRipple,
  Snackbar,
} from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";

import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";

import {
  cargarConfiguracion,
  guardarConfiguracion,
} from "@/functions/GestorAsyncStorage";

const SNACKBAR_DURACION = 2500;

const MEDIDAS_TEMPERATURA = [
  { label: "Celsius (°C)", value: "celsius" },
  { label: "Fahrenheit (°F)", value: "fahrenheit" },
];
const MEDIDAS_VIENTO = [
  { label: "Escala Beaufort", value: "beaufort" },
  { label: "Kilómetros por hora (km/h)", value: "kmh" },
  { label: "Metros por segundo (m/s)", value: "ms" },
  { label: "Millas por hora (mph)", value: "mph" },
  { label: "Nudos (kn)", value: "kn" },
];
const MEDIDAS_PRESION = [
  { label: "Hectopascal (hPa)", value: "hPa" },
  { label: "Milibares (mbar)", value: "mbar" },
  { label: "Milímetro de mercurio (mmHg)", value: "mmHg" },
  { label: "Pulgada de mercurio (inHg)", value: "inHg" },
  { label: "Atmósfera estándar (atm)", value: "atm" },
];

export default function Options() {
  const theme = useTheme();

  const [visibilidadSnackbarInformacion, setVisibilidadSnackbarInformacion] =
    useState(false);
  const cerrarSnackbarInformacion = async () =>
    setVisibilidadSnackbarInformacion(false);

  const [unidadTemperatura, setUnidadTemperatura] = useState<string>();
  const [unidadMedidaViento, setUnidadMedidaViento] = useState<string>();
  const [unidadMedidaPresion, setUnidadMedidaPresion] = useState<string>();

  const [cargando, setEstadoCarga] = useState(true);

  // Cargar la configuración del usuario
  useEffect(() => {
    const carga = async () => {
      const configuracion = await cargarConfiguracion();
      if (configuracion) {
        const valores = JSON.parse(configuracion);
        setUnidadTemperatura(valores.unidadTemperatura || "celsius");
        setUnidadMedidaViento(valores.unidadMedidaViento || "kmh");
        setUnidadMedidaPresion(valores.unidadMedidaPresion || "hPa");

        console.info("OPTIONS > Configuración cargada correctamente.");
      } else {
        console.warn("OPTIONS > No existe configuración en memoria.");
        setUnidadTemperatura("celsius");
        setUnidadMedidaViento("kmh");
        setUnidadMedidaPresion("hPa");
      }

      setEstadoCarga(false);
    };

    carga();
  }, []);

  // Guardar los cambios del usuario
  const guardado = async (nuevaConfiguracion: any) => {
    const configuracion = {
      unidadTemperatura,
      unidadMedidaViento,
      unidadMedidaPresion,
      ...nuevaConfiguracion,
    };

    const configGuardada = await guardarConfiguracion(
      JSON.stringify(configuracion)
    );

    if (configGuardada)
      console.info("OPTIONS > Configuración guardada correctamente.");
    else
      console.error(
        "OPTIONS > Error al guardar los cambios en la configuración"
      );
  };

  if (cargando) return <ActivityIndicator style={{ marginTop: 50 }} />;

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
        <Appbar.Content title="Configuración" />
      </Appbar.Header>

      <Divider />

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Control de unidades de medida */}
        <List.Section>
          <List.Subheader
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
          >
            Unidades de medida
          </List.Subheader>

          {/* Control de unidad de temperatura */}
          <View style={{ paddingStart: 16, paddingEnd: 16 }}>
            <Dropdown
              label={"Unidad de temperatura"}
              options={MEDIDAS_TEMPERATURA}
              value={unidadTemperatura}
              onSelect={async (value) => {
                setUnidadTemperatura(value);
                guardado({ unidadTemperatura: value });
              }}
              mode={"outlined"}
              hideMenuHeader
            />
          </View>

          {/* Control de unidad de viento */}
          <View style={{ marginTop: 16, paddingStart: 16, paddingEnd: 16 }}>
            <Dropdown
              label={"Unidad de viento"}
              options={MEDIDAS_VIENTO}
              value={unidadMedidaViento}
              onSelect={async (value) => {
                setUnidadMedidaViento(value);
                guardado({ unidadMedidaViento: value });
              }}
              mode={"outlined"}
              hideMenuHeader
            />
          </View>

          {/* Control de unidad de presión atmosférica */}
          <View style={{ marginTop: 16, paddingStart: 16, paddingEnd: 16 }}>
            <Dropdown
              label={"Unidad de presión atmosférica"}
              options={MEDIDAS_PRESION}
              value={unidadMedidaPresion}
              onSelect={async (value) => {
                setUnidadMedidaPresion(value);
                guardado({ unidadMedidaPresion: value });
              }}
              mode={"outlined"}
              hideMenuHeader
            />
          </View>
        </List.Section>

        <Divider style={{ marginTop: 16, marginStart: 16, marginEnd: 16 }} />

        {/* Apartado secundario */}
        <List.Section>
          <List.Subheader
            style={{ fontWeight: "bold", textTransform: "uppercase" }}
          >
            Acerca de
          </List.Subheader>

          <TouchableRipple
            style={{ padding: 15 }}
            onPress={async () => {
              Linking.openURL("https://github.com/CroboCorb/TFG-TuTiempo");
            }}
          >
            <Text variant="bodyLarge">Repositorio</Text>
          </TouchableRipple>

          <TouchableRipple
            style={{ padding: 15 }}
            onPress={async () => router.navigate("/admin/login")}
          >
            <Text variant="bodyLarge">Administración</Text>
          </TouchableRipple>
        </List.Section>
      </ScrollView>
    </View>
  );
}
