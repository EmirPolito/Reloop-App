/** Un apartado de un documento legal: título corto y párrafos. */
export interface SeccionLegal {
  titulo: string;
  parrafos: string[];
  /** Lista corta debajo de los párrafos (una idea por renglón) */
  puntos?: string[];
}

export interface DocumentoLegal {
  titulo: string;
  /** Línea pequeña bajo el título (la fecha de actualización); opcional */
  actualizado?: string;
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
        "Tu perfil, tus publicaciones y tus comentarios los ve cualquier persona con una cuenta verificada en Reloop.",
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
        "Puedes editar tu perfil cuando quieras desde Editar perfil. Para pedir una copia de tus datos o que eliminemos tu cuenta, escríbenos al equipo de Reloop.",
      ],
    },
  ],
};

export const TERMINOS_CONDICIONES: DocumentoLegal = {
  titulo: "Términos y condiciones",
  actualizado: "Última actualización: noviembre de 2026",
  secciones: [
    {
      titulo: "Qué es Reloop",
      parrafos: [
        "Reloop es un espacio para que la comunidad universitaria venda, intercambie, done o adopte entre sí. Reloop no vende nada ni participa en los acuerdos entre personas.",
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
        "Reloop no garantiza la calidad de los artículos ni responde por los acuerdos entre usuarios.",
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

/** Qué es ReLoop, cómo nació y por qué: se lee como créditos y cierra con los fundadores */
export const ACERCA_DE_LA_APP: DocumentoLegal = {
  titulo: "Acerca de la app",
  secciones: [
    {
      titulo: "Nuestra historia",
      parrafos: [
        "Reloop nació en un entorno universitario, donde la compraventa entre estudiantes dependía de grupos de mensajería.",
        "Esos grupos eran difíciles de seguir: las publicaciones se perdían entre conversaciones, el spam era constante y, conforme la comunidad crecía, terminó dividida en varios grupos.",
      ],
    },
    {
      titulo: "Nuestro propósito",
      parrafos: [
        "Creamos Reloop para ofrecer un espacio ordenado y confiable donde comprar, vender y compartir dentro de una comunidad sea sencillo.",
      ],
    },
    {
      titulo: "Qué ofrece",
      parrafos: [
        "Las publicaciones se organizan por categorías, para que cada persona encuentre lo que busca sin esfuerzo.",
      ],
      puntos: [
        "Compra, venta e intercambio de artículos",
        "Donaciones y adopción de mascotas",
        "Comida casera",
      ],
    },
    {
      titulo: "Confianza",
      parrafos: [
        "ReLoop está pensada para comunidades universitarias. La comunicación se realiza por chat dentro de la app, para que cada acuerdo se haga con tranquilidad.",
        "Los pagos no se hacen a través de la app: se acuerdan entre las personas, en efectivo o por transferencia bancaria, y la entrega se hace en persona.",
      ],
    },
    {
      titulo: "Nuestra visión",
      parrafos: [
        "Ser el punto de encuentro de cada comunidad universitaria: un solo lugar, ordenado y cercano, para comprar, vender, intercambiar, donar, encontrar un hogar para una mascota o compartir comida casera.",
      ],
    },
  ],
};

/** Documentos que se pueden abrir en su propia pantalla (`/legal/[documento]`) */
export const DOCUMENTOS_LEGALES = {
  privacidad: POLITICA_PRIVACIDAD,
  terminos: TERMINOS_CONDICIONES,
  acerca: ACERCA_DE_LA_APP,
} as const satisfies Record<string, DocumentoLegal>;

export type DocumentoLegalId = keyof typeof DOCUMENTOS_LEGALES;

/** `true` si el texto es el id de un documento legal (para validar la ruta) */
export function esDocumentoLegal(id: string): id is DocumentoLegalId {
  return Object.hasOwn(DOCUMENTOS_LEGALES, id);
}
