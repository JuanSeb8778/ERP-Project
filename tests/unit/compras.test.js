// Módulo: Compras y proveedores — CP-17 a CP-20
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startApi, stopApi, api, loginAs, uid, first, stockOf } from "../helpers/api.js";

let compras; // Purchase Manager
let almacen; // Store Manager (recibe mercancía)
let proveedor;
let orden;
let borrador;

before(async () => {
  await startApi();
  compras = await loginAs("compras");
  almacen = await loginAs("almacen");
  proveedor = await first(compras, "/suppliers");
});

after(stopApi);

test("CP-17: crear una orden de compra válida la registra", async () => {
  const res = await api("POST", "/purchase-orders", {
    token: compras,
    body: { number: uid("PO"), supplierId: proveedor.id, total: 250000, notes: "Orden QA" },
  });
  assert.equal(res.status, 201);
  orden = res.body.data;
  assert.equal(orden.status, "DRAFT");
  assert.equal(orden.supplier.id, proveedor.id);

  const otra = await api("POST", "/purchase-orders", { token: compras, body: { number: uid("PO"), supplierId: proveedor.id } });
  borrador = otra.body.data;
});

test("CP-18: guardar una orden sin proveedor es rechazado", async () => {
  const numero = uid("PO");
  const res = await api("POST", "/purchase-orders", { token: compras, body: { number: numero, total: 100 } });
  assert.equal(res.status, 422);
  assert.ok(res.body.error.details.supplierId);

  const list = await api("GET", `/purchase-orders?q=${numero}`, { token: compras });
  assert.equal(list.body.meta.total, 0);
});

test("CP-18: guardar una orden sin número es rechazado", async () => {
  const res = await api("POST", "/purchase-orders", { token: compras, body: { supplierId: proveedor.id } });
  assert.equal(res.status, 422);
  assert.ok(res.body.error.details.number);
});

test("CP-19: registrar la recepción deja cantidades recibidas coherentes", async () => {
  const bodega = await first(almacen, "/warehouses");
  const material = await first(almacen, "/raw-materials");
  const antes = await stockOf(almacen, bodega.id, "RAW_MATERIAL", material.id);

  // Entrada al almacén por la recepción de la orden
  const entrada = await api("POST", "/inventory/adjust", {
    token: almacen,
    body: { warehouseId: bodega.id, itemType: "RAW_MATERIAL", itemId: material.id, delta: 40, reason: "PURCHASE_RECEIPT", note: orden.number },
  });
  assert.equal(entrada.status, 201);
  assert.equal(entrada.body.data.movement.reason, "PURCHASE_RECEIPT");
  assert.equal(await stockOf(almacen, bodega.id, "RAW_MATERIAL", material.id), antes + 40);

  // La orden pasa a RECIBIDA
  const recibida = await api("PATCH", `/purchase-orders/${orden.id}`, { token: compras, body: { status: "RECEIVED" } });
  assert.equal(recibida.status, 200);
  assert.equal(recibida.body.data.status, "RECEIVED");
});

test("CP-20: consultar órdenes por estado devuelve resultados correctos", async () => {
  const res = await api("GET", "/purchase-orders?q=RECEIVED&pageSize=100", { token: compras });
  assert.equal(res.status, 200);
  assert.ok(res.body.data.length >= 1);
  assert.ok(res.body.data.every((o) => o.status === "RECEIVED"), "todas deben estar RECEIVED");
  assert.ok(res.body.data.some((o) => o.id === orden.id), "incluye la orden recibida");
  assert.ok(!res.body.data.some((o) => o.id === borrador.id), "no incluye la orden en borrador");
});
