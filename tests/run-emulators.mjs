// Lanza firebase-tools con los emuladores de este proyecto (lo usan `npm run emulators` y
// `npm run test:rules`; los argumentos pasan tal cual).
//
// En Windows, Java no arranca el emulador de Firestore si la carpeta temporal del usuario tiene
// espacios ("Unable to establish loopback connection"). Por eso se le indica otra carpeta, dentro
// de node_modules/.cache, solo a los procesos de Java que se abren desde aquí.
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const carpetaJava = join(raiz, "node_modules", ".cache", "jdk-uds");
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
