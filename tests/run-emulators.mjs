// Lanza firebase-tools con los emuladores de este proyecto (lo usan `npm run emulators` y
// `npm run test:rules`; los argumentos pasan tal cual).
//
// En Windows, Java no arranca el emulador de Firestore si la carpeta temporal del usuario tiene
// espacios ("Unable to establish loopback connection"). Por eso se le indica otra carpeta, solo a
// los procesos de Java que se abren desde aquí.
//
// Esa carpeta va FUERA del proyecto: Java crea ahí sockets que no se pueden leer, y Metro (Expo)
// vigila todo el proyecto y se cae al intentar leerlos (EACCES) si los emuladores y Expo corren a
// la vez. Metro lee cada archivo antes de decidir si lo ignora, así que ignorarla no basta.
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Carpeta para los sockets de Java: junto al proyecto (no dentro, para que Metro no la vea).
 * Java rechaza rutas con espacios y también algunas carpetas del usuario (como AppData).
 */
function carpetaSocketsJava() {
  const junto = join(dirname(raiz), ".reloop-jdk-uds");
  if (!/\s/.test(junto)) return junto;
  // Si la ruta del proyecto tiene espacios, una en la raíz de la unidad
  return join(parse(raiz).root, ".reloop-jdk-uds");
}

const carpetaJava = carpetaSocketsJava();
mkdirSync(carpetaJava, { recursive: true });

const opcionesJava = [process.env.JAVA_TOOL_OPTIONS, `-Djdk.net.unixdomain.tmpdir=${carpetaJava}`]
  .filter(Boolean)
  .join(" ");

const args = ["--yes", "firebase-tools", ...process.argv.slice(2)];
const proceso = spawn("npx", args.map((arg) => (/\s/.test(arg) ? `"${arg}"` : arg)), {
  cwd: raiz,
  stdio: "inherit",
  shell: true,
  env: { ...process.env, JAVA_TOOL_OPTIONS: opcionesJava },
});
proceso.on("exit", (code) => process.exit(code ?? 1));
