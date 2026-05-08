-- Migracion: etiquetas compartidas + cobertura linkeada a ausencia + horarios a cubrir
-- Ejecutar una vez sobre la BD existente.

-- 1. Etiquetas compartidas: el lider crea etiquetas que todos comparten
ALTER TABLE catalogo_etiquetas
    ADD COLUMN IF NOT EXISTS compartida BOOLEAN NOT NULL DEFAULT false;

-- 2. Cobertura linkeada directamente a la ausencia (evita duplicados por motivo)
ALTER TABLE solicitudes_cobertura
    ADD COLUMN IF NOT EXISTS ausencia_id VARCHAR(50);

-- FK opcional: si la ausencia se borra, la cobertura queda sin link pero se preserva el historial
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'solicitudes_cobertura_ausencia_id_fkey'
    ) THEN
        ALTER TABLE solicitudes_cobertura
            ADD CONSTRAINT solicitudes_cobertura_ausencia_id_fkey
            FOREIGN KEY (ausencia_id) REFERENCES ausencias(ausencia_id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Etiquetas (horarios) a cubrir: array de etiqueta_id que define que turnos cubrira el cubridor
ALTER TABLE solicitudes_cobertura
    ADD COLUMN IF NOT EXISTS etiquetas_cobertura JSON;
