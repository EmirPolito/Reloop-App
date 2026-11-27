import type { Pedido } from "@/features/pedidos/formatoPedido";
import type { SolicitudCalificacion } from "@/features/resenas/formatoResena";
import type { TarjetaCompartida } from "@/features/tarjetas/formatoTarjeta";

export type CategoryId = "venta" | "cambio" | "donacion" | "mascota" | "comida";

export type Product = {
  id: string;
  /** uid de quien publica */
  ownerId: string;
  name: string;
  description: string;
  category: CategoryId;
  price: number;
  /** URL de la foto principal (Cloudinary): la primera de `images` */
  imageUri: string | null;
  /** Todas las fotos (hasta 5); la primera es la grande */
  images: string[];
  /** Venta y comida: los productos que se pueden pedir (sabores, tamaños...) */
  options: ProductOption[];
  /** Nombre visible del vendedor al momento de publicar o de renombrarse */
  seller: string;
  /** Promedio de las reseñas; solo en venta y comida y cuando ya tiene alguna */
  rating?: number;
  /** Cuántas reseñas tiene */
  reviewCount: number;
  /** Número de unidades disponibles */
  availableQuantity: number;
  distance: string;
  /** Dónde se entrega, si quien publica la puso (p. ej. "Edificio B") */
  ubicacion?: string;
  /** Universidad de la publicación (ver `universidades.ts`); sin ella es la propia */
  universidad?: string;
  /** Derivado: la publicación es de la persona con sesión iniciada */
  isMine: boolean;
  createdAt: number;
};

/** Un producto dentro de una publicación de venta o comida */
export type ProductOption = {
  id: string;
  name: string;
  /** Una descripción corta, debajo del nombre (opcional) */
  description: string;
  price: number;
  imageUri: string | null;
  /** Cuántos tiene el vendedor de este producto (las publicaciones de antes no lo traen) */
  available?: number;
};

export type ChatMessage = {
  id: string;
  from: "me" | "them";
  text: string;
  time: number;
  images?: string[];
  /** Tarjeta para recibir una transferencia (institución, clave y beneficiario) */
  tarjeta?: TarjetaCompartida;
  /** Pedido de una publicación de venta o comida */
  pedido?: Pedido;
  /** El vendedor pide una calificación */
  calificacion?: SolicitudCalificacion;
};

/** Resumen del último mensaje, para la lista de chats. */
export type ChatPreview = {
  text: string;
  from: "me" | "them";
  time: number;
  hasImages: boolean;
};

export type Chat = {
  id: string;
  /** uid de la otra persona */
  otherId: string;
  name: string;
  /** Publicación de la que se habla */
  productId?: string;
  lastMessage: ChatPreview | null;
  /** El último mensaje es de la otra persona y aún no se ha leído */
  unread: boolean;
  /** Cuándo leyó esta persona el chat por última vez (ms; 0 si nunca) */
  readAt: number;
  /** Cuándo lo leyó la otra persona (ms; 0 si nunca): dice si vio mi último mensaje */
  otherReadAt: number;
  updatedAt: number;
  /** Cuándo borró esta persona el chat (ms; 0 si nunca): oculta lo anterior a esa fecha */
  deletedAt: number;
  /** Borrado por esta persona y sin mensajes nuevos desde entonces: no se lista */
  hidden: boolean;
};
