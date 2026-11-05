import { useState, type ReactNode } from "react";
import { Pressable, View, type TextInputProps } from "react-native";

import { Text, TextInput } from "@/features/shared/Text";
import { LockIcon, MailIcon } from "./AuthIcons";
import { authStyles } from "./authStyles";

const PLACEHOLDER_COLOR = "#9CA3AF";
const TOGGLE_HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

/** Campo de texto con el estilo de las pantallas de acceso y un icono opcional a la izquierda. */
export function AuthTextField({
  icon,
  ...inputProps
}: TextInputProps & { icon?: ReactNode }) {
  return (
    <View style={authStyles.inputWrapper}>
      {icon}
      <TextInput
        placeholderTextColor={PLACEHOLDER_COLOR}
        style={authStyles.textInputField}
        {...inputProps}
      />
    </View>
  );
}

export function EmailField({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (text: string) => void;
}) {
  return (
    <AuthTextField
      icon={
        <MailIcon
          stroke={PLACEHOLDER_COLOR}
          strokeWidth={1.8}
          style={authStyles.inputFieldIcon}
        />
      }
      accessibilityLabel="Correo electrónico"
      value={value}
      onChangeText={onChangeText}
      placeholder="ejemplo@correo.com"
      keyboardType="email-address"
      autoCapitalize="none"
      autoComplete="email"
    />
  );
}

/** Campo de contraseña con botón para mostrarla u ocultarla. */
export function PasswordField({
  value,
  onChangeText,
  placeholder,
  autoComplete,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  autoComplete: "current-password" | "new-password";
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={authStyles.inputWrapper}>
      <LockIcon style={authStyles.inputFieldIcon} />
      <TextInput
        accessibilityLabel="Contraseña"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={PLACEHOLDER_COLOR}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoComplete={autoComplete}
        style={authStyles.textInputField}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        onPress={() => setVisible((current) => !current)}
        hitSlop={TOGGLE_HIT_SLOP}
        style={authStyles.togglePassword}
      >
        <Text style={authStyles.togglePasswordText}>
          {visible ? "Ocultar" : "Ver"}
        </Text>
      </Pressable>
    </View>
  );
}

/** Botón grande de las pantallas de acceso: negro para la acción principal, blanco con borde para la secundaria. */
export function AuthButton({
  label,
  onPress,
  disabled = false,
  variant = "primary",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}) {
  const primary = variant === "primary";
  return (
    <Pressable
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      style={({ pressed }) => [
        authStyles.primaryPillButton,
        primary ? authStyles.googleButton : authStyles.emailButton,
        pressed && !disabled && authStyles.buttonPressed,
        disabled && authStyles.buttonDisabled,
      ]}
    >
      <Text
        style={primary ? authStyles.googleButtonText : authStyles.emailButtonText}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Contenedor del formulario por correo: campos, error, botón de envío y, si hay `onBack`, regreso a las otras opciones. */
export function AuthEmailForm({
  children,
  error,
  submitLabel,
  onSubmit,
  loading,
  onBack,
}: {
  children: ReactNode;
  error: string;
  submitLabel: string;
  onSubmit: () => void;
  loading: boolean;
  onBack?: () => void;
}) {
  return (
    <View style={authStyles.emailFormContainer}>
      {children}

      {error ? <Text style={authStyles.authError}>{error}</Text> : null}

      <AuthButton label={submitLabel} onPress={onSubmit} disabled={loading} />

      {/* Volver a las 3 opciones */}
      {onBack ? (
        <Pressable
          onPress={onBack}
          style={authStyles.backToSocialRow}
          hitSlop={TOGGLE_HIT_SLOP}
        >
          <Text style={authStyles.backToSocialText}>
            ← Volver a otras opciones
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
