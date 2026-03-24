const pool = require('../config/db');
const crypto = require('crypto');

// 1. LEER ASIGNACIONES (Con nombres reales, no solo IDs)
const getAsignaciones = async () => {
    const query = `
        SELECT 
            a.asignacion_id,
            a.empleado_id,
            e.nombre_empleado,
            p.proyecto_id,
            p.nombre_proyecto,
            p.cliente,
            p.fecha_inicio,
            p.fecha_entrega,
            r.rol_trabajo
        FROM asignaciones a
        JOIN empleados e ON a.empleado_id = e.empleado_id
        JOIN proyectos p ON a.proyecto_id = p.proyecto_id
        JOIN catalogo_roles r ON a.rol_trabajo_id = r.rol_trabajo_id
    `;
    const result = await pool.query(query);
    return result.rows;
};

// 2. CREAR ASIGNACIÓN
const createAsignacion = async (empleado_id, proyecto_id, rol_id) => {
    const id = crypto.randomUUID();

    const query = `
        INSERT INTO asignaciones (asignacion_id, empleado_id, proyecto_id, rol_trabajo_id) 
        VALUES ($1, $2, $3, $4) 
        RETURNING *`;

    const values = [id, empleado_id, proyecto_id, rol_id];
    const result = await pool.query(query, values);
    return result.rows[0];
};

// 3. ELIMINAR ASIGNACIÓN (Sacar a alguien del proyecto)
const deleteAsignacion = async (id) => {
    const query = 'DELETE FROM asignaciones WHERE asignacion_id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

// 4. ACTUALIZAR ROL DE ASIGNACIÓN
const updateAsignacion = async (id, rol_trabajo_id) => {
    const query = `
        UPDATE asignaciones
        SET rol_trabajo_id = $1
        WHERE asignacion_id = $2
        RETURNING *`;
    const result = await pool.query(query, [rol_trabajo_id, id]);
    return result.rows[0];
};

module.exports = {
    getAsignaciones,
    createAsignacion,
    deleteAsignacion,
    updateAsignacion
};