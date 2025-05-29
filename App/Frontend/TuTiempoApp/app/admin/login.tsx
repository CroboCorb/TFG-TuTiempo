import { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import {
  Button,
  Card,
  HelperText,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import Animated, { FadeIn } from "react-native-reanimated";

import PantallaCarga from "@/components/PantallaCarga";
import { StatusBar } from "expo-status-bar";
import { cargarToken, guardarToken } from "@/functions/GestorSecureStore";
import { router } from "expo-router";
import { iniciarSesion_API } from "@/functions/GestorAPI";
import encriptarTexto from "@/functions/Utilidades";

export default function Login() {
  const theme = useTheme();

  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setEstadoCarga] = useState(true);
  const [cargaInicioSesion, setCargaInicioSesion] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usuarioInvalido = () => usuario.trim().length < 4;
  const contrasenaInvalida = () => contrasena.trim().length < 4;

  const gestionLogueo = async (usuario: string, contrasena: string) => {
    setCargaInicioSesion(true);
    setError(null);
    try {
      const respuesta = await iniciarSesion_API(usuario, await encriptarTexto(contrasena));
      if (respuesta) {
        if (respuesta.status === 200) {
          await guardarToken(respuesta.data);
          router.replace("/admin/testing");
        } else setError("Inicio de sesión incorrecto.");
      } else setError("Error de conexión.");
    } catch (e) {
      setError("Ocurrió un error inesperado.");
    } finally {
      setCargaInicioSesion(false);
    }
  };

  useEffect(() => {
    const recogerToken = async () => {
      const tokenGuardado = await cargarToken();
      if (tokenGuardado) router.replace("/admin/testing");
      else setEstadoCarga(false);
    };

    recogerToken();
  }, []);

  if (cargando) return <PantallaCarga />;

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        padding: 20,
      }}
    >
      <StatusBar
        style="light"
        backgroundColor={theme.colors.primary}
        translucent={false}
      />
      <Animated.View
        entering={FadeIn.duration(400)}
        style={{ alignItems: "center" }}
      >
        <Text
          variant="headlineMedium"
          style={{ fontWeight: "bold", marginBottom: 10 }}
        >
          Zona de Pruebas
        </Text>

        <Card
          style={{
            backgroundColor: theme.colors.elevation.level2,
            width: "100%",
            borderRadius: 16,
            paddingVertical: 20,
            paddingHorizontal: 10,
            elevation: 6,
          }}
        >
          <Card.Content>
            <TextInput
              label="Nombre de usuario"
              value={usuario}
              mode="outlined"
              onChangeText={setUsuario}
              style={{ marginBottom: 10 }}
            />
            <HelperText
              type="error"
              visible={usuario.length !== 0 && usuarioInvalido()}
            >
              ¡Longitud de usuario inválida!
            </HelperText>

            <TextInput
              label="Contraseña"
              value={contrasena}
              mode="outlined"
              onChangeText={setContrasena}
              secureTextEntry
              style={{ marginBottom: 10 }}
            />
            <HelperText
              type="error"
              visible={contrasena.length !== 0 && contrasenaInvalida()}
            >
              ¡Longitud de contraseña inválida!
            </HelperText>

            {error && (
              <Text
                style={{
                  color: theme.colors.error,
                  marginBottom: 10,
                  textAlign: "center",
                }}
              >
                {error}
              </Text>
            )}

            <Button
              icon="login"
              mode="contained"
              onPress={async () => gestionLogueo(usuario, contrasena)}
              loading={cargaInicioSesion}
              disabled={
                usuarioInvalido() || contrasenaInvalida() || cargaInicioSesion
              }
            >
              {cargaInicioSesion ? "Ingresando..." : "Iniciar sesión"}
            </Button>
          </Card.Content>
        </Card>
      </Animated.View>
    </ScrollView>
  );
}
