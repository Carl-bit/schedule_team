-- =============================================
-- 1. POBLANDO LOS CATÁLOGOS (Las reglas del juego)
-- =============================================
-- Estados del flujo de aprobación
INSERT INTO catalogo_estado (estado_id, estado)
VALUES (1, 'Generado / Pendiente'),
    (2, 'Aprobado'),
    (3, 'Solicitud de Corrección'),
    (4, 'Corregido / En Revisión'),
    (5, 'Rechazado') ON CONFLICT (estado_id) DO NOTHING;
-- Roles técnicos dentro de los proyectos
INSERT INTO catalogo_roles (rol_trabajo_id, rol_trabajo)
VALUES ('ROL_DEV', 'Desarrollador Full Stack'),
    ('ROL_LEAD', 'Líder Técnico'),
    ('ROL_QA', 'Tester / QA') ON CONFLICT (rol_trabajo_id) DO NOTHING;
-- Puestos de RRHH (Jerarquía de la empresa)
INSERT INTO catalogo_empleado (puesto_empleado_id, puesto_empleado)
VALUES ('PUESTO_JEFE', 'Jefe de Proyecto'),
    ('PUESTO_JR', 'Desarrollador Junior'),
    ('PUESTO_SSR', 'Desarrollador Semi-Senior') ON CONFLICT (puesto_empleado_id) DO NOTHING;
-- Tipos de Ausencias
INSERT INTO catalogo_ausencias (tipo_id, descripcion)
VALUES ('AUS_VAC', 'Vacaciones'),
    ('AUS_MED', 'Licencia Médica'),
    ('AUS_PER', 'Permiso Administrativo') ON CONFLICT (tipo_id) DO NOTHING;
-- =============================================
-- 2. CREANDO PERSONAS Y PROYECTOS (Los actores)
-- =============================================
-- El Jefe: Carlos
INSERT INTO empleados (
        empleado_id,
        nombre_empleado,
        correo_empleado,
        password_hash,
        puesto_empleado_id
    )
VALUES (
        'USER_BOSS',
        'Carlos',
        'carlos@empresa.com',
        'hash_secreto_123',
        'PUESTO_JEFE'
    ) ON CONFLICT (empleado_id) DO NOTHING;
-- La Empleada: Ana
INSERT INTO empleados (
        empleado_id,
        nombre_empleado,
        correo_empleado,
        password_hash,
        puesto_empleado_id
    )
VALUES (
        'USER_ANA',
        'Ana',
        'ana@empresa.com',
        'hash_secreto_456',
        'PUESTO_SSR'
    ) ON CONFLICT (empleado_id) DO NOTHING;
-- El Proyecto: Sistema de Horas
INSERT INTO proyectos (
        proyecto_id,
        nombre_proyecto,
        cliente,
        fecha_inicio,
        fecha_entrega
    )
VALUES (
        'PROY_001',
        'App Registro Horas',
        'Cliente Interno',
        '2025-01-01',
        '2025-06-30'
    ) ON CONFLICT (proyecto_id) DO NOTHING;
-- =============================================
-- 3. ASIGNACIONES (La conexión)
-- =============================================
-- Ana trabaja en el Proyecto 001 como Desarrolladora
INSERT INTO asignaciones (
        asignacion_id,
        empleado_id,
        proyecto_id,
        rol_trabajo_id
    )
VALUES ('ASIG_01', 'USER_ANA', 'PROY_001', 'ROL_DEV') ON CONFLICT (asignacion_id) DO NOTHING;
-- Carlos también está en el proyecto, pero como Líder
INSERT INTO asignaciones (
        asignacion_id,
        empleado_id,
        proyecto_id,
        rol_trabajo_id
    )
VALUES ('ASIG_02', 'USER_BOSS', 'PROY_001', 'ROL_LEAD') ON CONFLICT (asignacion_id) DO NOTHING;
-- =============================================
-- 4. SIMULACIÓN DE HORAS (La acción)
-- =============================================
-- Escenario 1: Ana trabajó ayer de 9 a 18 (Turno completo cerrado)
INSERT INTO registro_horas (
        registro_id,
        empleado_id,
        inicio_trabajo,
        fin_trabajo,
        estado_id
    )
VALUES (
        'REG_001',
        'USER_ANA',
        '2025-10-27 09:00:00',
        '2025-10-27 18:00:00',
        1
    ) ON CONFLICT (registro_id) DO NOTHING;
-- Escenario 2: Ana está trabajando HOY (Turno abierto)
INSERT INTO registro_horas (
        registro_id,
        empleado_id,
        inicio_trabajo,
        fin_trabajo,
        estado_id
    )
VALUES (
        'REG_002',
        'USER_ANA',
        CURRENT_TIMESTAMP,
        NULL,
        1
    ) ON CONFLICT (registro_id) DO NOTHING;