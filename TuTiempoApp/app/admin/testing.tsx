import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Card,
  Text,
  Button,
  useTheme,
  Divider,
  Appbar,
  TextInput,
  HelperText,
} from "react-native-paper";
import { router } from "expo-router";

import {
  datosMeteorologia_API,
  listadoCredenciales_API,
  listadoTokens_API,
  registrarUsuario_API,
} from "@/hooks/useAPIManager";
import JSONTree from "react-native-json-tree";

export default function Testing() {
  const theme = useTheme();
  const emptyJSON = [
    {
      status: "empty",
    },
  ];

  const [listadoCredenciales, setListadoCredenciales] = useState(emptyJSON);
  const obtenerCredenciales = async () => {
    const respuesta: any = await listadoCredenciales_API(
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZWYxNjNmNC04OGM1LTQ5OGYtODY2MC01YTY0NmFiMmZmN2MiLCJleHAiOjE3NDc1Mjg0Mjl9.GKQoE1xoN0qtu5Y_6jt1wD14Qsy7A2kvnXbYq9x8UdM"
    );
    if (respuesta && respuesta.status === 200)
      setListadoCredenciales(respuesta);
  };

  const [listadoTokens, setListadoTokens] = useState(emptyJSON);
  const obtenerTokens = async () => {
    const respuesta: any = await listadoTokens_API(
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZWYxNjNmNC04OGM1LTQ5OGYtODY2MC01YTY0NmFiMmZmN2MiLCJleHAiOjE3NDY3NDQ2NDl9.2Gd1d5R44fm_xQxyRT-3c5-FyKgE1MjXYVyG2Ro2IWU"
    );
    if (respuesta && respuesta.status === 200) setListadoTokens(respuesta);
  };

  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [resultadoRegistro, setResultadoRegistro] = useState(emptyJSON);

  const usuarioInvalido = () => {
    return usuario.length < 4;
  };
  const contrasenaInvalida = () => {
    return contrasena.length < 4;
  };

  const registrarUsuario = async (usuario: string, contrasena: string) => {
    const respuesta: any = await registrarUsuario_API(
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZWYxNjNmNC04OGM1LTQ5OGYtODY2MC01YTY0NmFiMmZmN2MiLCJleHAiOjE3NDY3NDQ2NDl9.2Gd1d5R44fm_xQxyRT-3c5-FyKgE1MjXYVyG2Ro2IWU",
      usuario,
      contrasena
    );
    if (respuesta && respuesta.status === 200) setResultadoRegistro(respuesta);
  };

  const [infoMeteorologica, setInfoMeteorologica] = useState(emptyJSON);
  const consultarDatosMeteorologicos = async() => {
    const respuesta: any = await datosMeteorologia_API(
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZWYxNjNmNC04OGM1LTQ5OGYtODY2MC01YTY0NmFiMmZmN2MiLCJleHAiOjE3NDY3NDQ2NDl9.2Gd1d5R44fm_xQxyRT-3c5-FyKgE1MjXYVyG2Ro2IWU",
    );
    if (respuesta && respuesta.status === 200) setInfoMeteorologica(respuesta);
  }

  const limpiarJSON = async () => {
    setListadoCredenciales(emptyJSON);
    setListadoTokens(emptyJSON);

    setUsuario("");
    setContrasena("");
    setResultadoRegistro(emptyJSON);

    setInfoMeteorologica(emptyJSON);
  };

  return (
    <ScrollView
      contentContainerStyle={{
        backgroundColor: theme.colors.background,
      }}
    >
      <Appbar.Header>
        <Appbar.BackAction
          onPress={async () => {
            router.navigate("../");
          }}
        />
        <Appbar.Content title="Zona de pruebas de API" />
        <Appbar.Action
          icon="refresh"
          onPress={async () => {
            limpiarJSON();
          }}
        />
      </Appbar.Header>

      <Divider style={{ margin: 15 }} />

      <ScrollView>
        <Card
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.elevation.level2,
            },
          ]}
        >
          <Card.Content>
            <Text
              variant="titleLarge"
              style={{ fontWeight: "bold", textAlign: "center" }}
            >
              Listado de credenciales
            </Text>
            <Divider style={{ marginTop: 15, marginBottom: 15 }} />
            <Button
              onPress={async () => obtenerCredenciales()}
              icon={"database-arrow-down-outline"}
              mode="contained"
            >
              Obtener credenciales
            </Button>
            <ScrollView
              horizontal
              contentContainerStyle={[
                styles.scrollview,
                {
                  backgroundColor: theme.colors.elevation.level2,
                },
              ]}
            >
              {listadoCredenciales &&
              !JSON.stringify(listadoCredenciales).includes("empty") ? (
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    flex: 1,
                  }}
                >
                  <JSONTree data={listadoCredenciales} />
                </View>
              ) : (
                <View></View>
              )}
            </ScrollView>
          </Card.Content>
        </Card>
      </ScrollView>

      <ScrollView>
        <Card
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.elevation.level2,
            },
          ]}
        >
          <Card.Content>
            <Text
              variant="titleLarge"
              style={{ fontWeight: "bold", textAlign: "center" }}
            >
              Listado de tokens
            </Text>
            <Divider style={{ marginTop: 15, marginBottom: 15 }} />
            <Button
              onPress={async () => obtenerTokens()}
              icon={"database-arrow-down-outline"}
              mode="contained"
            >
              Obtener tokens
            </Button>
            <ScrollView
              horizontal
              contentContainerStyle={[
                styles.scrollview,
                {
                  backgroundColor: theme.colors.elevation.level2,
                },
              ]}
            >
              {listadoTokens &&
              !JSON.stringify(listadoTokens).includes("empty") ? (
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    flex: 1,
                  }}
                >
                  <JSONTree data={listadoTokens} />
                </View>
              ) : (
                <View></View>
              )}
            </ScrollView>
          </Card.Content>
        </Card>
      </ScrollView>

      <ScrollView>
        <Card
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.elevation.level2,
            },
          ]}
        >
          <Card.Content>
            <Text
              variant="titleLarge"
              style={{ fontWeight: "bold", textAlign: "center" }}
            >
              Registrar administrador
            </Text>
            <Divider style={{ marginTop: 15, marginBottom: 15 }} />
            <TextInput
              label="Nombre de usuario"
              value={usuario}
              mode="outlined"
              onChangeText={(usuario) => setUsuario(usuario)}
            />
            {usuario.length !== 0 && usuarioInvalido() ? (
              <HelperText
                type="error"
                visible={usuario.length !== 0 && usuarioInvalido()}
              >
                ¡Longitud de usuario inválida!
              </HelperText>
            ) : (
              <View></View>
            )}

            <TextInput
              label="Contraseña"
              value={contrasena}
              mode="outlined"
              onChangeText={(contrasena) => setContrasena(contrasena)}
              secureTextEntry
            />
            {contrasena.length !== 0 && contrasenaInvalida() ? (
              <HelperText
                type="error"
                visible={contrasena.length !== 0 && contrasenaInvalida()}
              >
                ¡Longitud de contraseña inválida!
              </HelperText>
            ) : (
              <View></View>
            )}
            <Button
              style={{ marginTop: 15 }}
              onPress={async () => registrarUsuario(usuario, contrasena)}
              icon={"account-plus-outline"}
              mode="contained"
            >
              Registrar usuario
            </Button>
            <ScrollView
              horizontal
              contentContainerStyle={[
                styles.scrollview,
                {
                  backgroundColor: theme.colors.elevation.level2,
                },
              ]}
            >
              {resultadoRegistro &&
              !JSON.stringify(resultadoRegistro).includes("empty") ? (
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    flex: 1,
                  }}
                >
                  <JSONTree data={resultadoRegistro} />
                </View>
              ) : (
                <View></View>
              )}
            </ScrollView>
          </Card.Content>
        </Card>
      </ScrollView>

      <ScrollView>
        <Card
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.elevation.level2,
            },
          ]}
        >
          <Card.Content>
            <Text
              variant="titleLarge"
              style={{ fontWeight: "bold", textAlign: "center" }}
            >
              Estado meteorológico
            </Text>
            <Divider style={{ marginTop: 15, marginBottom: 15 }} />
            <Button
              onPress={async () => consultarDatosMeteorologicos()}
              icon={"weather-cloudy-clock"}
              mode="contained"
            >
              Solicitar información
            </Button>
            <ScrollView
              horizontal
              contentContainerStyle={[
                styles.scrollview,
                {
                  backgroundColor: theme.colors.primaryContainer,
                },
              ]}
            >
              {infoMeteorologica &&
              !JSON.stringify(infoMeteorologica).includes("empty") ? (
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    flex: 1,
                  }}
                >
                  <JSONTree data={infoMeteorologica} />
                </View>
              ) : (
                <View></View>
              )}
            </ScrollView>
          </Card.Content>
        </Card>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollview: {
    marginTop: 15,
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 10,
    margin: 15,
    padding: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
  },
});
