// Retrofit: materializa en planificacion_horaria las coberturas ya aceptadas
// que no quedaron persistidas (caso anterior al fix del service).
//
// Uso:
//   node scripts/retrofit_coberturas.js <empleado_id>             materializa (idempotente)
//   node scripts/retrofit_coberturas.js --all                     todos los cubridores
//   node scripts/retrofit_coberturas.js --reapply <empleado_id>   borra y vuelve a materializar
//   node scripts/retrofit_coberturas.js --clean <empleado_id>     solo borra (sin re-aplicar)
//   node scripts/retrofit_coberturas.js --dry-run <empleado_id>   simulacion (rollback)
//
// Idempotente: usa plan_id deterministas (cob_<sol_id>_<hash>).

const pool = require('../config/db');
const { materializarCobertura } = require('../services/solicitud.service');

const arg = process.argv.slice(2);
const dryRun = arg.includes('--dry-run');
const all = arg.includes('--all');
const reapply = arg.includes('--reapply');
const cleanOnly = arg.includes('--clean');
const empleadoId = arg.find(a => !a.startsWith('--'));

if (!all && !empleadoId) {
    console.error('Uso: node scripts/retrofit_coberturas.js <empleado_id> | --all  [--reapply | --clean | --dry-run]');
    process.exit(1);
}

const main = async () => {
    const client = await pool.connect();
    try {
        const params = all ? [] : [empleadoId];
        const where = all ? "estado = 'aceptada'" : "estado = 'aceptada' AND empleado_id = $1";
        const { rows: solicitudes } = await client.query(
            `SELECT * FROM solicitudes_cobertura WHERE ${where} ORDER BY created_at ASC`,
            params
        );

        if (solicitudes.length === 0) {
            console.log(all
                ? 'No hay coberturas aceptadas en el sistema.'
                : `No hay coberturas aceptadas para el empleado ${empleadoId}.`);
            return;
        }

        console.log(`Encontradas ${solicitudes.length} coberturas aceptadas para procesar.`);

        for (const sol of solicitudes) {
            const caso = sol.etiquetas_cobertura
                ? 'etiquetas'
                : sol.ausencia_id
                    ? 'transfer/fallback'
                    : 'fallback (rango crudo)';
            const sid = String(sol.solicitud_id).replace(/-/g, '');
            console.log(`\n→ solicitud_id=${sol.solicitud_id}  cubridor=${sol.empleado_id}  ausencia=${sol.ausencia_id || '-'}  caso=${caso}`);

            await client.query('BEGIN');
            try {
                if (reapply || cleanOnly) {
                    const del = await client.query(
                        "DELETE FROM planificacion_horaria WHERE plan_id LIKE $1 RETURNING plan_id",
                        [`cob_${sid}_%`]
                    );
                    console.log(`  - borrados ${del.rowCount} plan(es) previos`);
                }

                if (!cleanOnly) {
                    const before = await client.query(
                        "SELECT COUNT(*)::int AS n FROM planificacion_horaria WHERE plan_id LIKE $1",
                        [`cob_${sid}_%`]
                    );
                    await materializarCobertura(client, sol);
                    const after = await client.query(
                        "SELECT COUNT(*)::int AS n FROM planificacion_horaria WHERE plan_id LIKE $1",
                        [`cob_${sid}_%`]
                    );
                    const delta = after.rows[0].n - before.rows[0].n;
                    console.log(`  + ${after.rows[0].n} plan(es) ahora (delta +${delta})`);
                }

                if (dryRun) {
                    await client.query('ROLLBACK');
                    console.log('  ✓ (dry-run) cambios revertidos');
                } else {
                    await client.query('COMMIT');
                    console.log('  ✓ commit');
                }
            } catch (e) {
                await client.query('ROLLBACK');
                console.error('  ✗ error:', e.message);
            }
        }

        console.log('\nRetrofit terminado.');
    } finally {
        client.release();
        await pool.end();
    }
};

main().catch(e => {
    console.error('Error fatal:', e);
    process.exit(1);
});
