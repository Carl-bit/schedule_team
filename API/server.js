const express = require('express');
require('dotenv').config();
const pool = require('./config/db');
const cors = require('cors');
const { globalErrorHandler } = require('./middleware/errorHandler');

const app = express();
const port = 3000;

const empleadoRoutes = require('./routes/empleado.route');
const proyectoRoutes = require('./routes/proyecto.route');
const horaRoutes = require('./routes/hora.route');
const asignacionRoutes = require('./routes/asignaciones.route');
const catalogoRoutes = require('./routes/catalogo.route');
const ausenciaRoutes = require('./routes/ausencia.route');
const authRoutes = require('./routes/auth.route');
const planificacionRoutes = require('./routes/planificacion.route');
const etiquetaRoutes = require('./routes/etiqueta.route');
const solicitudRoutes = require('./routes/solicitud.route');

app.use(express.json());

app.use(cors({
    origin: function (origin, callback) {
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

// Rutas
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
        const resultado = await pool.query('SELECT NOW()');
        res.json({
            mensaje: 'Tu no deberias estar aqui, pero al menos sabes que esto esta encendido',
            hora_servidor: resultado.rows[0].now
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error de conexión a la base de datos' });
    }
});

// Error handler global (debe ir después de todas las rutas)
app.use(globalErrorHandler);

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
