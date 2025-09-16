-- Script de inicialización de la base de datos
-- Se ejecuta automáticamente cuando se crea el contenedor de PostgreSQL

-- Crear extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Crear índices adicionales si es necesario
-- (Se pueden agregar más configuraciones aquí)

-- Mensaje de confirmación
SELECT 'Database initialized successfully!' as status;
