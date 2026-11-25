// Módulo: Gestión de datos maestros — CP-05 a CP-08
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startApi, stopApi, api, loginAs, uid } from "../helpers/api.js";

let token;
const codigo = uid("CLI");
let clienteId;

before(async () => {
  await startApi();
  token = await loginAs("admin");
});

after(async () => {
  // Limpieza de los datos de prueba (borrado lógico)
  if (clienteId) await api("DELETE", `/customers/${clienteId}`, { token });
  await stopApi();
});

test("CP-05: crear un registro válido se guarda correctamente", async () => {
  const res = await api("POST", "/customers", {
    token,
    body: { code: codigo, name: "Cliente QA", email: "qa@cliente.test", city: "Armenia", creditLimit: 1500000 },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.code, codigo);
  assert.equal(res.body.data.creditLimit, 1500000);
  clienteId = res.body.data.id;

  // Persistido: se puede consultar por id
  const get = await api("GET", `/customers/${clienteId}`, { token });
  assert.equal(get.status, 200);
  assert.equal(get.body.data.name, "Cliente QA");
});

test("CP-06: omitir un campo obligatorio informa el error y no se guarda", async () => {
  const sinNombre = uid("SIN-NOMBRE");
  const res = await api("POST", "/customers", { token, body: { code: sinNombre } });
  assert.equal(res.status, 422);
  assert.equal(res.body.error.code, "VALIDATION_ERROR");
  assert.ok(res.body.error.details.name, "debe indicar que falta el campo name");

  const list = await api("GET", `/customers?q=${sinNombre}`, { token });
  assert.equal(list.body.meta.total, 0, "el registro inválido no debe existir");
});

test("CP-06: un código duplicado tampoco se guarda", async () => {
  const res = await api("POST", "/customers", { token, body: { code: codigo, name: "Duplicado" } });
  assert.notEqual(res.status, 201);
  const list = await api("GET", `/customers?q=${codigo}`, { token });
  assert.equal(list.body.meta.total, 1);
});

test(
  "CP-06: un código duplicado responde con un error controlado (409)",
  { todo: "TODO - Defecto encontrado: la API responde 500 INTERNAL_ERROR en vez de 409 CONFLICT ante un código duplicado" },
  async () => {
    const res = await api("POST", "/customers", { token, body: { code: codigo, name: "Duplicado" } });
    assert.equal(res.status, 409);
  },
);

test("CP-07: actualizar un registro existente persiste los cambios", async () => {
  const res = await api("PATCH", `/customers/${clienteId}`, { token, body: { city: "Pereira", creditLimit: 2000000 } });
  assert.equal(res.status, 200);

  const get = await api("GET", `/customers/${clienteId}`, { token });
  assert.equal(get.body.data.city, "Pereira");
  assert.equal(get.body.data.creditLimit, 2000000);
  assert.equal(get.body.data.name, "Cliente QA", "los campos no enviados no cambian");
});

test("CP-08: consultar un identificador inexistente da una respuesta controlada", async () => {
  const res = await api("GET", "/customers/id-que-no-existe", { token });
  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.code, "NOT_FOUND");
  assert.equal(res.body.error.message, "Customer not found");
});
