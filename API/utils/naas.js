// API/utils/naas.js

const fs = require('fs');
const reasons = JSON.parse(fs.readFileSync('./utils/reasons.json', 'utf-8'));

const obtenerFraseAleatoria = () => {
    // Generamos un índice aleatorio basado en el largo del array
    const indice = Math.floor(Math.random() * reasons.length);

    // Retornamos la frase que está en ese índice
    return reasons[indice];
};

module.exports = { obtenerFraseAleatoria };