import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PaperProvider, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { Stack } from "expo-router/stack";

export default function RootLayout() {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: "center",
        backgroundColor: theme.colors.background,
      }}
    >
      <PaperProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <StatusBar style="light"/>
          <Stack.Screen name="index" options={{}} />
          <Stack.Screen name="options" options={{}} />
          <Stack.Screen name="addCity" options={{}} />
        </Stack>
      </PaperProvider>
    </SafeAreaView>
  );
}
