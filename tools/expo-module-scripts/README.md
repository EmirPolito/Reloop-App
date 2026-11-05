# expo-module-scripts (solo para el editor)

Varios paquetes de Expo que hay en `node_modules` (`expo-image`, `expo-image-picker`, `expo-font` y otros 14) traen un `tsconfig.json` que extiende `expo-module-scripts/tsconfig.base`. Esa es una herramienta para quien crea módulos de Expo, y una app no la instala. Sin ella, VS Code marca dos errores en cuanto se abre cualquier archivo de esos paquetes, por ejemplo al saltar a una definición.

Esta carpeta contiene únicamente los archivos base (`tsconfig.base.json` y `tsconfig.node.json`), con lo mínimo para que esos errores no aparezcan. No es la herramienta real: no se usa para compilar la app y no afecta a `tsc`, a Metro ni a EAS. `@types/jest` está en `devDependencies` por la misma razón: el `tsconfig.json` de `expo-font` lo pide.

Si algún día necesitas crear un módulo de Expo, quita la dependencia `expo-module-scripts` de `package.json`, borra esta carpeta e instala la herramienta real.
