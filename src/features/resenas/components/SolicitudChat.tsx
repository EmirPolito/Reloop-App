import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { PressableScale } from "@/components/PressableScale";
import { useAvisos } from "@/features/avisos/AvisosProvider";
import { AZUL_PEDIR, coloresPedido } from "@/features/pedidos/colores";
import { INTER } from "@/features/perfil/editar/editarTema";
import { useProfile } from "@/features/perfil/ProveedorPerfil";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text, TextInput } from "@/features/shared/Text";
import { showErrorAlert } from "@/utils/alerts";
import {
  LARGO_RESENA,
  faltanteResena,
  type SolicitudCalificacion,
} from "../formatoResena";
import { enviarResena, useEstadoResena } from "../repositorioResenas";
import { Estrellas } from "./Estrellas";

const ANCHO = 270;

/**
 * El mensaje con el que el vendedor pide una calificación, como lo ve quien compró: elige las
 * estrellas, escribe su reseña y la manda. Ya enviada, la solicitud se va del chat (la
 * conversación la oculta) y la reseña solo se ve en la publicación. El vendedor no ve este
 * mensaje.
 */
export function SolicitudChat({
  solicitud,
  hora,
}: {
  solicitud: SolicitudCalificacion;
  hora: string;
}) {
  const { isDark } = useAppTheme();
  const c = coloresPedido(isDark);
  const { uid } = useSessionUser();
  const { profile } = useProfile();
  const { mostrar } = useAvisos();
  const estado = useEstadoResena(solicitud.productoId, uid, {
    conSolicitud: false,
  });
  const [estrellas, setEstrellas] = useState(0);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const listo = !faltanteResena({ estrellas, texto }) && !enviando;

  async function enviar() {
    if (!listo) return;
    setEnviando(true);
    try {
      await enviarResena(
        solicitud.productoId,
        { id: uid, nombre: profile.name },
        { estrellas, texto },
      );
      mostrar({
        tipo: "exito",
        titulo: "¡Gracias por tu reseña!",
        descripcion: "Ya se ve en la publicación.",
      });
    } catch (error) {
      showErrorAlert("No se pudo mandar la reseña", error);
    }
    setEnviando(false);
  }

  // Ya calificó (o aún no se sabe): no hay nada que mostrar
  if (!estado || estado.resena) return null;

  return (
    <View
      style={[
        styles.tarjeta,
        { backgroundColor: c.tarjeta, borderColor: c.borde },
      ]}
    >
      <Text style={[INTER.semibold, styles.titulo, { color: c.texto }]}>
        ⭐ ¿Me ayudas con una calificación?
      </Text>
      <Text
        numberOfLines={1}
        style={[INTER.regular, styles.producto, { color: c.suave }]}
      >
        {solicitud.producto}
      </Text>

      <View style={styles.formulario}>
        <Estrellas
          valor={estrellas}
          onChange={setEstrellas}
          tamano="md"
          mostrarEtiqueta
          colorEtiqueta={c.suave}
        />
        <TextInput
          accessibilityLabel="Tu reseña"
          value={texto}
          onChangeText={setTexto}
          placeholder="Cuéntale a otros cómo te fue"
          placeholderTextColor={c.suave}
          multiline
          maxLength={LARGO_RESENA}
          textAlignVertical="top"
          style={[
            INTER.regular,
            styles.input,
            { color: c.texto, backgroundColor: c.neutro },
          ]}
        />
        <PressableScale
          accessibilityRole="button"
          accessibilityState={{ disabled: !listo }}
          disabled={!listo}
          onPress={() => void enviar()}
          scaleTo={0.97}
          style={[styles.boton, { opacity: listo ? 1 : 0.45 }]}
        >
          <Text style={[INTER.semibold, styles.botonTexto]}>
            {enviando ? "Enviando…" : "Enviar reseña"}
          </Text>
        </PressableScale>
      </View>

      <Text style={[INTER.regular, styles.hora, { color: c.suave }]}>
        {hora}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    width: ANCHO,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    marginVertical: 5,
    alignSelf: "flex-start",
  },
  titulo: { fontSize: 14.5 },
  producto: { fontSize: 12.5, marginTop: -4 },
  formulario: { gap: 8, marginLeft: -8 },
  input: {
    minHeight: 72,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 13.5,
    marginLeft: 8,
  },
  boton: {
    height: 42,
    borderRadius: 21,
    backgroundColor: AZUL_PEDIR,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  botonTexto: { color: "#FFFFFF", fontSize: 14 },
  hora: { fontSize: 11.5, alignSelf: "flex-end" },
});
