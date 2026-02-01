const pool = require('../config/db');
const bcrypt = require('bcrypt');

const runMigration = async () => {
    console.log('🔄 Iniciando migración de contraseñas...');

    try {
        // 1. Obtener todos los empleados
        const { rows: empleados } = await pool.query('SELECT * FROM empleados');
        console.log(`👥 Se encontraron ${empleados.length} empleados para procesar.`);

        // 2. Recorrer uno por uno
        for (const empleado of empleados) {
            const passwordActual = empleado.password_hash;

            // Pequeña validación: Si ya parece un hash de bcrypt (empieza con $2b$), lo saltamos
            if (passwordActual.startsWith('$2b$')) {
                console.log(`⏩ El usuario ${empleado.nombre_empleado} ya tiene contraseña segura. Saltando...`);
                continue;
            }

            // 3. Crear el Hash (El nivel 10 es el estándar de fuerza)
            const nuevoHash = await bcrypt.hash(passwordActual, 10);

            // 4. Actualizar en la BD
            await pool.query('UPDATE empleados SET password_hash = $1 WHERE empleado_id = $2', [
                nuevoHash,
                empleado.empleado_id
            ]);

            console.log(`✅ Contraseña actualizada para: ${empleado.nombre_empleado}`);
        }

        console.log('🏁 ¡Migración completada con éxito!');

    } catch (error) {
        console.error('❌ Error en la migración:', error);
    }
};

runMigration();