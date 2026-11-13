/** Un apartado de un documento legal: título corto y párrafos. */
export interface SeccionLegal {
  titulo: string;
  parrafos: string[];
}

export interface DocumentoLegal {
  titulo: string;
  actualizado: string;
  secciones: SeccionLegal[];
}

/*
 * Borrador redactado para describir cómo funciona la app hoy. Antes de publicarla debe
 * revisarlo alguien con conocimientos legales y completarse con los datos de contacto reales.
 */

export const POLITICA_PRIVACIDAD: DocumentoLegal = {
  titulo: "Política de privacidad",
  actualizado: "Última actualización: noviembre de 2026",
  secciones: [
    {
      titulo: "Qué datos guardamos",
      parrafos: [
        "Tu correo y contraseña se gestionan con Firebase Authentication; nunca vemos tu contraseña.",
        "Tu perfil público: nombre, foto o avatar, fondo, descripción y etiquetas.",
        "Lo que publicas y escribes: publicaciones, comentarios, mensajes, favoritos, calificaciones, a quién sigues y los reportes que envías.",
      ],
    },
    {
      titulo: "Quién puede verlos",
      parrafos: [
        "Tu perfil, tus publicaciones y tus comentarios los ve cualquier persona con una cuenta verificada en ReLoop.",
        "Tus mensajes solo los ven las dos personas del chat. Tus favoritos, calificaciones, reportes y notificaciones solo los ves tú.",
        "Tu correo no aparece en tu perfil ni lo ven otras personas.",
      ],
    },
    {
      titulo: "Dónde se guardan",
      parrafos: [
        "Los datos se guardan en Cloud Firestore (Google Firebase) y las fotos en Cloudinary. Ambos servicios pueden almacenarlos fuera de tu país.",
      ],
    },
    {
      titulo: "Para qué los usamos",
      parrafos: [
        "Solo para que la app funcione: mostrar publicaciones, conectar a compradores y vendedores, enviarte notificaciones dentro de la app y revisar reportes. No vendemos tus datos ni los usamos para publicidad.",
      ],
    },
    {
      titulo: "Tus derechos",
      parrafos: [
        "Puedes editar tu perfil cuando quieras desde Editar perfil. Para pedir una copia de tus datos o que eliminemos tu cuenta, escríbenos al equipo de ReLoop.",
      ],
    },
  ],
};

export const TERMINOS_CONDICIONES: DocumentoLegal = {
  titulo: "Términos y condiciones",
  actualizado: "Última actualización: noviembre de 2026",
  secciones: [
    {
      titulo: "Qué es ReLoop",
      parrafos: [
        "ReLoop es un espacio para que la comunidad universitaria venda, intercambie, done o adopte entre sí. ReLoop no vende nada ni participa en los acuerdos entre personas.",
      ],
    },
    {
      titulo: "Tu cuenta",
      parrafos: [
        "Necesitas un correo propio y verificado. Eres responsable de lo que se haga con tu cuenta, así que no compartas tu contraseña.",
      ],
    },
    {
      titulo: "Qué puedes publicar",
      parrafos: [
        "Publica solo cosas que sean tuyas y que se puedan intercambiar legalmente, con fotos y descripciones reales.",
        "No se permiten artículos ilegales, peligrosos o robados, contenido ofensivo, engaños ni acoso. Podemos retirar publicaciones o cuentas que no cumplan estas reglas.",
      ],
    },
    {
      titulo: "Acuerdos entre personas",
      parrafos: [
        "El precio, la entrega y el pago los acuerdan directamente quienes participan. Reúnete en lugares públicos del campus y revisa el artículo antes de pagar.",
        "ReLoop no garantiza la calidad de los artículos ni responde por los acuerdos entre usuarios.",
      ],
    },
    {
      titulo: "Reportes",
      parrafos: [
        "Si ves algo que no cumple estas reglas, repórtalo desde la publicación. Revisamos cada reporte.",
      ],
    },
    {
      titulo: "Cambios",
      parrafos: [
        "Podemos actualizar estos términos. Si el cambio es importante, te avisaremos en la app.",
      ],
    },
  ],
};
