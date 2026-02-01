const pool = require('./config/db');
const express = require('express');
const app = express();
const port = 3000;

/**
 * 
 *   Conexiones a las rutasS
 * 
 */
const empleadoRoutes = require('./routes/empleado.route');

app.use(express.json()); // Middleware para entender JSON (importante para el futuro)

// USAR RUTAS:
// Le decimos: "Todo lo que empiece con /api/empleados, manéjalo con empleadoRoutes"
app.use('/api/empleados', empleadoRoutes);

// 2. USAR: Vamos a crear una ruta de prueba que consulte la hora a la base de datos
app.get('/prueba-db', async (req, res) => {
    try {
        // Le pedimos al "pool" que ejecute una consulta SQL simple
        const resultado = await pool.query('SELECT NOW()');

        // Si funciona, enviamos la hora que nos dio la base de datos
        res.json({
            mensaje: '¡Conexión exitosa! 🎉',
            hora_servidor: resultado.rows[0].now
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Algo salió mal con la conexión' });
    }
});




app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});