const express = require('express');
require('dotenv').config(); // 1. Configuración (siempre arriba)
const pool = require('./config/db');
const cors = require('cors');

const { obtenerFraseAleatoria } = require('./utils/naas/naas');
const app = express();
const port = 3000;

const empleadoRoutes = require('./routes/empleado.route');
const proyectoRoutes = require('./routes/proyecto.route');
const horaRoutes = require('./routes/hora.route');
const asignacionRoutes = require('./routes/asignaciones.route');
const catalogoRoutes = require('./routes/catalogo.route');
const ausenciaRoutes = require('./routes/ausencia.routes');
const authRoutes = require('./routes/auth.routes');
const planificacionRoutes = require('./routes/planificacion.route');
const etiquetaRoutes = require('./routes/etiqueta.route');
const solicitudRoutes = require('./routes/solicitud.route');

app.use(express.json()); // Middleware para entender JSON (importante para el futuro)

app.use(cors({
    origin: function (origin, callback) {
        // Permitir requests sin origin (server-to-server, como el rewrite de Next.js)
        if (!origin) return callback(null, true);
        const allowed = (process.env.CORS_ORIGIN || 'http://localhost:3001').split(',');
        if (allowed.includes('*') || allowed.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}));

// USAR RUTAS:
// Le decimos: "Todo lo que empiece con /api/empleados, manéjalo con empleadoRoutes"
app.use('/api/empleados', empleadoRoutes);
app.use('/api/proyectos', proyectoRoutes);
app.use('/api/hora', horaRoutes);
app.use('/api/asignaciones', asignacionRoutes);
app.use('/api/catalogos', catalogoRoutes);
app.use('/api/ausencias', ausenciaRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/planificacion', planificacionRoutes);
app.use('/api/etiquetas', etiquetaRoutes);
app.use('/api/solicitudes', solicitudRoutes);


app.get('/', async (req, res) => {
    try {
        // Le pedimos al "pool" que ejecute una consulta SQL simple
        const resultado = await pool.query('SELECT NOW()');

        // Si funciona, enviamos la hora que nos dio la base de datos
        res.json({
            mensaje: 'Tu no deberias estar aqui, pero al meno sabes que esto esta encendido',
            hora_servidor: resultado.rows[0].now
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: obtenerFraseAleatoria() });
    }
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});