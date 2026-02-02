// API/utils/naas.js

const frases = [
    "No.",
    "Ni lo sueñes.",
    "Error 404: Ganas de trabajar no encontradas.",
    "Pregúntale a otro.",
    "Hoy no, mañana tal vez.",
    "Mi respuesta es un rotundo NO.",
    "Sigue intentando... en otro lado.",
    "No tengo ganas de hacer eso.",
    "Déjame en paz.",
    "No me importa.",
    "No quiero hacerlo.",
    "No puedo hacerlo.",
    "No voy a hacerlo.",
    "No lo sé.",
    "No lo haré.",
    "No lo haré hoy.",
    "No lo haré mañana.",
    "No lo haré pasado mañana.",
    "No lo haré pasado mañana.",

    // ¡Agrega aquí más frases si quieres!
];

const obtenerFraseAleatoria = () => {
    // Generamos un índice aleatorio basado en el largo del array
    const indice = Math.floor(Math.random() * frases.length);

    // Retornamos la frase que está en ese índice
    return frases[indice];
};

module.exports = { obtenerFraseAleatoria };