-- Migracion: trazabilidad de cobertura en planificacion_horaria
-- Permite distinguir turnos que vienen de una cobertura aceptada y mapearlos
-- a la etiqueta del catalogo que el lider eligio (caso 1).

ALTER TABLE planificacion_horaria
    ADD COLUMN IF NOT EXISTS etiqueta_id VARCHAR(50),
    ADD COLUMN IF NOT EXISTS solicitud_cobertura_id VARCHAR(50);

-- FK opcional a catalogo_etiquetas (si la etiqueta se borra, el plan queda sin link)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'planificacion_horaria_etiqueta_id_fkey'
    ) THEN
        ALTER TABLE planificacion_horaria
            ADD CONSTRAINT planificacion_horaria_etiqueta_id_fkey
            FOREIGN KEY (etiqueta_id) REFERENCES catalogo_etiquetas(etiqueta_id) ON DELETE SET NULL;
    END IF;
END $$;

-- FK opcional a solicitudes_cobertura (si la solicitud se borra, el plan queda sin link)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'planificacion_horaria_solicitud_cobertura_id_fkey'
    ) THEN
        ALTER TABLE planificacion_horaria
            ADD CONSTRAINT planificacion_horaria_solicitud_cobertura_id_fkey
            FOREIGN KEY (solicitud_cobertura_id) REFERENCES solicitudes_cobertura(solicitud_id) ON DELETE SET NULL;
    END IF;
END $$;
