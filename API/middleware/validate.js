const validate = (requiredFields) => (req, res, next) => {
    const missing = requiredFields.filter(f => req.body[f] === undefined || req.body[f] === null || req.body[f] === '');
    if (missing.length) {
        return res.status(400).json({ error: `Faltan campos: ${missing.join(', ')}` });
    }
    next();
};

module.exports = { validate };
