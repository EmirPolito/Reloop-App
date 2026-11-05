import type { ReactNode } from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";

import { Text } from "@/features/shared/Text";
import { AppleIcon, GoogleIcon, MailIcon } from "./AuthIcons";
import { authStyles } from "./authStyles";

export type SocialProvider = "Google" | "Apple";

function PillButton({
  icon,
  label,
  onPress,
  buttonStyle,
  textStyle,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  buttonStyle: StyleProp<ViewStyle>;
  textStyle: object;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        authStyles.primaryPillButton,
        buttonStyle,
        pressed && authStyles.buttonPressed,
      ]}
    >
      <View style={authStyles.buttonIconLeft}>{icon}</View>
      <Text style={textStyle}>{label}</Text>
    </Pressable>
  );
}

/** Las tres vías de entrada: correo, Apple y Google (las dos últimas aún no están disponibles). */
export function AuthSocialButtons({
  onEmailPress,
  onProviderPress,
}: {
  onEmailPress: () => void;
  onProviderPress: (provider: SocialProvider) => void;
}) {
  return (
    <View style={authStyles.buttonsContainer}>
      <PillButton
        icon={<MailIcon stroke="#1F2937" strokeWidth={2} rounded />}
        label="Continuar con Email"
        onPress={onEmailPress}
        buttonStyle={authStyles.emailButton}
        textStyle={authStyles.emailButtonText}
      />
      <PillButton
        icon={<AppleIcon />}
        label="Continuar con Apple"
        onPress={() => onProviderPress("Apple")}
        buttonStyle={authStyles.appleButton}
        textStyle={authStyles.appleButtonText}
      />
      <PillButton
        icon={<GoogleIcon />}
        label="Continuar con Google"
        onPress={() => onProviderPress("Google")}
        buttonStyle={authStyles.googleButton}
        textStyle={authStyles.googleButtonText}
      />
    </View>
  );
}
