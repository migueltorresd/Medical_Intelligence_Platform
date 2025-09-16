# 🏗️ NestJS Hexagonal Architecture - Modular Project

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## 📋 Descripción

Proyecto de aprendizaje de **NestJS** implementando **Arquitectura Hexagonal Modular** con TypeScript. Este proyecto demuestra las mejores prácticas de desarrollo siguiendo principios SOLID y Domain-Driven Design (DDD).

## 🏛️ Arquitectura

Este proyecto implementa una **arquitectura hexagonal modular** donde cada contexto de dominio es un módulo independiente con su propia estructura hexagonal interna.

### 📁 Estructura del Proyecto

```
src/
├── modules/                        # 🏛️ Módulos de dominio
│    └── user/                      # Contexto de usuarios
│         ├── domain/               # Core del negocio
│         ├── application/          # Casos de uso
│         └── infrastructure/       # Adaptadores
├── shared/                         # 🔄 Elementos compartidos
│     ├── auth/                     # Autenticación global
│     ├── guards/                   # Guards reutilizables
│     ├── interceptors/             # Interceptores globales
│     ├── filters/                  # Filtros de excepción
│     ├── decorators/               # Decoradores personalizados
│     ├── middlewares/              # Middlewares globales
│     └── persistencia/             # 🗄️ Infraestructura de BD compartida
│           └── database/           # Configuración TypeORM
├── app.module.ts                   # Módulo principal
└── main.ts                         # Punto de entrada
```

## 🚀 Características

- ✅ **Arquitectura Hexagonal Modular**
- ✅ **Principios SOLID** aplicados
- ✅ **Domain-Driven Design (DDD)**
- ✅ **TypeScript** con tipado estricto
- ✅ **PostgreSQL** con TypeORM
- ✅ **Autenticación JWT** con Passport
- ✅ **Validación** con class-validator
- ✅ **Guards y Interceptors** personalizados
- ✅ **Manejo global de excepciones**
- ✅ **Logging** estructurado
- ✅ **Docker** para base de datos

## 📦 Tecnologías

- **Framework**: NestJS 11+
- **Lenguaje**: TypeScript
- **Base de datos**: PostgreSQL
- **ORM**: TypeORM
- **Autenticación**: JWT + Passport
- **Validación**: class-validator + class-transformer
- **Contenedores**: Docker + Docker Compose

## ⚙️ Configuración del Proyecto

### Prerrequisitos

- Node.js (v18 o superior)
- npm o yarn
- Docker y Docker Compose
- PostgreSQL (si no usas Docker)

### 1. Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd nestjs-prueba

# Instalar dependencias
npm install
```

### 2. Variables de Entorno

Crear archivo `.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=nestjs_user
DB_PASSWORD=nestjs_password
DB_DATABASE=nestjs_hexagonal_db

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1h

# App
NODE_ENV=development
PORT=3000
```

### 3. Base de Datos

```bash
# Levantar PostgreSQL con Docker
npm run docker:up

# O si prefieres Docker Compose directo
docker-compose up -d postgres
```

## 🏃‍♂️ Ejecutar la Aplicación

```bash
# Desarrollo con watch mode
npm run start:dev

# Desarrollo
npm run start

# Producción
npm run start:prod

# Compilar
npm run build
```

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Cobertura
npm run test:cov

# Tests en modo watch
npm run test:watch
```

## 📚 API Endpoints

### Autenticación
- `POST /auth/login` - Iniciar sesión
- `POST /auth/register` - Registrar usuario

### Usuarios (requiere autenticación)
- `GET /users` - Listar usuarios (con paginación y filtros)
- `GET /users/:id` - Obtener usuario por ID
- `POST /users` - Crear usuario
- `PUT /users/:id` - Actualizar usuario
- `DELETE /users/:id` - Eliminar usuario

### Documentación API
Una vez ejecutando la aplicación, accede a:
- Swagger UI: `http://localhost:3000/api`
- Redoc: `http://localhost:3000/api-docs`

## 🏗️ Principios Arquitectónicos

### Arquitectura Hexagonal por Módulo
Cada módulo sigue la estructura hexagonal:
- **Domain**: Entidades y puertos (interfaces)
- **Application**: Servicios y casos de uso
- **Infrastructure**: Adaptadores (HTTP, persistencia, etc.)

### Principios SOLID
- **S**ingle Responsibility: Cada clase tiene una responsabilidad específica
- **O**pen/Closed: Extensible sin modificar código existente
- **L**iskov Substitution: Implementaciones intercambiables
- **I**nterface Segregation: Interfaces específicas por contexto
- **D**ependency Inversion: Dependencias en abstracciones

### Elementos Compartidos
- Guards de autenticación y autorización
- Interceptores para transformación de respuestas
- Filtros globales de excepción
- Decoradores personalizados
- Configuración de base de datos

## 📋 Scripts Disponibles

```bash
# Desarrollo
npm run start:dev          # Ejecutar en modo desarrollo
npm run start:debug        # Ejecutar con debugger

# Producción
npm run build              # Compilar proyecto
npm run start:prod         # Ejecutar en producción

# Base de datos
npm run docker:up          # Levantar PostgreSQL
npm run docker:down        # Parar contenedores

# Testing
npm run test               # Tests unitarios
npm run test:e2e          # Tests end-to-end
npm run test:cov          # Cobertura de tests

# Calidad de código
npm run lint              # Ejecutar ESLint
npm run format            # Formatear con Prettier
```

## 📖 Documentación Adicional

- [📐 Arquitectura Modular](./MODULAR-ARCHITECTURE.md) - Documentación detallada de la arquitectura
- [🔧 Configuración](./docs/configuration.md) - Guía de configuración
- [🧪 Testing](./docs/testing.md) - Estrategias de testing
- [🚀 Deployment](./docs/deployment.md) - Guía de despliegue

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add some amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

Proyecto de aprendizaje desarrollado como ejemplo de implementación de arquitectura hexagonal modular con NestJS.

---

⭐ Si este proyecto te resulta útil, ¡dale una estrella!
