// Módulo: Inventario — CP-09 a CP-12
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startApi, stopApi, api, loginAs, uid, first, stockOf } from "../helpers/api.js";

let admin;
let almacen; // rol Store Manager: tiene inventory:update
let bodega;
let producto;

before(async () => {
  await startApi();
  admin = await loginAs("admin");
  almacen = await loginAs("almacen");
  bodega = await first(almacen, "/warehouses");
  // Producto nuevo para conocer exactamente sus existencias iniciales (0)
  const res = await api("POST", "/products", { token: admin, body: { sku: uid("SKU"), name: "Producto QA inventario", reorderPoint: 5 } });
  assert.equal(res.status, 201);
  producto = res.body.data;
});

after(async () => {
  if (producto) await api("DELETE", `/products/${producto.id}`, { token: admin });
  await stopApi();
});

const mover = (delta, reason = "ADJUSTMENT") =>
  api("POST", "/inventory/adjust", {
    token: almacen,
    body: { warehouseId: bodega.id, itemType: "PRODUCT", itemId: producto.id, delta, reason, note: "QA" },
  });

test("CP-09: registrar una entrada de inventario actualiza el stock", async () => {
  const antes = await stockOf(almacen, bodega.id, "PRODUCT", producto.id);
  const res = await mover(50, "PURCHASE_RECEIPT");
  assert.equal(res.status, 201);
  assert.equal(res.body.data.stock.quantity, antes + 500);
  assert.equal(res.body.data.movement.delta, 50);
  assert.equal(await stockOf(almacen, bodega.id, "PRODUCT", producto.id), antes + 50);
});

test("CP-10: registrar una salida dentro de las existencias genera el movimiento correcto", async () => {
  const antes = await stockOf(almacen, bodega.id, "PRODUCT", producto.id);
  const res = await mover(-20, "SALE_DISPATCH");
  assert.equal(res.status, 201);
  assert.equal(res.body.data.movement.delta, -20);
  assert.equal(res.body.data.movement.balanceAfter, antes - 20);
  assert.equal(await stockOf(almacen, bodega.id, "PRODUCT", producto.id), antes - 20);
});

test("CP-11: una salida superior al stock es rechazada", async () => {
  const antes = await stockOf(almacen, bodega.id, "PRODUCT", producto.id);
  const res = await mover(-(antes + 1), "SALE_DISPATCH");
  assert.equal(res.status, 400);
  assert.match(res.body.error.message, /below zero/);
  assert.equal(await stockOf(almacen, bodega.id, "PRODUCT", producto.id), antes, "el stock no debe cambiar");
});

test("CP-11: un rol sin permiso de inventario no puede mover stock", async () => {
  const ventas = await loginAs("ventas");
  const res = await api("POST", "/inventory/adjust", {
    token: ventas,
    body: { warehouseId: bodega.id, itemType: "PRODUCT", itemId: producto.id, delta: 10 },
  });
  assert.equal(res.status, 403);
});

test("CP-12: el historial de movimientos es coherente con el stock", async () => {
  const res = await api("GET", `/inventory/movements?itemId=${producto.id}&pageSize=100`, { token: almacen });
  assert.equal(res.status, 200);
  const movimientos = [...res.body.data].reverse(); // del más antiguo al más reciente
  assert.equal(movimientos.length, 2, "solo las dos operaciones válidas (CP-09 y CP-10)");

  let saldo = 0;
  for (const m of movimientos) {
    saldo += m.delta;
    assert.equal(m.balanceAfter, saldo, "cada saldo = saldo anterior + delta");
  }
  assert.equal(saldo, await stockOf(almacen, bodega.id, "PRODUCT", producto.id));
  assert.deepEqual(movimientos.map((m) => m.reason), ["PURCHASE_RECEIPT", "SALE_DISPATCH"]);
});
