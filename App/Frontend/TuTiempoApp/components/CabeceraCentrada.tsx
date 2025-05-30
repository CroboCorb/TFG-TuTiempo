import { Appbar, Text } from "react-native-paper";

/** Elemento para cabecera centrada
 * @param title - Texto
 * @param style - Estilo de texto
 * @param variant - Variante de texto */
const CabeceraCentrada = ({ title, style, variant }: any) => (
  <Appbar.Content
    title={
      <Text style={style} variant={variant}>
        {title}
      </Text>
    }
    style={{ alignItems: "center" }}
  />
);

export default CabeceraCentrada;
