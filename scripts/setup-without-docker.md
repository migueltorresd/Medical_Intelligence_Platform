# Setup sin Docker - Medical Intelligence Platform

## 🏥 Configuración Alternativa sin Docker

Si no tienes Docker disponible, puedes configurar la base de datos PostgreSQL de forma local o usar servicios en la nube.

## Opción 1: PostgreSQL Local (Windows)

### 1. Instalar PostgreSQL
1. Descargar desde: https://www.postgresql.org/download/windows/
2. Ejecutar el instalador
3. Configurar:
   - **Puerto:** 5432
   - **Usuario:** postgres
   - **Contraseña:** tu_contraseña_segura

### 2. Crear Base de Datos y Usuario
```sql
-- Conectarse como postgres y ejecutar:
CREATE DATABASE medical_intelligence_platform;
CREATE USER medical_admin WITH ENCRYPTED PASSWORD 'secure_medical_2024!';
GRANT ALL PRIVILEGES ON DATABASE medical_intelligence_platform TO medical_admin;
ALTER USER medical_admin CREATEDB;
```

### 3. Configurar Variables de Entorno
Editar `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=medical_admin
DB_PASSWORD=secure_medical_2024!
DB_DATABASE=medical_intelligence_platform
```

## Opción 2: Base de Datos en la Nube

### ElephantSQL (PostgreSQL Gratuito)
1. Registrarse en: https://www.elephantsql.com/
2. Crear instancia gratuita
3. Copiar URL de conexión
4. Configurar en `.env`:
```env
DB_HOST=raja.db.elephantsql.com
DB_PORT=5432
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_contraseña
DB_DATABASE=tu_database
```

### Supabase (PostgreSQL + Extras)
1. Registrarse en: https://supabase.com/
2. Crear proyecto nuevo
3. Obtener credenciales de base de datos
4. Configurar en `.env`

### Railway (PostgreSQL Simplificado)
1. Registrarse en: https://railway.app/
2. Crear servicio PostgreSQL
3. Copiar variables de conexión

## Opción 3: Compilar y Verificar Configuración

Aunque no tengas la base de datos ejecutándose, puedes compilar y verificar la configuración:

```bash
# Instalar dependencias
npm install

# Compilar aplicación
npm run build

# Ejecutar tests unitarios (no requieren BD)
npm run test
```

## Configurar Redis (Opcional)

### Redis Local
1. Descargar Redis para Windows: https://github.com/microsoftarchive/redis/releases
2. Extraer y ejecutar `redis-server.exe`
3. Por defecto usa puerto 6379

### Redis en la Nube
- **Upstash:** https://upstash.com/ (gratis)
- **Redis Cloud:** https://redis.com/redis-enterprise-cloud/

## Scripts de Desarrollo

Agregar a `package.json`:
```json
{
  "scripts": {
    "db:install": "echo 'Please install PostgreSQL manually'",
    "db:setup-local": "psql -U postgres -c \"CREATE DATABASE medical_intelligence_platform;\"",
    "db:create-user": "psql -U postgres -c \"CREATE USER medical_admin WITH ENCRYPTED PASSWORD 'secure_medical_2024!';\"",
    "start:without-db": "NODE_ENV=development npm run build && echo 'App compiled successfully - DB connection will be attempted'",
    "test:no-db": "jest --testPathIgnorePatterns=.*\\.integration\\.spec\\.ts",
    "health": "node -e \"console.log('Node.js:', process.version); console.log('Environment:', process.env.NODE_ENV || 'not set');\""
  }
}
```

## Verificar Setup sin Base de Datos

```bash
# 1. Verificar Node.js
node --version

# 2. Verificar dependencias
npm list

# 3. Compilar aplicación
npm run build

# 4. Ejecutar health check
npm run health

# 5. Verificar variables de entorno
node -e "require('dotenv').config(); console.log('DB_HOST:', process.env.DB_HOST);"
```

## Modo de Prueba con SQLite

Para pruebas rápidas, puedes usar SQLite temporalmente:

```bash
# Instalar SQLite
npm install sqlite3

# Configurar en .env.test
DB_TYPE=sqlite
DB_DATABASE=:memory:
DB_SYNCHRONIZE=true
```

## Próximos Pasos

1. **Con Base de Datos:** Configurar una de las opciones anteriores
2. **Sin Base de Datos:** Continuar desarrollo de lógica de negocio y tests unitarios
3. **Docker Disponible:** Usar la configuración Docker completa

## Soporte

- **PostgreSQL Local:** Documentación oficial de PostgreSQL
- **Servicios Cloud:** Documentación de cada proveedor
- **Problemas de Conexión:** Verificar firewall y credenciales