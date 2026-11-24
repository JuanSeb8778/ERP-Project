// Módulo: Autenticación y control de acceso — CP-01 a CP-04
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startApi, stopApi, api, loginAs, USERS, PASSWORD } from "../helpers/api.js";

before(startApi);
after(stopApi);

test("CP-01: iniciar sesión con credenciales válidas concede acceso", async () => {
  const res = await api("POST", "/auth/login", { body: { email: USERS.admin, password: PASSWORD } });
  assert.equal(res.status, 200);
  assert.ok(res.body.data.accessToken, "debe devolver un access token");
  assert.equal(res.body.data.user.email, USERS.admin);
  assert.equal(res.body.data.user.role, "ADMIN");
  // El refresh token viaja en una cookie httpOnly
  const cookie = res.headers.getSetCookie().find((c) => c.startsWith("tf_refresh="));
  assert.ok(cookie, "debe enviar la cookie de refresh");
  assert.match(cookie, /HttpOnly/i);

  // Con el token se accede a una ruta protegida
  const me = await api("GET", "/auth/me", { token: res.body.data.accessToken });
  assert.equal(me.status, 200);
  assert.equal(me.body.data.email, USERS.admin);
});

test("CP-02: iniciar sesión con contraseña incorrecta rechaza el acceso", async () => {
  const res = await api("POST", "/auth/login", { body: { email: USERS.admin, password: "Incorrecta123!" } });
  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.code, "UNAUTHORIZED");
  assert.equal(res.body.data, undefined, "no debe entregar token");
});

test("CP-02: usuario inexistente recibe el mismo rechazo (sin revelar qué falló)", async () => {
  const res = await api("POST", "/auth/login", { body: { email: "nadie@techforge.dev", password: PASSWORD } });
  assert.equal(res.status, 401);
  assert.equal(res.body.error.message, "Invalid email or password");
});

test("CP-03: acceder a una ruta protegida sin autenticación es rechazado", async () => {
  for (const ruta of ["/auth/me", "/customers", "/inventory", "/analytics/summary"]) {
    const res = await api("GET", ruta);
    assert.equal(res.status, 401, `${ruta} debe responder 401 sin token`);
    assert.equal(res.body.error.code, "UNAUTHORIZED");
  }
});

test("CP-03: un token inválido o manipulado también es rechazado", async () => {
  const res = await api("GET", "/customers", { token: "eyJhbGciOiJIUzI1NiJ9.falso.firma" });
  assert.equal(res.status, 401);
});

test("CP-04: intentar una operación sin permisos queda bloqueada", async () => {
  const token = await loginAs("operario"); // el operario no tiene customer:create
  const res = await api("POST", "/customers", { token, body: { code: "NO-DEBE-EXISTIR", name: "Bloqueado" } });
  assert.equal(res.status, 403);
  assert.equal(res.body.error.code, "FORBIDDEN");
  assert.match(res.body.error.message, /customer:create/);

  // Verificar que no hubo efecto: el registro no se creó
  const admin = await loginAs("admin");
  const list = await api("GET", "/customers?q=NO-DEBE-EXISTIR", { token: admin });
  assert.equal(list.body.meta.total, 0);
});

test("CP-04: cerrar sesión revoca la sesión (el refresh token deja de servir)", async () => {
  const login = await api("POST", "/auth/login", { body: { email: USERS.ventas, password: PASSWORD } });
  const cookie = login.headers.getSetCookie().find((c) => c.startsWith("tf_refresh=")).split(";")[0];

  const logout = await api("POST", "/auth/logout", { headers: { cookie } });
  assert.equal(logout.status, 200);

  const refresh = await api("POST", "/auth/refresh", { headers: { cookie } });
  assert.equal(refresh.status, 401, "tras el logout el refresh token debe quedar revocado");
});
