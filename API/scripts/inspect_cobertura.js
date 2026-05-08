// Diagnostico: muestra que tiene la BD para una cobertura concreta.
// Uso:
//   node scripts/inspect_cobertura.js <empleado_id_cubridor>
//
// Imprime:
//   - Etiquetas compartidas del catalogo (rango_horas literal).
//   - Coberturas aceptadas del cubridor con su mapa etiquetas_cobertura.
//   - Planes en planificacion_horaria que pertenecen a esas coberturas.
//
// Sirve para confirmar si el desfase de horas es de catalogo, de
// solicitud o de la materializacion.

const pool = require('../config/db');

const empleadoId = process.argv[2];
if (!empleadoId) {
    console.error('Uso: node scripts/inspect_cobertura.js <empleado_id_cubridor>');
    process.exit(1);
}

const main = async () => {
    try {
        console.log('\n=== ETIQUETAS COMPARTIDAS (catalogo del lider) ===');
        const etqs = await pool.query(
            "SELECT etiqueta_id, nombre, rango_horas, color, tipo, compartida FROM catalogo_etiquetas WHERE compartida = true ORDER BY nombre"
        );
        if (etqs.rows.length === 0) console.log('(vacio)');
        etqs.rows.forEach(e => console.log(`  ${e.etiqueta_id.slice(0, 8)}…  "${e.nombre}"  rango_horas=[${e.rango_horas}]  tipo=${e.tipo}`));

        console.log(`\n=== COBERTURAS ACEPTADAS de empleado=${empleadoId} ===`);
        const cobs = await pool.query(
            "SELECT solicitud_id, motivo, fecha_inicio, fecha_fin, ausencia_id, etiquetas_cobertura FROM solicitudes_cobertura WHERE empleado_id = $1 AND estado = 'aceptada' ORDER BY created_at DESC",
            [empleadoId]
        );
        if (cobs.rows.length === 0) console.log('(ninguna)');
        for (const c of cobs.rows) {
            console.log(`\n  solicitud=${c.solicitud_id}`);
            console.log(`    motivo=${c.motivo}  ausencia_id=${c.ausencia_id || '-'}`);
            console.log(`    fecha_inicio (raw) = ${c.fecha_inicio?.toISOString?.() || c.fecha_inicio}`);
            console.log(`    fecha_fin    (raw) = ${c.fecha_fin?.toISOString?.() || c.fecha_fin}`);
            console.log(`    etiquetas_cobertura = ${JSON.stringify(c.etiquetas_cobertura)}`);

            const sid = String(c.solicitud_id).replace(/-/g, '');
            const planes = await pool.query(
                "SELECT plan_id, inicio_turno, fin_turno, etiqueta_id, estado_id FROM planificacion_horaria WHERE plan_id LIKE $1 ORDER BY inicio_turno ASC",
                [`cob_${sid}_%`]
            );
            console.log(`    planes materializados (${planes.rows.length}):`);
            planes.rows.forEach(p => {
                const etqMatch = etqs.rows.find(e => e.etiqueta_id === p.etiqueta_id);
                console.log(`      ${p.inicio_turno?.toISOString?.() || p.inicio_turno}  →  ${p.fin_turno?.toISOString?.() || p.fin_turno}   etiqueta=${etqMatch ? etqMatch.nombre + ' (' + etqMatch.rango_horas + ')' : (p.etiqueta_id || 'null')}`);
            });
        }
    } finally {
        await pool.end();
    }
};

main().catch(e => { console.error(e); process.exit(1); });
