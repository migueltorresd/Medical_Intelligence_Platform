# Medical Intelligence Platform - Database Setup

## 🏥 Configuración de Base de Datos PostgreSQL con Docker

Esta guía te ayudará a configurar la base de datos PostgreSQL para la Medical Intelligence Platform usando Docker.

## 📋 Prerrequisitos

- **Docker Desktop** instalado y ejecutándose
- **Node.js** 18+ instalado
- **npm** o **yarn**
- Puerto **5432** disponible (PostgreSQL)
- Puerto **8080** disponible (pgAdmin)
- Puerto **6379** disponible (Redis)

## 🚀 Inicio Rápido

### 1. Iniciar Docker Desktop
Asegúrate de que Docker Desktop esté ejecutándose en tu sistema.

### 2. Levantar los servicios con Docker Compose
```bash
# Levantar base de datos, pgAdmin y Redis
docker-compose up -d

# Verificar que los contenedores estén ejecutándose
docker-compose ps

# Ver logs en tiempo real (opcional)
docker-compose logs -f
```

### 3. Verificar la conexión de base de datos
```bash
# Instalar dependencias si no lo has hecho
npm install

# Compilar la aplicación
npm run build

# Iniciar la aplicación en modo desarrollo
npm run start:dev
```

## 🗄️ Servicios Incluidos

### PostgreSQL Database
- **Host:** localhost
- **Puerto:** 5432
- **Base de datos:** `medical_intelligence_platform`
- **Usuario:** `medical_admin`
- **Contraseña:** `secure_medical_2024!`

### pgAdmin (Administrador de BD)
- **URL:** http://localhost:8080
- **Email:** admin@medical-platform.com
- **Contraseña:** `admin_secure_2024!`

### Redis (Cache)
- **Host:** localhost
- **Puerto:** 6379
- **Contraseña:** `redis_secure_2024!`

## ⚙️ Configuración de la Aplicación

### Variables de Entorno
Las variables están configuradas en el archivo `.env`:

```env
# Database Configuration - PostgreSQL
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=medical_admin
DB_PASSWORD=secure_medical_2024!
DB_DATABASE=medical_intelligence_platform
DB_SYNCHRONIZE=true
DB_LOGGING=true

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_secure_2024!
REDIS_DB=0
```

## 🏗️ Estructura de Base de Datos

### Esquemas Creados
- **medical_data:** Datos médicos principales
- **audit_logs:** Registros de auditoría para compliance
- **compliance:** Datos de cumplimiento normativo

### Extensiones Habilitadas
- **uuid-ossp:** Generación de UUIDs
- **pgcrypto:** Funciones de cifrado

### Tipos Personalizados
- `medical_role_enum`
- `patient_status_enum` 
- `gender_enum`
- `blood_type_enum`
- `insurance_type_enum`

### Funciones Personalizadas
- `generate_mrn()` - Generación de números de registro médico
- `audit_trigger_function()` - Auditoría automática de cambios
- `update_updated_at_column()` - Actualización automática de timestamps

## 📊 Acceso a pgAdmin

1. Abrir http://localhost:8080 en el navegador
2. Iniciar sesión con las credenciales mencionadas
3. Agregar servidor PostgreSQL:
   - **Host:** `medical_platform_db` (nombre del contenedor)
   - **Puerto:** 5432
   - **Base de datos:** `medical_intelligence_platform`
   - **Usuario:** `medical_admin`
   - **Contraseña:** `secure_medical_2024!`

## 🔧 Comandos Útiles

### Gestión de Docker
```bash
# Detener todos los servicios
docker-compose down

# Reiniciar servicios
docker-compose restart

# Ver logs de un servicio específico
docker-compose logs postgres
docker-compose logs pgadmin
docker-compose logs redis

# Eliminar volúmenes (¡CUIDADO! Elimina todos los datos)
docker-compose down -v

# Reconstruir imágenes
docker-compose up -d --build
```

### Gestión de Base de Datos
```bash
# Conectarse directamente a PostgreSQL
docker exec -it medical_platform_db psql -U medical_admin -d medical_intelligence_platform

# Backup de la base de datos
docker exec -t medical_platform_db pg_dumpall -c -U medical_admin > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
docker exec -i medical_platform_db psql -U medical_admin -d medical_intelligence_platform < backup_file.sql
```

### Scripts de Aplicación
```bash
# Instalar dependencias
npm install

# Compilar aplicación
npm run build

# Ejecutar en modo desarrollo
npm run start:dev

# Ejecutar en modo producción
npm run start:prod

# Ejecutar tests
npm run test

# Ver documentación Swagger
# http://localhost:3000/api-docs
```

## 🔐 Seguridad y Compliance

### Características de Seguridad
- **Cifrado automático** de campos PHI/PII
- **Auditoría completa** de todos los cambios
- **Multi-tenancy** por institución médica
- **Control de acceso** basado en roles médicos
- **Conexiones seguras** con credenciales robustas

### Compliance Médico
- **HIPAA** - Auditoría y cifrado de datos médicos
- **GDPR** - Derecho al olvido y portabilidad de datos
- **Retención de datos** configurable (7 años por defecto)
- **Logs de acceso** inmutables

## 🩺 Entidades Médicas

### User (Usuarios del Sistema)
- Roles médicos múltiples
- Multi-tenancy por institución
- Campos de auditoría completos

### Patient (Pacientes)
- **46+ campos médicos** especializados
- **Cifrado automático** de datos sensibles
- **Generación automática** de MRN
- **Consentimientos** HIPAA/GDPR
- **Soft delete** con validaciones

## 🐛 Solución de Problemas

### Docker no está ejecutándose
```bash
# Windows - Iniciar Docker Desktop manualmente
# O usar el comando:
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# Verificar que Docker esté ejecutándose
docker info
```

### Puerto ya en uso
```bash
# Ver qué proceso usa el puerto 5432
netstat -ano | findstr :5432

# Cambiar puerto en docker-compose.yml si es necesario
```

### Problemas de conexión
```bash
# Verificar que los contenedores estén ejecutándose
docker-compose ps

# Verificar logs para errores
docker-compose logs postgres

# Reiniciar servicios
docker-compose restart
```

### Problemas de permisos
```bash
# En Windows, ejecutar PowerShell como administrador
# Verificar permisos de carpeta Docker

# Limpiar volúmenes y reiniciar
docker-compose down -v
docker-compose up -d
```

## 📚 Recursos Adicionales

- [Documentación TypeORM](https://typeorm.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [NestJS Database](https://docs.nestjs.com/techniques/database)

## 🆘 Soporte

Si encuentras problemas:

1. **Verifica prerrequisitos** - Docker, Node.js, puertos
2. **Revisa logs** - `docker-compose logs`
3. **Reinicia servicios** - `docker-compose restart`
4. **Limpia volúmenes** - `docker-compose down -v` (⚠️ elimina datos)

---

🏥 **Medical Intelligence Platform** - Plataforma médica con compliance HIPAA/GDPR