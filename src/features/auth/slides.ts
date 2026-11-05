import type { AuthSlide } from "./components/AuthCarouselLayout";

export const LOGIN_SLIDES: AuthSlide[] = [
  {
    id: "slide-1",
    title: "Un buen artículo\nmerece otro",
    subtitle:
      "Descubre comida, artículos y productos recomendados por tu comunidad universitaria.",
    images: {
      left: require("@/assets/icons/izq1.png"),
      center: require("@/assets/icons/abajo1.png"),
      right: require("@/assets/icons/der1.png"),
    },
  },
  {
    id: "slide-2",
    title: "Compra y vende\nde forma segura",
    subtitle:
      "Encuentra libros, tecnología y accesorios con entrega directa dentro de tu campus.",
    images: {
      left: require("@/assets/icons/izq2.png"),
      center: require("@/assets/icons/abajo2.png"),
      right: require("@/assets/icons/der2.png"),
    },
  },
  {
    id: "slide-3",
    title: "Comunidad activa\ny sostenible",
    subtitle:
      "Conéctate con estudiantes, dale una segunda vida a tus cosas y apoya la economía circular.",
    images: {
      left: require("@/assets/icons/izq3.png"),
      center: require("@/assets/icons/abajo3.png"),
      right: require("@/assets/icons/der3.png"),
    },
  },
];

export const REGISTER_SLIDES: AuthSlide[] = [
  {
    id: "slide-1",
    title: "Compra y vende\nen tu campus",
    subtitle:
      "Comida, snacks, libros y más. Ahorra y apoya la economía de tu comunidad.",
    images: {
      left: require("@/assets/images/registro/compra1.png"),
      center: require("@/assets/images/registro/compra2.png"),
      right: require("@/assets/images/registro/compra3.png"),
    },
  },
  {
    id: "slide-2",
    title: "Intercambia sin tener\nque gastar dinero",
    subtitle:
      "Truequea libros, apuntes o herramientas por lo que necesites este cuatri.",
    images: {
      left: require("@/assets/images/registro/intercambio1.png"),
      center: require("@/assets/images/registro/intercambio2.png"),
      right: require("@/assets/images/registro/intercambio3.png"),
    },
  },
  {
    id: "slide-3",
    title: "Comparte y apoya\ncon donaciones",
    subtitle: "Dona material escolar, ropa o equipo a quien más lo necesite.",
    images: {
      left: require("@/assets/images/registro/donacion1.png"),
      center: require("@/assets/images/registro/donacion2.png"),
      right: require("@/assets/images/registro/donacion3.png"),
    },
  },
  {
    id: "slide-4",
    title: "Encuéntrale un hogar\na una mascota",
    subtitle:
      "Conecta con personas que dan en adopción a animalitos que buscan un hogar.",
    images: {
      left: require("@/assets/images/registro/mascota1.png"),
      center: require("@/assets/images/registro/mascota2.png"),
      right: require("@/assets/images/registro/mascota3.png"),
    },
  },
];

/** Recuperar contraseña y verificar correo: una sola diapositiva fija, con las mismas ilustraciones del acceso. */
export const RECOVERY_SLIDES: AuthSlide[] = [
  {
    id: "recovery",
    title: "Recupera tu\ncontraseña",
    subtitle:
      "Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva.",
    images: {
      left: require("@/assets/icons/izq2.png"),
      center: require("@/assets/icons/abajo2.png"),
      right: require("@/assets/icons/der2.png"),
    },
  },
];

export function verifySlides(email: string | null): AuthSlide[] {
  return [
    {
      id: "verify",
      title: "Verifica tu\ncorreo",
      subtitle: `Enviamos un enlace a ${email ?? "tu correo"}. Ábrelo desde tu teléfono y vuelve aquí: entrarás automáticamente. Si no lo ves, revisa el spam.`,
      images: {
        left: require("@/assets/icons/izq3.png"),
        center: require("@/assets/icons/abajo3.png"),
        right: require("@/assets/icons/der3.png"),
      },
    },
  ];
}
