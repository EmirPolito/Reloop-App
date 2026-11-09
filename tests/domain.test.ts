// Pruebas de la lógica pura de la app (sin Firebase ni React Native): filtros, reglas de categorías,
// borrador de publicación, filas del inicio, búsqueda de chats y mapeo de documentos de Firestore.
// Se ejecutan con: npm run test:domain
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { DocumentData, DocumentSnapshot } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";

import { chatIdFor, introMessageFor, mapChat, mapMessage } from "@/features/chats/chatMappers";
import { filterChats } from "@/features/chats/chatSelectors";
import { buildNewProduct, validateDraft, EMPTY_DRAFT } from "@/features/crear-publicacion/draftRules";
import { buildHomeFeedRows, homeRowKey } from "@/features/home/feedRows";
import { filterProducts, filtersReducer, NO_FILTERS } from "@/features/marketplace/feedFilters";
import { mapComment, mapProduct } from "@/features/marketplace/productMappers";
import {
  allowsProductRating,
  averageRatingLabel,
  categoryPriceMode,
  formatProductPrice,
  productBadgeLabel,
} from "@/features/marketplace/rules";
import type { Chat, Product } from "@/features/marketplace/types";
import {
  defaultProfile,
  isCurrentProfileDocument,
  mapProfile,
  toProfileDocument,
} from "@/features/perfil/profileMappers";
import {
  estiloBotonTema,
  gradienteAppBackground,
  gradienteHeader,
  gradienteSuaveModulos,
  TEMAS,
} from "@/features/perfil/Perfiltemas";
import { isRemoteImage, optimizedImageUrl } from "@/lib/imageUrl";
import { parsePrice } from "@/utils/price";
import { getInitials } from "@/utils/text";
import { isValidEmail, validateCredentials } from "@/utils/validation";

function snap(id: string, data: DocumentData | undefined) {
  return { id, data: () => data } as unknown as DocumentSnapshot<DocumentData>;
}
const ts = (millis: number) => Timestamp.fromMillis(millis);

function product(over: Partial<Product> = {}): Product {
  return {
    id: "p1", ownerId: "u1", name: "Calculadora", description: "Casi nueva", category: "venta",
    price: 280, imageUri: null, seller: "Ana", rating: 4.5, distance: "0.0 km", isMine: false,
    createdAt: 1, ...over,
  };
}

describe("filtros del inicio", () => {
  it("escribir cambia la búsqueda y no toca la categoría", () => {
    const next = filtersReducer({ query: "", category: "venta" }, { type: "queryChanged", query: "cal" });
    assert.deepEqual(next, { query: "cal", category: "venta" });
  });
  it("tocar la misma categoría la quita; otra la cambia", () => {
    const on = filtersReducer(NO_FILTERS, { type: "categoryToggled", category: "comida" });
    assert.equal(on.category, "comida");
    assert.equal(filtersReducer(on, { type: "categoryToggled", category: "comida" }).category, null);
    assert.equal(filtersReducer(on, { type: "categoryToggled", category: "venta" }).category, "venta");
  });
  it("limpiar sin nada activo devuelve el mismo objeto (no re-renderiza)", () => {
    assert.equal(filtersReducer(NO_FILTERS, { type: "filtersCleared" }), NO_FILTERS);
    const same = { query: "", category: null } as const;
    assert.equal(filtersReducer(same, { type: "categoryCleared" }), same);
  });
  it("limpiar con búsqueda y categoría vuelve a NO_FILTERS", () => {
    assert.equal(filtersReducer({ query: "x", category: "venta" }, { type: "filtersCleared" }), NO_FILTERS);
  });
  it("filtra por categoría y por texto (nombre, descripción o vendedor, sin importar mayúsculas)", () => {
    const list = [
      product({ id: "a", name: "Calculadora", seller: "Ana" }),
      product({ id: "b", name: "Bata", description: "Para laboratorio", seller: "Beto", category: "cambio" }),
      product({ id: "c", name: "Galletas", seller: "Carla", category: "comida" }),
    ];
    assert.deepEqual(filterProducts(list, { query: "  LABORA ", category: null }).map((p) => p.id), ["b"]);
    assert.deepEqual(filterProducts(list, { query: "carla", category: null }).map((p) => p.id), ["c"]);
    assert.deepEqual(filterProducts(list, { query: "", category: "venta" }).map((p) => p.id), ["a"]);
    assert.deepEqual(filterProducts(list, { query: "bata", category: "venta" }), []);
    assert.equal(filterProducts(list, NO_FILTERS).length, 3);
  });
});

