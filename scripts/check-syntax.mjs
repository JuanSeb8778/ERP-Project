// Valida la sintaxis (node --check) de todos los archivos .js/.mjs de pruebas y scripts.
// El código de src/ es TypeScript y lo valida `npm run typecheck` (tsc) en el script "check".
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const roots = ["tests", "scripts"];
const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(m?js)$/.test(name)) files.push(p);
  }
};
roots.forEach(walk);

let fallos = 0;
for (const f of files) {
  try {
    execFileSync(process.execPath, ["--check", f], { stdio: "pipe" });
  } catch (err) {
    fallos++;
    console.error(`✗ ${f}\n${err.stderr}`);
  }
}
console.log(`Sintaxis verificada en ${files.length} archivos JS${fallos ? `, ${fallos} con errores` : " — OK"}`);
process.exit(fallos ? 1 : 0);
