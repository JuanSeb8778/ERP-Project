// Módulo: Calidad — CP-25 a CP-27
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startApi, stopApi, api, loginAs, uid } from "../helpers/api.js";

let inspector; // Quality Inspector
let inspeccion;

before(async () => {
  await startApi();
  inspector = await loginAs("calidad");
});

after(stopApi);

test("CP-25: registrar una inspección con datos válidos la guarda", async () => {
  const res = await api("POST", "/inspections", {
    token: inspector,
    body: { number: uid("QC"), type: "FINAL", status: "PASSED", result: "Sin defectos", reference: "LOTE-QA-01" },
  });
  assert.equal(res.status, 201);
  inspeccion = res.body.data;
  assert.equal(inspeccion.type, "FINAL");
  assert.equal(inspeccion.status, "PASSED");
});

test("CP-26: omitir un dato obligatorio muestra la validación", async () => {
  const res = await api("POST", "/inspections", { token: inspector, body: { type: "INCOMING" } });
  assert.equal(res.status, 422);
  assert.equal(res.body.error.code, "VALIDATION_ERROR");
  assert.ok(res.body.error.details.number);
});

test("CP-26: un tipo de inspección no válido muestra la validación", async () => {
  const res = await api("POST", "/inspections", { token: inspector, body: { number: uid("QC"), type: "VISUAL" } });
  assert.equal(res.status, 422);
  assert.ok(res.body.error.details.type);
});

test("CP-27: consultar el resultado de la inspección muestra información coherente", async () => {
  const get = await api("GET", `/inspections/${inspeccion.id}`, { token: inspector });
  assert.equal(get.status, 200);
  assert.equal(get.body.data.number, inspeccion.number);
  assert.equal(get.body.data.result, "Sin defectos");
  assert.equal(get.body.data.reference, "LOTE-QA-01");

  const list = await api("GET", `/inspections?q=${inspeccion.number}`, { token: inspector });
  assert.equal(list.body.meta.total, 1);
  assert.equal(list.body.data[0].status, "PASSED");
});
