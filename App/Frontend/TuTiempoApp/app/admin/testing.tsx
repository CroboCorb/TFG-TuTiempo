import { useEffect, useState } from "react";
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
  Menu,
} from "react-native-paper";
import JSONTree from "react-native-json-tree";

import { City, ICity } from "country-state-city";
import { router } from "expo-router";
import debounce from "lodash.debounce";
import { StatusBar } from "expo-status-bar";

import {
  infoSegunNombre_API,
  listadoCredenciales_API,
  listadoTokens_API,
  registrarUsuario_API,
} from "@/functions/GestorAPI";
import { cargarToken, eliminarToken } from "@/functions/GestorSecureStore";
import encriptarTexto from "@/functions/Utilidades";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function Testing() {
  const theme = useTheme();
  const emptyJSON = [
    {
      status: "empty",
    },
  ];
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    const precargaToken = async () => {
      const tokenRecibido = await cargarToken();
      if (tokenRecibido) setToken(tokenRecibido);
      else router.back();
    };

    precargaToken();
  }, []);

  // Variable y método de obtención del listado de credenciales
  const [listadoCredenciales, setListadoCredenciales] = useState(emptyJSON);
  const obtenerCredenciales = async () => {
    const respuesta: any = await listadoCredenciales_API(token);
    if (respuesta && respuesta.status === 200) {
      setListadoCredenciales(respuesta);
      console.info('TESTING > Credenciales obtenidas correctamente.');
    } else console.warn('TESTING > Error al obtener las credenciales.');
  };

  // Variable y método de obtención del listado de tokens
  const [listadoTokens, setListadoTokens] = useState(emptyJSON);
  const obtenerTokens = async () => {
    const respuesta: any = await listadoTokens_API(token);
    if (respuesta && respuesta.status === 200) {
      setListadoTokens(respuesta);
      console.info('TESTING > Tokens obtenidos correctamente.');
    } else console.warn('TESTING > Error al obtener los tokens.');
  };

  // Variables de control para el registro
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [resultadoRegistro, setResultadoRegistro] = useState(emptyJSON);

  // Métodos de control para el registro
  const usuarioInvalido = () => {
    return usuario.length < 4;
  };
  const contrasenaInvalida = () => {
    return contrasena.length < 4;
  };

  // Método de registro para un nuevo administrador
  const registrarUsuario = async (usuario: string, contrasena: string) => {
    const respuesta: any = await registrarUsuario_API(
      token,
      usuario,
      await encriptarTexto(contrasena)
    );
    if (respuesta && respuesta.status === 200) {
      setResultadoRegistro(respuesta);
      setUsuario("");
      setContrasena("");
    }
  };

  // Variables de control para la búsqueda de ciudades
  const [ciudadConsulta, setCiudadConsulta] = useState("");
  const [infoMeteorologica, setInfoMeteorologica] = useState(emptyJSON);

  const [sugerenciasCiudades, setSugerenciasCiudades] = useState([]);
  const [ciudadesPais] = useState<ICity[]>(City.getCitiesOfCountry("ES")!);

  // Filtrado con debounce (mejor UX)
  const filtrarCiudades = debounce((input) => {
    if (input.length < 2) {
      setSugerenciasCiudades([]);
      return;
    }
    const lowerInput = input.toLowerCase();
    const resultados = ciudadesPais!
      .filter((c) => c.name.toLowerCase().startsWith(lowerInput))
      .slice(0, 10);
    setSugerenciasCiudades(resultados);
  }, 200);

  useEffect(() => {
    filtrarCiudades(ciudadConsulta);
  }, [ciudadConsulta]);

  // Método para la consulta de la meteorología de la ciudad solicitada
  const consultarDatosMeteorologicos = async () => {
    const respuesta: any = await infoSegunNombre_API(ciudadConsulta);
    if (respuesta && respuesta.status === 200) setInfoMeteorologica(respuesta);
  };

  const [visible, setVisible] = useState(false);
  const closeMenu = () => setVisible(false);

  /**
   * 
   */
  const limpiarJSON = async () => {
    setListadoCredenciales(emptyJSON);
    setListadoTokens(emptyJSON);

    setUsuario("");
    setContrasena("");
    setResultadoRegistro(emptyJSON);

    setCiudadConsulta("");
    setInfoMeteorologica(emptyJSON);

    console.info("TESTING > Pantalla limpiada.");
  };

  return (
    <ScrollView
      contentContainerStyle={{
        backgroundColor: theme.colors.background,
      }}
    >
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
        <Appbar.Content title="Administración" />

        <Menu
          visible={visible}
          onDismiss={closeMenu}
          anchor={
            <MaterialCommunityIcons
              name="dots-vertical"
              size={24}
              style={{ marginRight: 4 }}
              onPress={async () => {
                setVisible(true);
              }}
              color={theme.colors.primary}
            />
          }
        >
          <Menu.Item
            onPress={async () => {
              limpiarJSON();
              setVisible(false);
            }}
            title="Limpiar JSONs"
          />
          <Menu.Item onPress={async () => {
            await eliminarToken();
            router.replace('/admin/login');
          }} title="Cerrar sesión" />
        </Menu>
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

            <TextInput
              label="Ciudad"
              value={ciudadConsulta}
              mode="outlined"
              onChangeText={setCiudadConsulta}
              right={<TextInput.Icon icon="map-marker" />}
            />

            {ciudadConsulta.length > 1 && sugerenciasCiudades.length > 0 && (
              <Card
                style={{
                  marginTop: 10,
                  backgroundColor: theme.colors.elevation.level1,
                }}
              >
                <Card.Content>
                  {sugerenciasCiudades.map((ciudad, index) => (
                    <Button
                      key={index}
                      onPress={async () => {
                        setCiudadConsulta(ciudad.name);
                        setSugerenciasCiudades([]);
                      }}
                      style={{ alignItems: "flex-start" }}
                      contentStyle={{ justifyContent: "flex-start" }}
                    >
                      {ciudad.name}
                    </Button>
                  ))}
                </Card.Content>
              </Card>
            )}

            <Button
              style={{ marginTop: 15 }}
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
