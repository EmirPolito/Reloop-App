import { Redirect, useLocalSearchParams } from "expo-router";

import { CreditosFundadores } from "@/features/legal/CreditosFundadores";
import { PantallaLegal } from "@/features/legal/PantallaLegal";
import {
  DOCUMENTOS_LEGALES,
  esDocumentoLegal,
} from "@/features/legal/textosLegales";

/**
 * `/legal/privacidad`, `/legal/terminos` y `/legal/acerca` (esta se lee como créditos y
 * cierra con los fundadores); cualquier otro valor vuelve al perfil
 */
export default function LegalRoute() {
  const { documento } = useLocalSearchParams<{ documento: string }>();
  if (!documento || !esDocumentoLegal(documento)) {
    return <Redirect href="/profile" />;
  }
  return (
    <PantallaLegal
      documento={DOCUMENTOS_LEGALES[documento]}
      creditos={documento === "acerca" ? <CreditosFundadores /> : undefined}
    />
  );
}
