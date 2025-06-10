import { Dimensions, ScrollView } from "react-native";
import {
  Card,
  Modal,
  Portal,
  useTheme,
  Divider,
  List,
} from "react-native-paper";

export default function ModalAlerta({
  visibilidadModal,
  cerrarModal,
  infoAlerta,
}: any) {
  const theme = useTheme();

  return (
    <Portal>
      <Modal
        visible={visibilidadModal}
        onDismiss={cerrarModal}
        contentContainerStyle={{ margin: 20 }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Card style={{ backgroundColor: theme.colors.background }}>
            <Card.Content>
              <List.Item
                title="Tipo"
                titleStyle={{ fontWeight: "bold" }}
                description={infoAlerta.tipo}
                descriptionNumberOfLines={null!}
                left={(props) => <List.Icon {...props} icon="format-text" />}
              />
              <Divider />
              <List.Item
                title="Gravedad"
                titleStyle={{ fontWeight: "bold" }}
                description={infoAlerta.gravedad}
                descriptionNumberOfLines={null!}
                left={(props) => (
                  <List.Icon {...props} icon="head-alert-outline" />
                )}
              />
              <Divider />
              <List.Item
                title="Evento"
                titleStyle={{ fontWeight: "bold" }}
                description={infoAlerta.evento}
                descriptionNumberOfLines={null!}
                left={(props) => (
                  <List.Icon {...props} icon="alert-circle-outline" />
                )}
              />
              <Divider />
              <List.Item
                title="Fecha efectiva"
                titleStyle={{ fontWeight: "bold" }}
                description={
                  infoAlerta.fechaEfectiva
                    .replace("T", " ")
                    .replace("+", " (+") + ")"
                }
                descriptionNumberOfLines={null!}
                left={(props) => <List.Icon {...props} icon="calendar-start" />}
              />
              <Divider />
              <List.Item
                title="Fecha de expiración"
                titleStyle={{ fontWeight: "bold" }}
                description={
                  infoAlerta.fechaExpiracion
                    .replace("T", " ")
                    .replace("+", " (+") + ")"
                }
                descriptionNumberOfLines={null!}
                left={(props) => <List.Icon {...props} icon="calendar-end" />}
              />
              <Divider />
              <List.Item
                title="Descripción"
                titleStyle={{ fontWeight: "bold" }}
                description={infoAlerta.descripcion}
                descriptionNumberOfLines={null!}
                left={(props) => <List.Icon {...props} icon="text" />}
              />
              <Divider />
              <List.Item
                title="Instrucciones"
                titleStyle={{ fontWeight: "bold" }}
                description={infoAlerta.instruccion}
                descriptionNumberOfLines={null!}
                left={(props) => <List.Icon {...props} icon="text-long" />}
              />
            </Card.Content>
          </Card>
        </ScrollView>
      </Modal>
    </Portal>
  );
}
