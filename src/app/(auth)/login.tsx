import { useRouter } from "expo-router";

import { useAuthForm } from "@/features/auth/AuthFormProvider";
import { IniciarSesionPage } from "@/features/auth/screens/IniciarSesion";

export default function LoginRoute() {
  const router = useRouter();
  const form = useAuthForm();

  return (
    <IniciarSesionPage
      {...form}
      onNavigateRegister={() => router.replace("/register")}
      onNavigateRecovery={() => router.replace("/recovery")}
    />
  );
}