describe("reglas por categoría", () => {
  it("solo ventas y comidas se califican", () => {
    assert.deepEqual(
      (["venta", "cambio", "donacion", "mascota", "comida"] as const).map(allowsProductRating),
      [true, false, false, false, true],
    );
  });
  it("modo de precio por categoría", () => {
    assert.equal(categoryPriceMode("venta"), "required");
    assert.equal(categoryPriceMode("cambio"), "optional");
    assert.equal(categoryPriceMode("donacion"), "none");
  });
  it("etiquetas de precio", () => {
    assert.equal(formatProductPrice(product({ price: 120 })), "$120");
    assert.equal(formatProductPrice(product({ category: "donacion", price: 0 })), "Donación");
    assert.equal(formatProductPrice(product({ category: "cambio", price: 0 })), null);
    assert.equal(productBadgeLabel(product({ category: "cambio", price: 0 })), "Intercambios");
  });
  it("promedio de reputación: solo cuenta lo calificable; sin datos, raya", () => {
    assert.equal(averageRatingLabel([]), "—");
    assert.equal(averageRatingLabel([product({ category: "donacion", rating: undefined })]), "—");
    assert.equal(averageRatingLabel([product({ rating: 5 }), product({ rating: 4 })]), "4.5");
    assert.equal(averageRatingLabel([product({ rating: 5 }), product({ category: "cambio", rating: undefined })]), "5.0");
  });
});

describe("borrador de publicación", () => {
  it("exige nombre", () => {
    const r = validateDraft({ ...EMPTY_DRAFT, name: "   " });
    assert.equal(r.valid, false);
  });
  it("una venta exige precio válido (coma o punto) y no negativo", () => {
    assert.equal(validateDraft({ ...EMPTY_DRAFT, name: "X", priceText: "" }).valid, false);
    assert.equal(validateDraft({ ...EMPTY_DRAFT, name: "X", priceText: "-3" }).valid, false);
    assert.equal(validateDraft({ ...EMPTY_DRAFT, name: "X", priceText: "abc" }).valid, false);
    assert.deepEqual(validateDraft({ ...EMPTY_DRAFT, name: "X", priceText: "12,5" }), { valid: true, price: 12.5 });
  });
  it("un intercambio acepta precio vacío; si se escribe debe ser válido", () => {
    assert.deepEqual(validateDraft({ ...EMPTY_DRAFT, name: "X", category: "cambio" }), { valid: true, price: 0 });
    assert.equal(validateDraft({ ...EMPTY_DRAFT, name: "X", category: "cambio", priceText: "x" }).valid, false);
  });
  it("una donación ignora el precio escrito", () => {
    assert.deepEqual(validateDraft({ ...EMPTY_DRAFT, name: "X", category: "donacion", priceText: "99" }), { valid: true, price: 0 });
  });
  it("arma los datos a guardar con texto limpio y descripción por defecto", () => {
    const data = buildNewProduct(
      { ...EMPTY_DRAFT, name: "  Lámpara ", description: "  ", photo: "file:///x.jpg" },
      { ownerId: "u1", seller: "Ana", price: 150, imageUrl: "https://res.cloudinary.com/x/image/upload/v1/a.png" },
    );
    assert.deepEqual(data, {
      ownerId: "u1", seller: "Ana", name: "Lámpara", description: "Sin descripción", category: "venta", price: 150,
      imageUrl: "https://res.cloudinary.com/x/image/upload/v1/a.png",
    });
  });
});

