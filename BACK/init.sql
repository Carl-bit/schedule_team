-- ============================================================
-- SCHEDULE DB - Schema Completo
-- Orden de creacion respeta dependencias de Foreign Keys
-- ============================================================

-- ============================================================
-- 1. CATALOGOS (Tablas de referencia sin dependencias)
-- ============================================================

CREATE TABLE IF NOT EXISTS catalogo_empleado (
    puesto_empleado_id VARCHAR(50) PRIMARY KEY,
    puesto_empleado VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS catalogo_roles (
    rol_trabajo_id VARCHAR(50) PRIMARY KEY,
    rol_trabajo VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS catalogo_estado (
    estado_id SERIAL PRIMARY KEY,
    estado VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS catalogo_ausencias (
    tipo_id VARCHAR(50) PRIMARY KEY,
    descripcion VARCHAR(100) NOT NULL,
    requiere_aprobacion BOOLEAN DEFAULT true
);

-- ============================================================
-- 2. TABLAS PRINCIPALES
-- ============================================================

CREATE TABLE IF NOT EXISTS empleados (
    empleado_id VARCHAR(50) PRIMARY KEY,
    nombre_empleado VARCHAR(255) NOT NULL,
    correo_empleado VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telefono_empleado VARCHAR(255),
    alias_empleado VARCHAR(255),
    puesto_empleado_id VARCHAR(50),
    FOREIGN KEY (puesto_empleado_id) REFERENCES catalogo_empleado(puesto_empleado_id)
);

CREATE TABLE IF NOT EXISTS proyectos (
    proyecto_id VARCHAR(50) PRIMARY KEY,
    nombre_proyecto VARCHAR(255) NOT NULL,
    cliente VARCHAR(255),
    fecha_inicio DATE,
    fecha_entrega DATE
);

-- ============================================================
-- 3. CATALOGOS QUE DEPENDEN DE TABLAS PRINCIPALES
-- ============================================================

CREATE TABLE IF NOT EXISTS catalogo_etiquetas (
    etiqueta_id VARCHAR(50) PRIMARY KEY,
    empleado_id VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    rango_horas VARCHAR(100) NOT NULL,
    color VARCHAR(50) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    secuencia_patron JSON,
    FOREIGN KEY (empleado_id) REFERENCES empleados(empleado_id)
);

-- ============================================================
-- 4. TABLAS DE RELACION Y MOVIMIENTO
-- ============================================================

CREATE TABLE IF NOT EXISTS asignaciones (
    asignacion_id VARCHAR(50) PRIMARY KEY,
    empleado_id VARCHAR(50) NOT NULL,
    proyecto_id VARCHAR(50) NOT NULL,
    rol_trabajo_id VARCHAR(50) NOT NULL,
    FOREIGN KEY (empleado_id) REFERENCES empleados(empleado_id),
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(proyecto_id),
    FOREIGN KEY (rol_trabajo_id) REFERENCES catalogo_roles(rol_trabajo_id)
);

CREATE TABLE IF NOT EXISTS planificacion_horaria (
    plan_id VARCHAR(50) PRIMARY KEY,
    empleado_id VARCHAR(50) NOT NULL,
    inicio_turno TIMESTAMP NOT NULL,
    fin_turno TIMESTAMP NOT NULL,
    estado_id INTEGER DEFAULT 1,
    creado_por VARCHAR(50),
    motivo_revision TEXT,
    FOREIGN KEY (empleado_id) REFERENCES empleados(empleado_id),
    FOREIGN KEY (estado_id) REFERENCES catalogo_estado(estado_id),
    FOREIGN KEY (creado_por) REFERENCES empleados(empleado_id)
);

CREATE TABLE IF NOT EXISTS registro_horas (
    registro_id VARCHAR(50) PRIMARY KEY,
    empleado_id VARCHAR(50) NOT NULL,
    inicio_trabajo TIMESTAMP NOT NULL,
    fin_trabajo TIMESTAMP,
    estado_id INTEGER DEFAULT 1,
    motivo_revision TEXT,
    FOREIGN KEY (empleado_id) REFERENCES empleados(empleado_id),
    FOREIGN KEY (estado_id) REFERENCES catalogo_estado(estado_id)
);

CREATE TABLE IF NOT EXISTS ausencias (
    ausencia_id VARCHAR(50) PRIMARY KEY,
    empleado_id VARCHAR(50) NOT NULL,
    tipo_ausencia_id VARCHAR(50) NOT NULL,
    inicio_ausencia TIMESTAMP NOT NULL,
    fin_ausencia TIMESTAMP NOT NULL,
    estado_id INTEGER DEFAULT 1,
    motivo_revision TEXT,
    FOREIGN KEY (empleado_id) REFERENCES empleados(empleado_id),
    FOREIGN KEY (tipo_ausencia_id) REFERENCES catalogo_ausencias(tipo_id),
    FOREIGN KEY (estado_id) REFERENCES catalogo_estado(estado_id)
);

CREATE TABLE IF NOT EXISTS solicitudes_cobertura (
    solicitud_id VARCHAR(50) PRIMARY KEY,
    empleado_id VARCHAR(50) NOT NULL,
    creado_por VARCHAR(50) NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente',
    motivo_rechazo TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (empleado_id) REFERENCES empleados(empleado_id),
    FOREIGN KEY (creado_por) REFERENCES empleados(empleado_id)
);

-- ============================================================
-- 5. FUNCIONES Y TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
