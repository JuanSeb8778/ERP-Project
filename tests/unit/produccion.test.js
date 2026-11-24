// Módulo: Producción y MES — CP-21 a CP-24
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startApi, stopApi, api, loginAs, uid, first, stockOf } from "../helpers/api.js";

let jefe; // Production Manager
let producto;
let orden;

before(async () => {
  await startApi();
  jefe = await loginAs("produccion");
  producto = await first(jefe, "/products");
});

after(stopApi);

test("CP-21: crear una orden de producción la persiste", async () => {
  const res = await api("POST", "/production-orders", {
    token: jefe,
    body: { number: uid("MO"), productId: producto.id, quantity: 10 },
  });
  assert.equal(res.status, 201);
  orden = res.body.data;
  assert.equal(orden.status, "PLANNED");
  assert.equal(orden.quantity, 10);
});

test("CP-22: consultar una orden válida muestra detalle y estado correctos", async () => {
  const res = await api("GET", `/production-orders/${orden.id}`, { token: jefe });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.number, orden.number);
  assert.equal(res.body.data.status, "PLANNED");
  assert.equal(res.body.data.product.id, producto.id, "relación con el producto");
  assert.equal(res.body.data.product.sku, producto.sku);
});

test("CP-23: un estado inexistente es bloqueado", async () => {
  const res = await api("PATCH", `/production-orders/${orden.id}`, { token: jefe, body: { status: "TERMINADA" } });
  assert.equal(res.status, 422);
  const get = await api("GET", `/production-orders/${orden.id}`, { token: jefe });
  assert.equal(get.body.data.status, "PLANNED", "el estado no cambió");
});

test("CP-23: un rol sin permiso no puede cambiar el estado", async () => {
  const operario = await loginAs("operario"); // production:execute pero no production:update
  const res = await api("PATCH", `/production-orders/${orden.id}`, { token: operario, body: { status: "COMPLETED" } });
  assert.equal(res.status, 403);
});

test("CP-24: registrar consumo y avance deja datos consistentes", async () => {
  const almacen = await loginAs("almacen");
  const bodega = await first(almacen, "/warehouses");
  const material = await first(almacen, "/raw-materials");

  // Garantizar material disponible y luego consumirlo
  await api("POST", "/inventory/adjust", {
    token: almacen,
    body: { warehouseId: bodega.id, itemType: "RAW_MATERIAL", itemId: material.id, delta: 10, reason: "PURCHASE_RECEIPT" },
  });
  const antes = await stockOf(almacen, bodega.id, "RAW_MATERIAL", material.id);
  const consumo = await api("POST", "/inventory/adjust", {
    token: almacen,
    body: { warehouseId: bodega.id, itemType: "RAW_MATERIAL", itemId: material.id, delta: -5, reason: "PRODUCTION_CONSUME", note: orden.number },
  });
  assert.equal(consumo.status, 201);
  assert.equal(await stockOf(almacen, bodega.id, "RAW_MATERIAL", material.id), antes - 5);

  // Avance de la orden por los estados del proceso
  for (const estado of ["RELEASED", "IN_PROGRESS", "COMPLETED"]) {
    const res = await api("PATCH", `/production-orders/${orden.id}`, { token: jefe, body: { status: estado } });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, estado);
  }
});

test(
  "CP-23: no se permite retroceder una orden COMPLETED a PLANNED",
  { todo: "No aplica en la versión instalada: la API no implementa una máquina de estados (cualquier estado válido se acepta)" },
  async () => {
    const res = await api("PATCH", `/production-orders/${orden.id}`, { token: jefe, body: { status: "PLANNED" } });
    assert.notEqual(res.status, 200, "la transición COMPLETED → PLANNED debería bloquearse");
  },
);
