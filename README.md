# 📅 Schedule Team

> Sistema integral de gestión de horarios, turnos y equipos de trabajo.

Optimiza la planificación de turnos y el control de asistencia. Diseñado para ofrecer paneles diferenciados entre **Líderes** (gestión estratégica) y **Trabajadores** (operación diaria).

---

## 🚀 Tecnologías Principales

| Capa | Stack Tecnológico |
| :--- | :--- |
| **Frontend** | ![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs) ![React](https://img.shields.io/badge/React-19-blue?logo=react) ![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss) |
| **Backend** | ![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=nodedotjs) ![Express](https://img.shields.io/badge/Express-5-lightgrey?logo=express) |
| **Database** | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql) |
| **Infra** | ![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker) |

---

## 📂 Estructura del Proyecto

```text
Schedule/
├── API/                # Backend (Express REST API)
│   ├── config/         # Conexión DB
│   ├── controllers/    # Lógica de negocio
│   ├── services/       # Capa de datos (Queries SQL)
│   └── server.js       # Entry point
├── front/              # Frontend (Next.js App Router)
│   ├── app/            # Vistas y Rutas
│   └── middleware.ts   # Control de acceso por roles
├── BACK/               # Scripts de Base de Datos
│   ├── init.sql        # Esquema
│   └── seeds.sql       # Datos de prueba
└── docker-compose.yml  # Orquestación de servicios
```

---

## 🔐 Roles y Funcionalidades

### 👔 Panel de Líder
* **Gestión de Personal:** CRUD completo de trabajadores.
* **Planificación:** Creación de turnos y asignación de proyectos.
* **Reportes:** Generación de informes detallados y exportación a **PDF**.
* **Aprobaciones:** Gestión de solicitudes de cobertura y ausencias.

### 👷 Panel de Trabajador
* **Asistencia:** Registro de entrada/salida (Clock-in/out).
* **Calendario:** Visualización de turnos y proyectos asignados.
* **Personalización:** Etiquetas propias y gestión de perfil.
* **Solicitudes:** Envío de peticiones de cobertura al líder.

---

## ⚙️ Instalación y Configuración

### 🐳 Opción A: Docker (Recomendado)
Levanta todo el entorno (App, API, DB, pgAdmin) con un solo comando:

```bash
docker compose up --build
```

**Accesos rápidos:**
* **Frontend:** `http://localhost:3018`
* **API:** `http://localhost:3019`
* **pgAdmin:** `http://localhost:5050` (User: `admin@schedule.com` | Pass: `admin123`)

---

### 💻 Opción B: Desarrollo Local
1.  **Base de Datos:** Ejecuta los scripts en `/BACK` en tu instancia local de Postgres.
2.  **Variables de Entorno:**
    * Crea `API/.env` basándote en `.env.example`.
    * Crea `front/.env.local` basándote en `.env.example`.
3.  **Instalar y Correr:**
    ```bash
    npm install
    npm run dev
    ```

---

## 📡 API Endpoints Principales

| Recurso | Ruta | Descripción |
| :--- | :--- | :--- |
| **Auth** | `/api/auth` | Login y validación de tokens. |
| **Empleados**| `/api/empleados` | Gestión de staff. |
| **Horas** | `/api/hora` | Registros de jornada. |
| **Turnos** | `/api/planificacion`| Calendario maestro. |

