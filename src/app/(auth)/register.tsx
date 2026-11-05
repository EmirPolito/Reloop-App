import { useRouter } from "expo-router";

import { useAuthForm } from "@/features/auth/AuthFormProvider";
import { RegistrarsePage } from "@/features/auth/screens/Registrarse";

export default function RegisterRoute() {
  const router = useRouter();
  const form = useAuthForm();

  return (
    <RegistrarsePage
      {...form}
      onNavigateLogin={() => router.replace("/login")}
    />
  );
}
