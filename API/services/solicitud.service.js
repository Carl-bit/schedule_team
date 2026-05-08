const pool = require('../config/db');
const crypto = require('crypto');

// plan_id determinista. Formato: cob_<sol_id_sin_guiones>_<md5_corto> (max 50 chars).
// El prefijo cob_<sol_id> permite borrar TODOS los planes de una cobertura via LIKE,
// independiente del caso (etiquetas / transfer / fallback).
const planIdForCobertura = (solicitudId, payload) => {
    const sid = String(solicitudId).replace(/-/g, '');
    const short = crypto.createHash('md5').update(String(payload)).digest('hex').slice(0, 12);
    return `cob_${sid}_${short}`;
};

// Helpers: usamos la hora local de Node, que asume que el BD devuelve y recibe literales
// si el servidor de node y BD están en la misma máquina o usan el mismo TZ.
const fmtDate = (d) => {
    const x = d instanceof Date ? d : new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
const fmtHM = (d) => {
    const x = d instanceof Date ? d : new Date(d);
    return `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`;
};

// Normaliza etiquetas_cobertura a mapa { fecha: etiqueta_id[] }
const normalizarMapa = (etqs, fecha_inicio, fecha_fin) => {
    if (!etqs) return {};
    if (!Array.isArray(etqs)) return etqs; // ya es mapa fecha -> ids
    // legacy: array plano de ids -> aplica a todos los dias del rango
    const mapa = {};
    const cur = new Date(fecha_inicio);
    const fin = new Date(fecha_fin);
    while (cur.getTime() <= fin.getTime()) {
        const ds = fmtDate(cur);
        mapa[ds] = etqs;
        cur.setDate(cur.getDate() + 1);
    }
    return mapa;
};

const insertPlanSql = `
    INSERT INTO planificacion_horaria (plan_id, empleado_id, inicio_turno, fin_turno, estado_id, creado_por, etiqueta_id, solicitud_cobertura_id)
    VALUES ($1, $2, $3, $4, 2, $5, $6, $7)
    ON CONFLICT (plan_id) DO UPDATE
    SET empleado_id = EXCLUDED.empleado_id, inicio_turno = EXCLUDED.inicio_turno,
        fin_turno = EXCLUDED.fin_turno, estado_id = EXCLUDED.estado_id,
        etiqueta_id = EXCLUDED.etiqueta_id, solicitud_cobertura_id = EXCLUDED.solicitud_cobertura_id
`;

// Materializa la cobertura en planificacion_horaria del cubridor.
// Soporta 3 casos en orden de prioridad:
//   1. etiquetas_cobertura presentes -> bloque por (fecha, etiqueta) usando rango_horas
//   2. ausencia_id presente y titular tiene turnos en el rango -> transferir turnos del titular al cubridor
//   3. fallback -> bloque por dia con las horas crudas de fecha_inicio/fecha_fin
const materializarCobertura = async (client, sol) => {
    // ---- Caso 1: etiquetas_cobertura ----
    if (sol.etiquetas_cobertura) {
        const mapa = normalizarMapa(sol.etiquetas_cobertura, sol.fecha_inicio, sol.fecha_fin);
        const todosIds = [...new Set(Object.values(mapa).flat())];
        if (todosIds.length > 0) {
            const etqsRes = await client.query(
                'SELECT etiqueta_id, rango_horas FROM catalogo_etiquetas WHERE etiqueta_id = ANY($1::varchar[])',
                [todosIds]
            );
            const rangos = new Map(etqsRes.rows.map(r => [r.etiqueta_id, r.rango_horas]));

            let titularId = null;
            if (sol.ausencia_id) {
                const ausRes = await client.query('SELECT empleado_id FROM ausencias WHERE ausencia_id = $1', [sol.ausencia_id]);
                if (ausRes.rows[0]) titularId = ausRes.rows[0].empleado_id;
            }

            for (const [fecha, etiquetaIds] of Object.entries(mapa)) {
                for (const etId of etiquetaIds) {
                    const rango = rangos.get(etId);
                    if (!rango) continue;
                    const m = rango.match(/^(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})$/);
                    if (!m) continue;

                    const inicio = `${fecha} ${m[1]}:${m[2]}:00`;
                    // Si fin <= inicio, el turno cruza medianoche -> el fin va al dia siguiente
                    const inicioMin = parseInt(m[1]) * 60 + parseInt(m[2]);
                    const finMin = parseInt(m[3]) * 60 + parseInt(m[4]);
                    let fechaFinStr = fecha;
                    if (finMin <= inicioMin) {
                        const d = new Date(`${fecha}T00:00:00`);
                        d.setDate(d.getDate() + 1);
                        fechaFinStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    }
                    const fin = `${fechaFinStr} ${m[3]}:${m[4]}:00`;

                    if (titularId) {
                        await client.query(
                            'DELETE FROM planificacion_horaria WHERE empleado_id = $1 AND inicio_turno = $2 AND fin_turno = $3',
                            [titularId, inicio, fin]
                        );
                    }

                    const planId = planIdForCobertura(sol.solicitud_id, `et|${fecha}|${etId}`);
                    await client.query(insertPlanSql, [planId, sol.empleado_id, inicio, fin, sol.creado_por, etId, sol.solicitud_id]);
                }
            }
            return;
        }
    }

    // ---- Caso 2: transferir turnos del titular ausente ----
    if (sol.ausencia_id) {
        const ausRes = await client.query('SELECT empleado_id FROM ausencias WHERE ausencia_id = $1', [sol.ausencia_id]);
        const titularId = ausRes.rows[0]?.empleado_id;
        if (titularId) {
            const turnosRes = await client.query(
                `SELECT plan_id, inicio_turno, fin_turno FROM planificacion_horaria
                 WHERE empleado_id = $1 AND inicio_turno >= $2 AND fin_turno <= $3`,
                [titularId, sol.fecha_inicio, sol.fecha_fin]
            );
            if (turnosRes.rows.length > 0) {
                for (const t of turnosRes.rows) {
                    const fecha = fmtDate(t.inicio_turno);
                    const hi = fmtHM(t.inicio_turno);
                    const planId = planIdForCobertura(sol.solicitud_id, `tr|${fecha}|${hi}`);
                    await client.query('DELETE FROM planificacion_horaria WHERE plan_id = $1', [t.plan_id]);
                    await client.query(insertPlanSql, [planId, sol.empleado_id, t.inicio_turno, t.fin_turno, sol.creado_por, null, sol.solicitud_id]);
                }
                return;
            }
        }
    }

    // ---- Caso 3: fallback con fecha_inicio/fecha_fin ----
    const ini = new Date(sol.fecha_inicio);
    const fin = new Date(sol.fecha_fin);
    if (isNaN(ini.getTime()) || isNaN(fin.getTime())) return;

    // Comparacion de dia usando fechas locales
    const sameDay = ini.getFullYear() === fin.getFullYear()
        && ini.getMonth() === fin.getMonth()
        && ini.getDate() === fin.getDate();

    if (sameDay) {
        // En mismo día no usamos la hora para el id, porque es 'full'
        const fecha = fmtDate(ini);
        const planId = planIdForCobertura(sol.solicitud_id, `rg|${fecha}|full`);
        await client.query(insertPlanSql, [planId, sol.empleado_id, sol.fecha_inicio, sol.fecha_fin, sol.creado_por, null, sol.solicitud_id]);
        return;
    }

    // Multidia: usar las horas locales de Node (asumiendo que DB y Node comparten timezone)
    // Esto corrige el problema donde 00:00 en BD llega como T04:00:00Z.
    const hi = ini.getHours(), mi = ini.getMinutes();
    const hf = fin.getHours(), mf = fin.getMinutes();
    const sinHora = hi === 0 && mi === 0 && hf === 23 && mf === 59;
    const horaIniStr = `${String(hi).padStart(2, '0')}:${String(mi).padStart(2, '0')}:00`;
    const horaFinStr = sinHora ? '23:59:00' : `${String(hf).padStart(2, '0')}:${String(mf).padStart(2, '0')}:00`;

    // Si el rango horario diario cruza medianoche (fin <= inicio), el fin del bloque va al dia siguiente
    const iniMin = hi * 60 + mi;
    const finMin = sinHora ? 23 * 60 + 59 : hf * 60 + mf;
    const cruzaMedianoche = finMin <= iniMin;

    const cur = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate());
    const finDay = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate()).getTime();
    while (cur.getTime() <= finDay) {
        const fecha = fmtDate(cur);
        let fechaFinStr = fecha;
        if (cruzaMedianoche) {
            const next = new Date(cur);
            next.setDate(next.getDate() + 1);
            fechaFinStr = fmtDate(next);
        }
        const inicio = `${fecha} ${horaIniStr}`;
        const finBlock = `${fechaFinStr} ${horaFinStr}`;
        const planId = planIdForCobertura(sol.solicitud_id, `rg|${fecha}`);
        await client.query(insertPlanSql, [planId, sol.empleado_id, inicio, finBlock, sol.creado_por, null, sol.solicitud_id]);
        cur.setDate(cur.getDate() + 1);
    }
};