describe("filas del inicio", () => {
  const two = [product({ id: "a" }), product({ id: "b" }), product({ id: "c" })];
  it("cargando: categorías, banner y espera", () => {
    assert.deepEqual(buildHomeFeedRows([], "loading").map((r) => r.type), ["categories", "banner", "loading"]);
  });
  it("sin publicaciones: vacío; con error: error", () => {
    assert.deepEqual(buildHomeFeedRows([], "ready").map((r) => r.type), ["categories", "banner", "empty"]);
    assert.deepEqual(buildHomeFeedRows([], "error").map((r) => r.type), ["categories", "banner", "error"]);
  });
  it("con publicaciones: de dos en dos, aunque haya habido un error después", () => {
    const rows = buildHomeFeedRows(two, "error");
    assert.deepEqual(rows.map((r) => r.type), ["categories", "banner", "products", "products"]);
    assert.deepEqual(homeRowKey(rows[2], 2), "products-a");
    assert.equal(homeRowKey(rows[0], 0), "categories");
  });
});

describe("búsqueda de chats", () => {
  const chat = (over: Partial<Chat>): Chat => ({
    id: "c", otherId: "o", name: "Beto", lastMessage: null, unread: false, updatedAt: 0, ...over,
  });
  const chats = [
    chat({ id: "1", name: "Beto", productId: "p1" }),
    chat({ id: "2", name: "Carla", lastMessage: { text: "nos vemos mañana", from: "them", time: 1, hasImages: false } }),
  ];
  it("sin texto devuelve todos en el mismo orden", () => {
    assert.deepEqual(filterChats(chats, [], "  ").map((c) => c.id), ["1", "2"]);
  });
  it("busca por contacto, producto o último mensaje", () => {
    const products = [product({ id: "p1", name: "Calculadora" })];
    assert.deepEqual(filterChats(chats, products, "carla").map((c) => c.id), ["2"]);
    assert.deepEqual(filterChats(chats, products, "calcu").map((c) => c.id), ["1"]);
    assert.deepEqual(filterChats(chats, products, "MAÑANA").map((c) => c.id), ["2"]);
    assert.deepEqual(filterChats(chats, products, "zzz"), []);
  });
});

describe("mapeo de publicaciones", () => {
  it("promedio = total / votos; isMine según el uid; fecha del servidor", () => {
    const p = mapProduct(snap("p1", {
      ownerId: "u1", name: "Calc", category: "venta", price: 280, imageUrl: "https://x/y.png", seller: "Ana",
      description: "d", distance: "0.0 km", ratingTotal: 9, ratingCount: 2, creadoEn: ts(5000),
    }), "u1");
    assert.equal(p?.rating, 4.5);
    assert.equal(p?.isMine, true);
    assert.equal(p?.createdAt, 5000);
    assert.equal(p?.imageUri, "https://x/y.png");
    assert.equal(mapProduct(snap("p1", { ownerId: "u1", name: "x", category: "venta", ratingTotal: 5, ratingCount: 1 }), "otro")?.isMine, false);
  });
  it("categorías sin calificación no traen promedio aunque haya datos", () => {
    const p = mapProduct(snap("p2", { ownerId: "u1", name: "Libreta", category: "donacion", ratingTotal: 0, ratingCount: 0 }), "u9");
    assert.equal(p?.rating, undefined);
    assert.equal("rating" in (p ?? {}), false);
  });
  it("documentos mal formados se descartan", () => {
    assert.equal(mapProduct(snap("x", undefined), "u"), null);
    assert.equal(mapProduct(snap("x", { name: "a", category: "armas" }), "u"), null);
    assert.equal(mapProduct(snap("x", { category: "venta" }), "u"), null);
  });
  it("un servidor aún sin hora (escritura pendiente) no rompe la fecha", () => {
    assert.equal(mapProduct(snap("x", { name: "a", category: "venta", creadoEn: null }), "u")?.createdAt, 0);
  });
  it("comentarios con valores por defecto", () => {
    assert.deepEqual(mapComment(snap("c1", { authorId: "u2", author: "Beto", text: "Hola", creadoEn: ts(7) })),
      { id: "c1", authorId: "u2", author: "Beto", text: "Hola", createdAt: 7 });
    assert.deepEqual(mapComment(snap("c2", {})), { id: "c2", authorId: "", author: "Usuario", text: "", createdAt: 0 });
  });
});

