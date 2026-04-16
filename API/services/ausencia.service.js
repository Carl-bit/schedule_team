const pool = require('../config/db');
const crypto = require('crypto');

// 1. Obtener todas las ausencias (con nombres legibles)
const getAusencias = async () => {
    const query = `
        SELECT 
            a.ausencia_id,
            a.empleado_id,
            e.nombre_empleado,
            a.tipo_ausencia_id,
            c.descripcion AS motivo,
            c.requiere_aprobacion,
            a.inicio_ausencia,
            a.fin_ausencia,
            a.estado_id,
            a.motivo_revision
        FROM ausencias a
        JOIN empleados e ON a.empleado_id = e.empleado_id
        JOIN catalogo_ausencias c ON a.tipo_ausencia_id = c.tipo_id
        ORDER BY a.inicio_ausencia DESC
    `;
    const result = await pool.query(query);
    return result.rows;
};

// 2. Obtener ausencias por empleado
const getAusenciasByEmpleado = async (empleado_id) => {
    const query = `
        SELECT 
            a.ausencia_id,
            a.empleado_id,
            a.tipo_ausencia_id,
            c.descripcion AS motivo,
            c.requiere_aprobacion,
            a.inicio_ausencia,
            a.fin_ausencia,
            a.estado_id,
            a.motivo_revision
        FROM ausencias a
        JOIN catalogo_ausencias c ON a.tipo_ausencia_id = c.tipo_id
        WHERE a.empleado_id = $1
        ORDER BY a.inicio_ausencia DESC
    `;
    const result = await pool.query(query, [empleado_id]);
    return result.rows;
};

// 3. Registrar una ausencia
const createAusencia = async (empleado_id, tipo_ausencia_id, inicio, fin) => {
    const id = crypto.randomUUID();

    // Verificar si requiere aprobación
    const tipoRes = await pool.query(
        'SELECT requiere_aprobacion FROM catalogo_ausencias WHERE tipo_id = $1',
        [tipo_ausencia_id]
    );
    // Si no requiere aprobación (ej: licencia médica), estado = 2 (aprobado automáticamente)
    const estado_id = (tipoRes.rows.length > 0 && !tipoRes.rows[0].requiere_aprobacion) ? 2 : 1;

    const query = `
        INSERT INTO ausencias (ausencia_id, empleado_id, tipo_ausencia_id, inicio_ausencia, fin_ausencia, estado_id) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *`;

    const values = [id, empleado_id, tipo_ausencia_id, inicio, fin, estado_id];
    const result = await pool.query(query, values);
    return result.rows[0];
};

// 4. Eliminar una ausencia (cancelar vacaciones)
const deleteAusencia = async (id) => {
    const query = 'DELETE FROM ausencias WHERE ausencia_id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

// 5. Actualizar estado de una ausencia (aprobar/rechazar/corregir)
const updateEstadoAusencia = async (ausencia_id, estado_id, motivo_revision = null) => {
    const query = 'UPDATE ausencias SET estado_id = $1, motivo_revision = $2 WHERE ausencia_id = $3 RETURNING *';
    const result = await pool.query(query, [estado_id, motivo_revision, ausencia_id]);
    return result.rows[0];
};

module.exports = {
    getAusencias,
    getAusenciasByEmpleado,
    createAusencia,
    deleteAusencia,
    updateEstadoAusencia
};