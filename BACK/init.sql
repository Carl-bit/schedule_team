-- 1. CATÁLOGOS (Se crean primero para que otros puedan referenciarlos)

CREATE TABLE catalogo_empleado ( -- Puestos de RRHH (Ej: Senior, Junior)
    puesto_empleado_id VARCHAR(50) PRIMARY KEY,
    puesto_empleado VARCHAR(100) NOT NULL
);

CREATE TABLE catalogo_roles ( -- Roles en Proyecto (Ej: Dev, Lead, QA)
    rol_trabajo_id VARCHAR(50) PRIMARY KEY,
    rol_trabajo VARCHAR(100) NOT NULL
);

CREATE TABLE catalogo_estado ( -- Estados del registro de horas
    estado_id SERIAL PRIMARY KEY, -- Usamos SERIAL para 1, 2, 3...
    estado VARCHAR(50) NOT NULL
);

CREATE TABLE catalogo_ausencias ( -- Tipos de ausencia
    tipo_id VARCHAR(50) PRIMARY KEY,
    descripcion VARCHAR(100) NOT NULL
);

-- 2. TABLAS PRINCIPALES

CREATE TABLE empleados (
    empleado_id VARCHAR(50) PRIMARY KEY, -- UUID
    nombre_empleado VARCHAR(255) NOT NULL,
    correo_empleado VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    puesto_empleado_id VARCHAR(50),
    FOREIGN KEY (puesto_empleado_id) REFERENCES catalogo_empleado(puesto_empleado_id)
);

CREATE TABLE proyectos (
    proyecto_id VARCHAR(50) PRIMARY KEY,
    nombre_proyecto VARCHAR(255) NOT NULL,
    cliente VARCHAR(255),
    fecha_inicio DATE,
    fecha_entrega DATE
);

-- 3. TABLAS DE RELACIÓN Y MOVIMIENTO

CREATE TABLE asignaciones (
    asignacion_id VARCHAR(50) PRIMARY KEY,
    empleado_id VARCHAR(50) NOT NULL,
    proyecto_id VARCHAR(50) NOT NULL,
    rol_trabajo_id VARCHAR(50) NOT NULL, -- ¡Aquí está tu corrección!
    FOREIGN KEY (empleado_id) REFERENCES empleados(empleado_id),
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(proyecto_id),
    FOREIGN KEY (rol_trabajo_id) REFERENCES catalogo_roles(rol_trabajo_id)
);

CREATE TABLE planificacion_horaria (
    plan_id VARCHAR(50) PRIMARY KEY,
    empleado_id VARCHAR(50) NOT NULL,
    inicio_turno TIMESTAMP NOT NULL,
    fin_turno TIMESTAMP NOT NULL,
    FOREIGN KEY (empleado_id) REFERENCES empleados(empleado_id)
);

CREATE TABLE registro_horas (
    registro_id VARCHAR(50) PRIMARY KEY,
    empleado_id VARCHAR(50) NOT NULL,
    inicio_trabajo TIMESTAMP NOT NULL,
    fin_trabajo TIMESTAMP, -- NULL mientras trabaja
    estado_id INTEGER DEFAULT 1, -- Por defecto 'Generado/Pendiente'
    FOREIGN KEY (empleado_id) REFERENCES empleados(empleado_id),
    FOREIGN KEY (estado_id) REFERENCES catalogo_estado(estado_id)
);

CREATE TABLE ausencias (
    ausencia_id VARCHAR(50) PRIMARY KEY,
    empleado_id VARCHAR(50) NOT NULL,
    tipo_ausencia_id VARCHAR(50) NOT NULL,
    inicio_ausencia TIMESTAMP NOT NULL,
    fin_ausencia TIMESTAMP NOT NULL,
    FOREIGN KEY (empleado_id) REFERENCES empleados(empleado_id),
    FOREIGN KEY (tipo_ausencia_id) REFERENCES catalogo_ausencias(tipo_id)
);