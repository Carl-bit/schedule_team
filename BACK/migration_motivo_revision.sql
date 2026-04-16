-- Agregar campo motivo_revision a las tablas que manejan estados de aprobacion
ALTER TABLE planificacion_horaria ADD COLUMN IF NOT EXISTS motivo_revision TEXT;
ALTER TABLE registro_horas ADD COLUMN IF NOT EXISTS motivo_revision TEXT;
ALTER TABLE ausencias ADD COLUMN IF NOT EXISTS motivo_revision TEXT;
