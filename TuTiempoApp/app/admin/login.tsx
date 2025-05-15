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
import { useSession } from "@/functions/AuthProvider";
import PantallaCarga from "@/components/PantallaCarga";

export default function Login() {
  const { session, isLoading, verificarTokenUsuario, iniciarSesion } =
    useSession();

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
      await iniciarSesion({ usuario, contrasena });
    } catch (e) {
      setError("Ocurrió un error inesperado.");
    } finally {
      setCargaInicioSesion(false);
    }
  };

  useEffect(() => {
    if (!session && isLoading) return;

    if (!isLoading) {
      if (session) {
        const verificarToken = async (token: string) => {
          try {
            await verificarTokenUsuario(token);
          } catch (error) {
            console.error("Error al cargar los datos del usuario:", error);
          } finally {
            setEstadoCarga(false);
          }
        };

        verificarToken(session);
      } else {
        setEstadoCarga(false);
      }
    }
  }, [session]);

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
