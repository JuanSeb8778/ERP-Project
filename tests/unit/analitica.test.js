// Módulo: Analítica, dashboard y asistente IA — CP-32 a CP-35
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startApi, stopApi, api, loginAs, USERS, PASSWORD } from "../helpers/api.js";

let admin;

before(async () => {
  await startApi();
  admin = await loginAs("admin");
});

after(stopApi);

test("CP-32: abrir el dashboard con datos muestra los indicadores", async () => {
  const res = await api("GET", "/analytics/summary", { token: admin });
  assert.equal(res.status, 200);
  const { kpis, ordersByStatus, lowStock } = res.body.data;
  for (const k of ["customers", "products", "openOrders", "lowStock", "productionActive", "revenue", "outstanding"]) {
    assert.equal(typeof kpis[k], "number", `el KPI ${k} debe ser numérico`);
  }
  assert.ok(kpis.customers > 0, "con datos semilla hay clientes");
  assert.ok(Array.isArray(ordersByStatus));
  assert.equal(kpis.lowStock >= lowStock.length, true);
});

test("CP-33: aplicar un filtro actualiza los resultados", async () => {
  const bajos = await api("GET", "/inventory?lowOnly=true&pageSize=100", { token: admin });
  assert.equal(bajos.status, 200);
  assert.ok(bajos.body.data.length > 0, "el seed deja ítems bajo el punto de reorden");
  assert.ok(bajos.body.data.every((r) => r.isLow), "solo ítems con stock bajo");

  const todos = await api("GET", "/inventory?pageSize=100", { token: admin });
  assert.ok(todos.body.meta.total > bajos.body.meta.total, "el filtro reduce el resultado");

  const materiales = await api("GET", "/inventory?itemType=RAW_MATERIAL&pageSize=100", { token: admin });
  assert.ok(materiales.body.data.every((r) => r.itemType === "RAW_MATERIAL"));
});

test("CP-34: solicitar un resumen al asistente da una respuesta pertinente", async () => {
  const res = await api("POST", "/assistant/query", { token: admin, body: { question: "Which items are low on stock?" } });
  assert.equal(res.status, 200);
  assert.match(res.body.data.text, /reorder point/);
  assert.deepEqual(res.body.data.table.columns, ["Item", "Warehouse", "On hand", "Reorder"]);

  const sugerencias = await api("GET", "/assistant/suggestions", { token: admin });
  assert.ok(sugerencias.body.data.suggestions.length > 0);
});

test("CP-34: una pregunta fuera de alcance recibe un mensaje controlado", async () => {
  const res = await api("POST", "/assistant/query", { token: admin, body: { question: "¿Cuál es la capital de Francia?" } });
  assert.equal(res.status, 200);
  assert.match(res.body.data.text, /suggested prompts/);

  const vacia = await api("POST", "/assistant/query", { token: admin, body: { question: "   " } });
  assert.equal(vacia.status, 422);
});

test("CP-35: las respuestas no exponen secretos ni datos restringidos", async () => {
  const login = await api("POST", "/auth/login", { body: { email: USERS.admin, password: PASSWORD } });
  const me = await api("GET", "/auth/me", { token: admin });
  const asistente = await api("POST", "/assistant/query", { token: admin, body: { question: "What is my total revenue and outstanding?" } });
  const error = await api("GET", "/customers/no-existe", { token: admin });

  const secretos = [
    "passwordHash",
    "$2a$",
    "$2b$",
    PASSWORD,
    process.env.JWT_ACCESS_SECRET,
    process.env.JWT_REFRESH_SECRET,
    process.env.DATABASE_URL,
  ].filter(Boolean);
  for (const r of [login, me, asistente, error]) {
    for (const s of secretos) assert.ok(!r.text.includes(s), `la respuesta no debe contener "${s.slice(0, 12)}…"`);
    assert.ok(!/\bat .+\.(ts|js):\d+/.test(r.text), "no debe exponer trazas de error");
  }
});

test("CP-35: un rol sin permiso de IA no puede consultar al asistente", async () => {
  const operario = await loginAs("operario"); // no tiene ai:use
  const res = await api("POST", "/assistant/query", { token: operario, body: { question: "What is my total revenue and outstanding?" } });
  assert.equal(res.status, 403);
  assert.equal(res.body.data, undefined);
});
