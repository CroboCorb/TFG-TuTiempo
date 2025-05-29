import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";

import { Stack } from "expo-router";
import * as NavigationBar from "expo-navigation-bar";
import { useMaterial3Theme } from "@pchmn/expo-material3-theme";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { theme } = useMaterial3Theme();

  const paperTheme =
    colorScheme === "dark"
      ? { ...MD3DarkTheme, colors: theme.dark }
      : { ...MD3LightTheme, colors: theme.light };

  useEffect(() => {;
    NavigationBar.setBackgroundColorAsync(theme[colorScheme!].background);
    NavigationBar.setBorderColorAsync(theme[colorScheme!].background)
    colorScheme === "light"
      ? NavigationBar.setButtonStyleAsync("dark")
      : NavigationBar.setButtonStyleAsync("light");
  }, [colorScheme]);

  return (
    <PaperProvider theme={paperTheme}>
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}
