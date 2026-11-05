export type CategoryId = "venta" | "cambio" | "donacion" | "mascota" | "comida";

export type Product = {
  id: string;
  /** uid de quien publica */
  ownerId: string;
  name: string;
  description: string;
  category: CategoryId;
  price: number;
  /** URL de la foto (Cloudinary) */
  imageUri: string | null;
  /** Nombre visible del vendedor al momento de publicar o de renombrarse */
  seller: string;
  /** Promedio de calificaciones; solo en categorías que se pueden calificar */
  rating?: number;
  distance: string;
  /** Derivado: la publicación es de la persona con sesión iniciada */
  isMine: boolean;
  createdAt: number;
};

export type ProductComment = {
  id: string;
  authorId: string;
  author: string;
  text: string;
  createdAt: number;
};

export type ChatMessage = {
  id: string;
  from: "me" | "them";
  text: string;
  time: number;
  images?: string[];
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
  updatedAt: number;
};
