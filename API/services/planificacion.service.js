const pool = require('../config/db');

// Obtener planificaciones por empleado
const getPlanificacionByEmpleado = async (empleado_id) => {
    const query = 'SELECT * FROM planificacion_horaria WHERE empleado_id = $1 ORDER BY inicio_turno ASC';
    const result = await pool.query(query, [empleado_id]);
    return result.rows;
};

// Crear una nueva planificación
const createPlanificacion = async (data) => {
    const { plan_id, empleado_id, inicio_turno, fin_turno, estado_id = 1 } = data;
    const query = `
        INSERT INTO planificacion_horaria (plan_id, empleado_id, inicio_turno, fin_turno, estado_id) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING *`;
    const values = [plan_id, empleado_id, inicio_turno, fin_turno, estado_id];
    const result = await pool.query(query, values);
    return result.rows[0];
};

// Eliminar una planificación (por ID)
const deletePlanificacion = async (plan_id) => {
    const query = 'DELETE FROM planificacion_horaria WHERE plan_id = $1 RETURNING *';
    const result = await pool.query(query, [plan_id]);
    return result.rows[0];
};

// Guardar múltiples planificaciones (transacción) para cuando el usuario manda la semana completa
const savePlanificacionesBulk = async (empleado_id, turnos) => {
    // turnos es un array: [{ plan_id, inicio_turno, fin_turno }]
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const resultados = [];
        for (const turno of turnos) {
            const query = `
                INSERT INTO planificacion_horaria (plan_id, empleado_id, inicio_turno, fin_turno, estado_id) 
                VALUES ($1, $2, $3, $4, $5) 
                ON CONFLICT (plan_id) DO UPDATE 
                SET inicio_turno = EXCLUDED.inicio_turno, fin_turno = EXCLUDED.fin_turno, estado_id = EXCLUDED.estado_id
                RETURNING *`;
            const values = [turno.plan_id, empleado_id, turno.inicio_turno, turno.fin_turno, turno.estado_id || 1];
            const res = await client.query(query, values);
            resultados.push(res.rows[0]);
        }

        await client.query('COMMIT');
        return resultados;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

module.exports = {
    getPlanificacionByEmpleado,
    createPlanificacion,
    deletePlanificacion,
    savePlanificacionesBulk
};
