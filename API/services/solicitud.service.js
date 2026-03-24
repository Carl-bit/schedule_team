const pool = require('../config/db');
const crypto = require('crypto');

// 1. Obtener todas las solicitudes de cobertura (con nombres)
const getSolicitudes = async () => {
    const query = `
        SELECT 
            s.solicitud_id,
            s.empleado_id,
            e.nombre_empleado AS nombre_asignado,
            s.creado_por,
            l.nombre_empleado AS nombre_lider,
            s.motivo,
            s.descripcion,
            s.fecha_inicio,
            s.fecha_fin,
            s.estado,
            s.motivo_rechazo,
            s.created_at
        FROM solicitudes_cobertura s
        JOIN empleados e ON s.empleado_id = e.empleado_id
        JOIN empleados l ON s.creado_por = l.empleado_id
        ORDER BY s.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
};

// 2. Obtener solicitudes por empleado (trabajador asignado)
const getSolicitudesByEmpleado = async (empleado_id) => {
    const query = `
        SELECT 
            s.solicitud_id,
            s.empleado_id,
            e.nombre_empleado AS nombre_asignado,
            s.creado_por,
            l.nombre_empleado AS nombre_lider,
            s.motivo,
            s.descripcion,
            s.fecha_inicio,
            s.fecha_fin,
            s.estado,
            s.motivo_rechazo,
            s.created_at
        FROM solicitudes_cobertura s
        JOIN empleados e ON s.empleado_id = e.empleado_id
        JOIN empleados l ON s.creado_por = l.empleado_id
        WHERE s.empleado_id = $1
        ORDER BY s.created_at DESC
    `;
    const result = await pool.query(query, [empleado_id]);
    return result.rows;
};

// 3. Obtener solicitudes creadas por un líder
const getSolicitudesByLider = async (lider_id) => {
    const query = `
        SELECT 
            s.solicitud_id,
            s.empleado_id,
            e.nombre_empleado AS nombre_asignado,
            s.creado_por,
            l.nombre_empleado AS nombre_lider,
            s.motivo,
            s.descripcion,
            s.fecha_inicio,
            s.fecha_fin,
            s.estado,
            s.motivo_rechazo,
            s.created_at
        FROM solicitudes_cobertura s
        JOIN empleados e ON s.empleado_id = e.empleado_id
        JOIN empleados l ON s.creado_por = l.empleado_id
        WHERE s.creado_por = $1
        ORDER BY s.created_at DESC
    `;
    const result = await pool.query(query, [lider_id]);
    return result.rows;
};

// 4. Crear solicitud de cobertura
const createSolicitud = async (empleado_id, creado_por, motivo, descripcion, fecha_inicio, fecha_fin) => {
    const id = crypto.randomUUID();
    const query = `
        INSERT INTO solicitudes_cobertura (solicitud_id, empleado_id, creado_por, motivo, descripcion, fecha_inicio, fecha_fin)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `;
    const result = await pool.query(query, [id, empleado_id, creado_por, motivo, descripcion, fecha_inicio, fecha_fin]);
    return result.rows[0];
};

// 5. Actualizar estado (aceptar/rechazar)
const updateEstadoSolicitud = async (solicitud_id, estado, motivo_rechazo = null) => {
    const query = `
        UPDATE solicitudes_cobertura 
        SET estado = $1, motivo_rechazo = $2
        WHERE solicitud_id = $3
        RETURNING *
    `;
    const result = await pool.query(query, [estado, motivo_rechazo, solicitud_id]);
    return result.rows[0];
};

// 6. Reasignar solicitud rechazada a otro empleado
const reasignarSolicitud = async (solicitud_id, nuevo_empleado_id) => {
    const query = `
        UPDATE solicitudes_cobertura 
        SET empleado_id = $1, estado = 'pendiente', motivo_rechazo = NULL
        WHERE solicitud_id = $2
        RETURNING *
    `;
    const result = await pool.query(query, [nuevo_empleado_id, solicitud_id]);
    return result.rows[0];
};

module.exports = {
    getSolicitudes,
    getSolicitudesByEmpleado,
    getSolicitudesByLider,
    createSolicitud,
    updateEstadoSolicitud,
    reasignarSolicitud
};
