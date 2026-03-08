const express = require('express');
const router = express.Router();
const EtiquetaController = require('../controllers/etiqueta.controller');

// Obtener todas las etiquetas de un empleado
router.get('/:empleado_id', EtiquetaController.getEtiquetas);

// Crear una nueva etiqueta
router.post('/', EtiquetaController.createEtiqueta);

// Actualizar una etiqueta
router.put('/:etiqueta_id', EtiquetaController.updateEtiqueta);

// Eliminar una etiqueta (requiere empleado_id via body o query)
router.delete('/:etiqueta_id', EtiquetaController.deleteEtiqueta);

module.exports = router;
