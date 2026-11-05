import { useRouter } from "expo-router";

import { useAuthForm } from "@/features/auth/AuthFormProvider";
import { RecuperacionPage } from "@/features/auth/screens/RecuperarContrasena";

export default function RecoveryRoute() {
  const router = useRouter();
  const { email, onChangeEmail } = useAuthForm();

  return (
    <RecuperacionPage
      email={email}
      onChangeEmail={onChangeEmail}
      onNavigateLogin={() => router.replace("/login")}
    />
  );
}
