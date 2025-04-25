import { useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";
import { useMaterial3Theme } from "@pchmn/expo-material3-theme";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { theme } = useMaterial3Theme();

  const paperTheme =
    colorScheme === "dark"
      ? { ...MD3DarkTheme, colors: theme.dark }
      : { ...MD3LightTheme, colors: theme.light };

  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar style="dark" />
      <Slot screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}
