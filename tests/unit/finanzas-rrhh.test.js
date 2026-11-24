// Módulo: Finanzas y recursos humanos — CP-28 a CP-31
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startApi, stopApi, api, loginAs, uid, first } from "../helpers/api.js";

let finanzas;
let cliente;

before(async () => {
  await startApi();
  finanzas = await loginAs("finanzas");
  cliente = await first(finanzas, "/customers");
});

after(stopApi);

test("CP-28: el resumen financiero tiene totales coherentes con los datos", async () => {
  const antes = (await api("GET", "/analytics/summary", { token: finanzas })).body.data.kpis;

  const factura = await api("POST", "/invoices", {
    token: finanzas,
    body: { number: uid("INV"), customerId: cliente.id, total: 1000, amountPaid: 400, status: "PARTIAL" },
  });
  assert.equal(factura.status, 201);

  const despues = (await api("GET", "/analytics/summary", { token: finanzas })).body.data.kpis;
  assert.equal(despues.revenue - antes.revenue, 400, "recaudo = lo pagado");
  assert.equal(despues.outstanding - antes.outstanding, 600, "pendiente = total - pagado");
});

test("CP-29: registrar una operación con los campos requeridos es válido", async () => {
  const res = await api("POST", "/payments", {
    token: finanzas,
    body: { number: uid("PAY"), customerId: cliente.id, amount: 400, method: "BANK", reference: "TRX-QA" },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.amount, 400);
});

test("CP-29: una operación con importe cero no se registra", async () => {
  const res = await api("POST", "/payments", { token: finanzas, body: { number: uid("PAY"), customerId: cliente.id, amount: 0 } });
  assert.equal(res.status, 422);
  assert.ok(res.body.error.details.amount);
});

test("CP-30: un usuario autorizado consulta los datos del empleado", async () => {
  const rrhh = await loginAs("rrhh");
  const empleado = await first(rrhh, "/employees");
  const res = await api("GET", `/employees/${empleado.id}`, { token: rrhh });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.code, empleado.code);
  assert.ok(res.body.data.firstName);
});

test("CP-31: un usuario sin permiso que consulta datos restringidos recibe acceso denegado", async () => {
  // Finanzas no puede ver empleados; Ventas y Operario no pueden ver facturas
  const casos = [
    ["finanzas", "/employees"],
    ["ventas", "/invoices"],
    ["operario", "/payments"],
  ];
  for (const [rol, ruta] of casos) {
    const res = await api("GET", ruta, { token: await loginAs(rol) });
    assert.equal(res.status, 403, `${rol} no debe acceder a ${ruta}`);
    assert.equal(res.body.data, undefined, "no debe filtrar datos");
  }
});
