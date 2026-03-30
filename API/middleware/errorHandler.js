const { obtenerFraseAleatoria } = require('../utils/naas/naas');

class AppError extends Error {
    constructor(mensaje, status = 400) {
        super(mensaje);
        this.status = status;
    }
}

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const globalErrorHandler = (err, req, res, next) => {
    console.error(err);

    if (err instanceof AppError) {
        return res.status(err.status).json({ error: err.message });
    }

    if (err.code === '23505') {
        return res.status(400).json({
            error: "Ya existe un registro con esos datos.",
            frase: obtenerFraseAleatoria()
        });
    }

    if (err.code === '23503') {
        return res.status(400).json({
            error: "No se puede completar: existen registros relacionados.",
            frase: obtenerFraseAleatoria()
        });
    }

    res.status(500).json({ error: obtenerFraseAleatoria() });
};

module.exports = { AppError, asyncHandler, globalErrorHandler };
