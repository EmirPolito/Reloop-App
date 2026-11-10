import { Image } from "expo-image";
import React from "react";
import { Text, View } from "react-native";

/* ---------- Marco del iPhone ---------- */

type PropsMarcoIphone = {
  width: number;
  children: React.ReactNode;
};

export function MarcoIphone({ width, children }: PropsMarcoIphone) {
  const height = width * 2.05;
  const radius = width * 0.16;
  const bezel = Math.max(4, width * 0.035);

  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius,
        borderWidth: bezel,
        borderColor: "#111",
        backgroundColor: "#fff",
        overflow: "hidden",
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
      }}
    >
      {/* Dynamic Island */}
      <View
        style={{
          position: "absolute",
          top: width * 0.035,
          alignSelf: "center",
          width: width * 0.3,
          height: width * 0.085,
          borderRadius: width * 0.05,
          backgroundColor: "#111",
          zIndex: 10,
        }}
      />
      <View style={{ flex: 1, paddingTop: width * 0.16 }}>{children}</View>
    </View>
  );
}

/* ---------- Chat de ejemplo dentro del iPhone ---------- */

export type UsuarioChat = { name: string; avatar: string };
export type MensajeChat = { id: string; name: string; message: string };

const USUARIOS: UsuarioChat[] = [
  {
    name: "User1",
    avatar:
      "https://res.cloudinary.com/harshitproject/image/upload/v1746774430/member-five.png",
  },
  {
    name: "User2",
    avatar:
      "https://res.cloudinary.com/harshitproject/image/upload/v1746774430/member-four.png",
  },
];

const MENSAJES: MensajeChat[] = [
  { id: "n1", name: "User1", message: "¿A dónde viajamos este verano?" },
  {
    id: "n2",
    name: "User2",
    message: "Encontré hoteles increíbles en la app ✈️",
  },
  {
    id: "n3",
    name: "User1",
    message: "¿Y los vuelos también se reservan ahí?",
  },
  { id: "n4", name: "User2", message: "Sí, todo en un solo lugar." },
];

type PropsVistaPreviaChat = {
  width: number;
  currentUser?: string;
  users?: UsuarioChat[];
  messages?: MensajeChat[];
};

export function VistaPreviaChat({
  width,
  currentUser = "User1",
  users = USUARIOS,
  messages = MENSAJES,
}: PropsVistaPreviaChat) {
  const font = Math.max(8, width * 0.062);
  const avatar = width * 0.12;

  return (
    <View
      style={{ flex: 1, paddingHorizontal: width * 0.05, gap: width * 0.04 }}
    >
      {messages.map((m) => {
        const mine = m.name === currentUser;
        const user = users.find((u) => u.name === m.name);
        return (
          <View
            key={m.id}
            style={{
              flexDirection: mine ? "row-reverse" : "row",
              alignItems: "flex-end",
              gap: width * 0.03,
            }}
          >
            <Image
              source={{ uri: user?.avatar }}
              style={{
                width: avatar,
                height: avatar,
                borderRadius: avatar / 2,
                backgroundColor: "#e5e7eb",
              }}
            />
            <View
              style={{
                maxWidth: "72%",
                paddingHorizontal: width * 0.05,
                paddingVertical: width * 0.03,
                borderRadius: width * 0.07,
                backgroundColor: mine ? "#0a6cff" : "#eceef1",
              }}
            >
              <Text
                style={{
                  fontSize: font,
                  lineHeight: font * 1.3,
                  color: mine ? "#fff" : "#111",
                }}
              >
                {m.message}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default MarcoIphone;