describe("mapeo de chats", () => {
  it("el id de un chat es el mismo para las dos personas", () => {
    assert.equal(chatIdFor("b", "a"), chatIdFor("a", "b"));
    assert.equal(chatIdFor("b", "a"), "a_b");
  });
  it("mensaje de interés", () => {
    assert.equal(introMessageFor({ name: "Lámpara" }), 'Hola, me interesa "Lámpara".');
  });
  const base = {
    participants: ["a", "b"], names: { a: "Ana", b: "Beto" }, productId: "p1", actualizadoEn: ts(900),
  };
  it("ve a la otra persona, su nombre y el último mensaje propio o ajeno", () => {
    const mine = mapChat(snap("a_b", { ...base, lastMessage: { text: "hola", from: "a", hasImages: false, time: ts(100) }, reads: { a: ts(100) } }), "a");
    assert.equal(mine?.otherId, "b");
    assert.equal(mine?.name, "Beto");
    assert.equal(mine?.lastMessage?.from, "me");
    assert.equal(mine?.unread, false);
    assert.equal(mine?.productId, "p1");
    assert.equal(mine?.updatedAt, 900);
    assert.equal(mapChat(snap("a_b", base), "b")?.name, "Ana");
  });
  it("sin leer: último mensaje del otro posterior a la lectura", () => {
    const theirs = { text: "¿y?", from: "b", hasImages: true, time: ts(500) };
    assert.equal(mapChat(snap("a_b", { ...base, lastMessage: theirs, reads: { a: ts(400) } }), "a")?.unread, true);
    assert.equal(mapChat(snap("a_b", { ...base, lastMessage: theirs, reads: { a: ts(500) } }), "a")?.unread, false);
    assert.equal(mapChat(snap("a_b", { ...base, lastMessage: theirs }), "a")?.unread, true);
    assert.equal(mapChat(snap("a_b", { ...base, lastMessage: theirs }), "a")?.lastMessage?.hasImages, true);
  });
  it("sin mensajes no hay nada sin leer; sin producto no hay productId", () => {
    const empty = mapChat(snap("a_b", { participants: ["a", "b"], names: {}, lastMessage: null, productId: null }), "a");
    assert.equal(empty?.lastMessage, null);
    assert.equal(empty?.unread, false);
    assert.equal(empty?.name, "Usuario");
    assert.equal("productId" in (empty ?? {}), false);
  });
  it("documentos sin participantes se descartan", () => {
    assert.equal(mapChat(snap("x", { names: {} }), "a"), null);
    assert.equal(mapChat(snap("x", undefined), "a"), null);
  });
  it("mensajes: de quién, texto, hora y fotos", () => {
    assert.deepEqual(mapMessage(snap("m1", { from: "a", text: "hola", images: [], creadoEn: ts(3) }), "a"), { id: "m1", from: "me", text: "hola", time: 3 });
    const withImages = mapMessage(snap("m2", { from: "b", text: "", images: ["https://x/1.png", 5, "https://x/2.png"], creadoEn: ts(4) }), "a");
    assert.equal(withImages.from, "them");
    assert.deepEqual(withImages.images, ["https://x/1.png", "https://x/2.png"]);
  });
});

