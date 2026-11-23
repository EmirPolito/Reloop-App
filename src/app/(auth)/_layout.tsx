import { Stack } from "expo-router";

import { AuthFormProvider } from "@/features/auth/AuthFormProvider";
import { useAuth } from "@/features/auth/AuthProvider";
import { STACK_SCREEN_OPTIONS } from "@/features/navigation/opcionesPila";

export const unstable_settings = { initialRouteName: "login" };

/** Sin cuenta: acceso, registro y recuperación. Con cuenta sin verificar: solo la verificación. */
export default function AuthLayout() {
  const { status } = useAuth();

  return (
    <AuthFormProvider>
      <Stack screenOptions={STACK_SCREEN_OPTIONS}>
        <Stack.Protected
          guard={status === "unauthenticated"}
          redirectTo="/verify"
        >
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="recovery" />
        </Stack.Protected>
        {/* Al cerrar sesión desde la verificación ("¿Te equivocaste de correo?") se vuelve
            a Registrarse, para crear la cuenta con el correo correcto */}
        <Stack.Protected
          guard={status === "unverified"}
          redirectTo="/register"
        >
          <Stack.Screen name="verify" />
        </Stack.Protected>
      </Stack>
    </AuthFormProvider>
  );
}
