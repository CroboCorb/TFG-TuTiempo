import React, { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, useTheme } from "react-native-paper";

export default function PantallaCarga() {
  const theme = useTheme();

  const rotateAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const spinWithPause = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1250,
          easing: Easing.inOut(Easing.linear),
          useNativeDriver: true,
        }),
        Animated.delay(250),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    spinWithPause.start();
    return () => spinWithPause.stop();
  }, [rotateAnim]);

  const spinStyle = {
    transform: [
      {
        rotate: rotateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "360deg"],
        }),
      },
    ],
  };

  return (
    <View
      style={{
        backgroundColor: theme.colors.background,
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* <ActivityIndicator
        animating={true}
        color={theme.colors.primary}
        size={128}
      /> */}
      <Animated.View style={spinStyle}>
        <MaterialCommunityIcons
          name={"weather-sunny"}
          size={128}
          color={theme.colors.primary}
        />
      </Animated.View>
      <Text variant="titleLarge">{"\n"}Cargando...</Text>
    </View>
  );
}
