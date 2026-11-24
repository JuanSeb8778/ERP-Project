/**
 * Utilidades compartidas por las pruebas del Plan de Pruebas (CP-01 a CP-35).
 *
 * Levanta la API real del ERP (Express + Prisma, escrita en TypeScript y cargada
 * con `tsx`) en un puerto aleatorio y expone un cliente HTTP mínimo con `fetch`,
 * además de un inicio de sesión por rol usando los usuarios que crea el seed.
 */

// Silenciar logs y forzar modo test ANTES de cargar la app (env.ts valida al importarse).
process.env.LOG_LEVEL ??= "silent";
process.env.NODE_ENV ??= "test";

export const PASSWORD = "Password123!";

/** Usuarios de prueba con roles diferenciados (prerrequisito del plan). */
export const USERS = {
  admin: "admin@techforge.dev",
  produccion: "pm@techforge.dev",
  calidad: "qc@techforge.dev",
  compras: "purchase@techforge.dev",
  almacen: "store@techforge.dev",
  ventas: "sales@techforge.dev",
  operario: "operator@techforge.dev",
  rrhh: "hr@techforge.dev",
  finanzas: "finance@techforge.dev",
};

let server;
let baseUrl = "";
let disconnect;
const tokenCache = new Map();

/** Inicia la API en un puerto libre. Usar en `before()`. */
export async function startApi() {
  if (server) return baseUrl;
  const { createApp } = await import("../../apps/api/src/app.ts");
  const { prismaRaw } = await import("../../apps/api/src/core/prisma.ts");
  disconnect = () => prismaRaw.$disconnect();
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
  return baseUrl;
}

/** Detiene la API y cierra la conexión a la base de datos. Usar en `after()`. */
export async function stopApi() {
  if (server) await new Promise((resolve) => server.close(resolve));
  server = undefined;
  tokenCache.clear();
  if (disconnect) await disconnect();
}

/** Petición HTTP contra la API. Devuelve { status, body, headers, text }. */
export async function api(method, path, { token, body, headers = {} } = {}) {
  const h = { ...headers };
  if (body !== undefined) h["content-type"] = "application/json";
  if (token) h.authorization = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: h,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { success: false };
  }
  return { status: res.status, body: parsed, headers: res.headers, text };
}

/** Inicia sesión con un rol de prueba y devuelve el access token (cacheado). */
export async function loginAs(rol) {
  if (tokenCache.has(rol)) return tokenCache.get(rol);
  const res = await api("POST", "/auth/login", { body: { email: USERS[rol], password: PASSWORD } });
  if (res.status !== 200 || !res.body.data?.accessToken) {
    throw new Error(`No se pudo iniciar sesión como ${rol}: ${res.status} ${res.text}`);
  }
  tokenCache.set(rol, res.body.data.accessToken);
  return res.body.data.accessToken;
}

/** Código único para que los datos de prueba no choquen entre ejecuciones. */
export function uid(prefix = "QA") {
  const rnd = Math.random().toString(36).slice(2, 6);
  return `${prefix}-${Date.now().toString(36)}-${rnd}`.toUpperCase();
}

/** Primer registro de un listado (datos semilla: clientes, proveedores, etc.). */
export async function first(token, path) {
  const sep = path.includes("?") ? "&" : "?";
  const res = await api("GET", `${path}${sep}pageSize=1`, { token });
  if (res.status !== 200 || !res.body.data?.length) {
    throw new Error(`Sin datos de prueba en ${path} (¿se ejecutó el seed?): ${res.status}`);
  }
  return res.body.data[0];
}

/** Cantidad actual de un ítem en un almacén (0 si no tiene registro de stock). */
export async function stockOf(token, warehouseId, itemType, itemId) {
  const res = await api("GET", `/inventory?warehouseId=${warehouseId}&itemType=${itemType}&pageSize=100`, { token });
  const row = res.body.data?.find((r) => r.itemId === itemId);
  return row ? row.quantity : 0;
}
