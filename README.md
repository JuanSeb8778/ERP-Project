# ERP-System — Pipeline de pruebas unitarias

![CI/CD](https://github.com/<USUARIO>/<REPOSITORIO>/actions/workflows/ci-cd.yml/badge.svg)

Proyecto final de **Ingeniería de Software III** — Institución Universitaria EAM.

Aplicación ERP en Node.js con pruebas unitarias para los **35 casos (CP-01 a CP-35)** del Plan de Pruebas, ejecutadas automáticamente por un pipeline de **GitHub Actions**.

**Integrantes:** Nicolás Valencia Vergara · Juan Sebastián Ángel Ramírez · Diego Andrés Rincón Chila

## Módulos y casos de prueba

| Módulo | Casos |
|---|---|
| Autenticación y control de acceso | CP-01 a CP-04 |
| Gestión de datos maestros | CP-05 a CP-08 |
| Inventario | CP-09 a CP-12 |
| Ventas y clientes | CP-13 a CP-16 |
| Compras y proveedores | CP-17 a CP-20 |
| Producción y MES | CP-21 a CP-24 |
| Calidad | CP-25 a CP-27 |
| Finanzas y recursos humanos | CP-28 a CP-31 |
| Analítica, dashboard y asistente IA | CP-32 a CP-35 |

## Inicio rápido

Requisitos: **Node.js 20 o superior** y **Git**.

```bash
git clone https://github.com/<USUARIO>/<REPOSITORIO>.git
cd <REPOSITORIO>
npm ci                   # instalar dependencias
npm test                 # ejecutar las pruebas unitarias
npm run test:coverage    # pruebas + cobertura
npm start                # opcional: http://localhost:3000/health
```

## Pipeline

```
Push / PR / manual → Checkout → Instalar dependencias → Validar sintaxis
  → Pruebas unitarias (Node 20 y 22) → ¿Pasan todas?
       sí → Deploy a Render → Health check
       no → Pipeline en rojo, el deploy no se ejecuta
```

- Definición: [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml)
- Se ejecuta con cada push a `main` o `develop`, con cada Pull Request hacia `main` y manualmente desde **Actions → CI/CD → Run workflow**.
- El despliegue a Render es opcional: requiere los secrets `RENDER_DEPLOY_HOOK_URL` y `RENDER_APP_URL`.

## Estructura

```
├── .github/workflows/ci-cd.yml   # Pipeline
├── src/                          # Código de los módulos del ERP
├── tests/unit/                   # Pruebas unitarias (CP-01 a CP-35)
├── package.json
└── package-lock.json
```

## Guía de instalación y configuración

La guía completa (instalación, configuración del pipeline, sus parámetros, cómo provocar un fallo intencional y la trazabilidad CP → prueba) está en: **[GUÍA](<ENLACE_A_LA_GUIA>)**
