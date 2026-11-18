import { Redirect, useLocalSearchParams } from "expo-router";

import { PantallaLegal } from "@/features/legal/PantallaLegal";
import {
  DOCUMENTOS_LEGALES,
  esDocumentoLegal,
} from "@/features/legal/textosLegales";

/** `/legal/privacidad` y `/legal/terminos`; cualquier otro valor vuelve al perfil */
export default function LegalRoute() {
  const { documento } = useLocalSearchParams<{ documento: string }>();
  if (!documento || !esDocumentoLegal(documento)) {
    return <Redirect href="/profile" />;
  }
  return <PantallaLegal documento={DOCUMENTOS_LEGALES[documento]} />;
}
