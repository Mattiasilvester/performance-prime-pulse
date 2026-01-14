-- Aggiunta campo titolo_studio per professionisti
-- Data: 2025-01-20

ALTER TABLE professionals 
ADD COLUMN IF NOT EXISTS titolo_studio VARCHAR(255);

COMMENT ON COLUMN professionals.titolo_studio IS 'Titolo di studio del professionista (es: Laurea in Scienze Motorie)';