describe("mapeo de perfiles", () => {
  it("el perfil por defecto usa el nombre (máx. 30)", () => {
    assert.equal(defaultProfile("x".repeat(40)).name.length, 30);
    assert.deepEqual(defaultProfile("Ana"), { photo: null, name: "Ana", description: "", color: "azul", pills: [], stickers: [] });
  });
  it("valores seguros para campos que faltan o están mal", () => {
    const p = mapProfile({ nombre: "", color: "negro", etiquetas: [{ id: "1", text: "Mate", color: "rosa", icon: "work" }, { id: 2 }, "x"], stickers: ["sticker-1", 3] }, "Respaldo");
    assert.equal(p.name, "Respaldo");
    assert.equal(p.color, "azul");
    assert.deepEqual(p.pills, [{ id: "1", text: "Mate", color: "rosa", icon: "work" }]);
    assert.deepEqual(p.stickers, ["sticker-1"]);
    assert.equal(p.photo, null);
  });
  it("al guardar no se escribe `icon: undefined` (Firestore lo rechaza)", () => {
    const doc = toProfileDocument({ ...defaultProfile("Ana"), pills: [{ id: "1", text: "Mate", color: "azul", icon: undefined }] });
    assert.deepEqual(doc.etiquetas, [{ id: "1", text: "Mate", color: "azul" }]);
    assert.equal("icon" in doc.etiquetas[0], false);
  });
  it("detecta fichas antiguas (con correo o incompletas)", () => {
    const current = { ...toProfileDocument(defaultProfile("Ana")), uid: "a" };
    assert.equal(isCurrentProfileDocument(current), true);
    assert.equal(isCurrentProfileDocument({ ...current, correo: "a@b.c" }), false);
    assert.equal(isCurrentProfileDocument({ uid: "a", nombre: "Ana", correo: "a@b.c" }), false);
  });
  it("gradiente de cabecera usa el color específico de cada perfil y termina transparente", () => {
    const cabeceraVerde = gradienteHeader("verde", false);
    assert.equal(cabeceraVerde[0], TEMAS.verde.gradientLight[0]);
    assert.match(cabeceraVerde[3], /00$/);

    const cabeceraNaranja = gradienteHeader("naranja", false);
    assert.equal(cabeceraNaranja[0], TEMAS.naranja.gradientLight[0]);
  });
  it("gradiente de fondo de la app usa el color de perfil arriba y blanco abajo", () => {
    const fondoNaranja = gradienteAppBackground("naranja", false);
    assert.deepEqual(fondoNaranja, [
      TEMAS.naranja.gradientLight[0],
      TEMAS.naranja.gradientLight[1],
      TEMAS.naranja.gradientLight[2],
      "#f8f8f8ff",
    ]);

    const fondoAzulDark = gradienteAppBackground("azul", true);
    assert.deepEqual(fondoAzulDark, [
      TEMAS.azul.gradientDark[0],
      TEMAS.azul.gradientDark[1],
      TEMAS.azul.gradientDark[2],
      "#0F172A",
    ]);

    const suaveRosa = gradienteSuaveModulos("rosa", false);
    assert.equal(suaveRosa.length, 4);
    assert.equal(suaveRosa[3], "#f8f8f8ff");

    const botonRosa = estiloBotonTema("rosa");
    assert.equal(botonRosa.shadowColor, "#DB2777");
    assert.equal(botonRosa.colors.length, 3);
  });
});

describe("imágenes", () => {
  const url = "https://res.cloudinary.com/demo/image/upload/v1/foto.png";
  it("pide ancho redondeado hacia arriba con formato y calidad automáticos", () => {
    assert.equal(optimizedImageUrl(url, 366), "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_400/v1/foto.png");
    assert.match(optimizedImageUrl(url, 20) ?? "", /w_100\//);
  });
  it("deja igual lo que no es de Cloudinary", () => {
    assert.equal(optimizedImageUrl("file:///tmp/a.jpg", 400), "file:///tmp/a.jpg");
    assert.equal(optimizedImageUrl(null, 400), null);
  });
  it("distingue fotos ya subidas de locales", () => {
    assert.equal(isRemoteImage(url), true);
    assert.equal(isRemoteImage("file:///a.jpg"), false);
    assert.equal(isRemoteImage("blob:http://localhost/abc"), false);
  });
});

describe("utilidades", () => {
  it("precio con coma o punto", () => {
    assert.equal(parsePrice("12,5"), 12.5);
    assert.equal(parsePrice(" 7 "), 7);
    assert.equal(parsePrice(""), null);
    assert.equal(parsePrice("-1"), null);
    assert.equal(parsePrice("x"), null);
  });
  it("iniciales", () => {
    assert.equal(getInitials("ana pérez gómez"), "AP");
    assert.equal(getInitials("  "), "");
  });
  it("credenciales", () => {
    assert.equal(isValidEmail("a@b.co"), true);
    assert.equal(isValidEmail("a@b"), false);
    assert.match(validateCredentials("a@b.co", "123") ?? "", /al menos 6/);
    assert.equal(validateCredentials("a@b.co", "123456"), null);
  });
});