// Revierte los inserts hechos por materializarCobertura.
// Borra todo plan con prefijo cob_<sol_id>_ (cubre los 3 casos).
// No restituye los turnos del titular eliminados (el lider tendria que recrearlos manualmente).
const removerCobertura = async (client, sol) => {
    const sid = String(sol.solicitud_id).replace(/-/g, '');
    await client.query("DELETE FROM planificacion_horaria WHERE plan_id LIKE $1", [`cob_${sid}_%`]);
};

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
            s.created_at,
            s.ausencia_id,
            s.etiquetas_cobertura
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
            s.created_at,
            s.ausencia_id,
            s.etiquetas_cobertura
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
            s.created_at,
            s.ausencia_id,
            s.etiquetas_cobertura
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
const createSolicitud = async (empleado_id, creado_por, motivo, descripcion, fecha_inicio, fecha_fin, ausencia_id = null, etiquetas_cobertura = null) => {
    const id = crypto.randomUUID();
    const query = `
        INSERT INTO solicitudes_cobertura (solicitud_id, empleado_id, creado_por, motivo, descripcion, fecha_inicio, fecha_fin, ausencia_id, etiquetas_cobertura)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
    `;
    const result = await pool.query(query, [
        id, empleado_id, creado_por, motivo, descripcion, fecha_inicio, fecha_fin,
        ausencia_id, etiquetas_cobertura ? JSON.stringify(etiquetas_cobertura) : null,
    ]);
    return result.rows[0];
};

// 5. Actualizar estado (aceptar/rechazar) + materializar/revertir planificacion del cubridor
const updateEstadoSolicitud = async (solicitud_id, estado, motivo_rechazo = null) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const prevRes = await client.query('SELECT * FROM solicitudes_cobertura WHERE solicitud_id = $1', [solicitud_id]);
        const prev = prevRes.rows[0];
        if (!prev) {
            await client.query('ROLLBACK');
            return null;
        }

        const updRes = await client.query(
            `UPDATE solicitudes_cobertura SET estado = $1, motivo_rechazo = $2
             WHERE solicitud_id = $3 RETURNING *`,
            [estado, motivo_rechazo, solicitud_id]
        );
        const upd = updRes.rows[0];

        if (estado === 'aceptada' && prev.estado !== 'aceptada') {
            await materializarCobertura(client, upd);
        } else if (prev.estado === 'aceptada' && estado !== 'aceptada') {
            await removerCobertura(client, prev);
        }

        await client.query('COMMIT');
        return upd;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
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
    reasignarSolicitud,
    // exportadas para scripts de retrofit / mantenimiento
    materializarCobertura,
    removerCobertura
};
