import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import {
  Button,
  Card,
  HelperText,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import Animated, { FadeIn } from "react-native-reanimated";
import { iniciarSesion_API } from "@/hooks/useAPIManager";
import encriptar from "@/hooks/usePasswordCrypt";

export default function Login() {
  const router = useRouter();
  const theme = useTheme();

  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usuarioInvalido = () => usuario.trim().length < 4;
  const contrasenaInvalida = () => contrasena.trim().length < 4;

  const iniciarSesion = async (usuario: string, contrasena: string) => {
    setCargando(true);
    setError(null);
    try {
      const respuesta = await iniciarSesion_API(
        usuario,
        encriptar(contrasena)
      );
      if (respuesta && respuesta.status === 200) {
        router.navigate("/admin/testing");
      } else {
        setError("Usuario o contraseña incorrectos.");
      }
    } catch (e) {
      setError("Ocurrió un error inesperado.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 20,
        }}
      >
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
                onPress={() => iniciarSesion(usuario, contrasena)}
                loading={cargando}
                disabled={
                  usuarioInvalido() || contrasenaInvalida() || cargando
                }
              >
                {cargando ? "Ingresando..." : "Iniciar sesión"}
              </Button>
            </Card.Content>
          </Card>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
