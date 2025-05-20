import { View } from "react-native";
import { ActivityIndicator, Text, useTheme } from "react-native-paper";

export default function PantallaCarga() {
  const theme = useTheme();

  return (
    <View
      style={{
        backgroundColor: theme.colors.background,
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator
        animating={true}
        color={theme.colors.primary}
        size={128}
      />
      <Text variant="titleLarge">{"\n"}Cargando...</Text>
    </View>
  );
}
