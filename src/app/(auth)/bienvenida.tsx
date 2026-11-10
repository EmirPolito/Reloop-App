import { useRouter } from "expo-router";

// Ajusta esta ruta a donde pongas los 3 archivos de la bienvenida
import { PantallaBienvenida } from "@/features/intro/pantallaBienvenida";

/** Ruta: app/(auth)/bienvenida.tsx */
export default function BienvenidaRoute() {
  const router = useRouter();

  return (
    <PantallaBienvenida
      onComenzar={() => router.push("/login")}
      onRegistrarse={() => router.push("/login")}
    />
  );
}
