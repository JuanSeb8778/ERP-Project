// Módulo: Ventas y clientes — CP-13 a CP-16
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startApi, stopApi, api, loginAs, uid, first } from "../helpers/api.js";

let ventas;
let cliente;
let pedido;

before(async () => {
  await startApi();
  ventas = await loginAs("ventas"); // Sales Executive
  cliente = await first(ventas, "/customers");
});

after(stopApi);

test("CP-13: crear una venta con datos válidos guarda el documento", async () => {
  const numero = uid("SO");
  const res = await api("POST", "/orders", { token: ventas, body: { number: numero, customerId: cliente.id, total: 11800 } });
  assert.equal(res.status, 201);
  pedido = res.body.data;
  assert.equal(pedido.number, numero);
  assert.equal(pedido.status, "CONFIRMED", "estado inicial por defecto");
  assert.equal(pedido.customer.id, cliente.id);

  const get = await api("GET", `/orders/${pedido.id}`, { token: ventas });
  assert.equal(get.status, 200);
  assert.equal(get.body.data.total, 11800);
});

test("CP-14: crear una venta sin cliente presenta validación", async () => {
  const res = await api("POST", "/orders", { token: ventas, body: { number: uid("SO"), total: 100 } });
  assert.equal(res.status, 422);
  assert.ok(res.body.error.details.customerId);
});

test("CP-14: crear una venta sin número ni importe válido presenta validación", async () => {
  const res = await api("POST", "/orders", { token: ventas, body: { customerId: cliente.id, total: -5 } });
  assert.equal(res.status, 422);
  assert.ok(res.body.error.details.number, "falta el número");
  assert.ok(res.body.error.details.total, "el importe no puede ser negativo");
});

test("CP-15: confirmar la venta deja estados e importes consistentes", async () => {
  // Cotización: total = subtotal + IVA
  const subtotal = 10000;
  const taxPct = 18;
  const total = subtotal + (subtotal * taxPct) / 100; // 11800
  const cot = await api("POST", "/quotations", {
    token: ventas,
    body: { number: uid("QT"), customerId: cliente.id, subtotal, taxPct, total },
  });
  assert.equal(cot.status, 201);
  const acept = await api("PATCH", `/quotations/${cot.body.data.id}`, { token: ventas, body: { status: "ACCEPTED" } });
  assert.equal(acept.body.data.status, "ACCEPTED");
  assert.equal(acept.body.data.total, pedido.total, "el pedido conserva el total de la cotización");

  // El pedido avanza a producción sin alterar su importe
  const avance = await api("PATCH", `/orders/${pedido.id}`, { token: ventas, body: { status: "IN_PRODUCTION" } });
  assert.equal(avance.status, 200);
  const get = await api("GET", `/orders/${pedido.id}`, { token: ventas });
  assert.equal(get.body.data.status, "IN_PRODUCTION");
  assert.equal(get.body.data.total, total);

  // Un estado fuera del catálogo no se acepta
  const malo = await api("PATCH", `/orders/${pedido.id}`, { token: ventas, body: { status: "PAGADO" } });
  assert.equal(malo.status, 422);
});

test("CP-16: consultar una venta inexistente devuelve un mensaje controlado", async () => {
  const res = await api("GET", "/orders/venta-inexistente", { token: ventas });
  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, "NOT_FOUND");
  assert.equal(res.body.error.message, "SalesOrder not found");
});
