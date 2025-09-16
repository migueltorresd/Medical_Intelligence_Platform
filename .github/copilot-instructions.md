<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# 🏗️ NestJS Hexagonal Architecture - Copilot Instructions

## 📋 Contexto del Proyecto

Este es un proyecto de aprendizaje de **NestJS** que implementa **Arquitectura Hexagonal Modular** con TypeScript, siguiendo principios SOLID y Domain-Driven Design (DDD).

## 🏛️ Arquitectura del Proyecto

### Estructura Modular Hexagonal

```
src/
├── modules/                    # 🏛️ Módulos de dominio (bounded contexts)
│   └── user/                   # Contexto de usuarios
│       ├── domain/             # Core - Entidades y puertos
│       ├── application/        # Casos de uso y servicios
│       └── infrastructure/     # Adaptadores (HTTP, persistencia)
├── shared/                     # 🔄 Elementos compartidos globalmente
│   ├── auth/                   # Autenticación global
│   ├── guards/                 # Guards reutilizables
│   ├── persistencia/           # 🗄️ Configuración de BD compartida
│   └── [interceptors, filters, decorators, middlewares]
├── app.module.ts
└── main.ts
```

### Principios de Cada Capa

#### Domain Layer
- ✅ Lógica de negocio pura (sin frameworks)
- ✅ Entidades con comportamiento
- ✅ Puertos (interfaces) para servicios externos
- ❌ NO dependencies en NestJS, TypeORM, etc.

#### Application Layer  
- ✅ Casos de uso y orquestación
- ✅ Servicios de aplicación
- ✅ Usa puertos del dominio
- ❌ NO lógica de negocio (va en dominio)

#### Infrastructure Layer
- ✅ Adaptadores para frameworks
- ✅ Controllers, repositories, mappers
- ✅ Detalles técnicos específicos
- ❌ NO lógica de negocio

## 🎯 Instrucciones para Copilot

### Al Crear Nuevos Módulos
1. **Seguir estructura modular**: `modules/{contexto}/{domain,application,infrastructure}`
2. **Separar responsabilidades** por capa hexagonal
3. **Definir puertos** en domain antes de implementar adaptadores
4. **Usar inyección de dependencias** con tokens específicos

### Al Escribir Código de Dominio
- Crear entidades **ricas** con comportamiento, no solo datos
- Definir **puertos (interfaces)** para servicios externos
- **NO importar** decoradores de NestJS o TypeORM
- Usar **factory methods** para creación de entidades
- Incluir **validaciones de negocio** en las entidades

### Al Escribir Servicios de Aplicación
- **Coordinar** casos de uso, no implementar lógica de negocio
- **Inyectar puertos** usando tokens específicos (`@Inject(USER_REPOSITORY_PORT)`)
- **Manejar excepciones** específicas de NestJS
- **Usar DTOs** para entrada y mappers para salida

### Al Escribir Infraestructura
- **Implementar puertos** definidos en dominio
- **Separar por responsabilidad**: HTTP, persistencia, mappers
- **NO exponer** entidades de dominio directamente en APIs
- **Usar mappers** para transformar entre capas

### Patrones a Seguir

#### Repository Pattern
```typescript
// En domain/ports/
export interface UserRepositoryPort {
  create(user: User): Promise<User>;
}

// En infrastructure/persistence/
@Injectable()
export class UserRepositoryAdapter implements UserRepositoryPort {
  // Implementación con TypeORM
}
```

#### Mapper Pattern
```typescript
export class UserMapper {
  static toResponseDto(user: User): UserResponseDto {
    // Transformar dominio a DTO
  }
}
```

#### Factory Pattern
```typescript
export class User {
  static create(data: CreateUserData): User {
    // Lógica de creación y validación
  }
}
```

### Principios SOLID a Aplicar

1. **SRP**: Una clase, una responsabilidad
2. **OCP**: Extensible sin modificar código existente
3. **LSP**: Implementaciones intercambiables
4. **ISP**: Interfaces específicas y cohesivas  
5. **DIP**: Dependencias en abstracciones

### Elementos Compartidos en `/shared`
- **Solo elementos** verdaderamente transversales
- **Auth, guards, interceptors** globales
- **Configuración de BD** compartida
- **Decoradores y filters** reutilizables

### Convenciones de Naming
- **Entidades**: `User`, `Product`
- **Puertos**: `UserRepositoryPort`, `EmailServicePort`
- **Adaptadores**: `UserRepositoryAdapter`, `EmailServiceAdapter`
- **Servicios**: `UserService`, `ProductService`
- **Controllers**: `UserController`, `ProductController`
- **DTOs**: `CreateUserDto`, `UpdateUserDto`, `UserResponseDto`

### Testing Guidelines
- **Tests unitarios** para cada capa por separado
- **Mock puertos** en tests de servicios de aplicación
- **Tests de integración** para adaptadores
- **E2E tests** para flujos completos

### Error Handling
- **Excepciones de dominio** puras (sin NestJS)
- **Transformar a excepciones NestJS** en capa de aplicación
- **Manejo global** con filtros en shared

## ⚠️ Anti-patrones a Evitar

- ❌ **Anemic Domain Model**: Entidades solo con datos
- ❌ **Fat Controllers**: Lógica de negocio en controllers  
- ❌ **Shared Database**: Acceso directo entre módulos
- ❌ **God Objects**: Clases con múltiples responsabilidades
- ❌ **Circular Dependencies**: Entre módulos o capas

## 🔧 Tecnologías del Stack

- **Framework**: NestJS 11+
- **Lenguaje**: TypeScript con tipado estricto
- **Base de datos**: PostgreSQL con TypeORM
- **Autenticación**: JWT + Passport
- **Validación**: class-validator + class-transformer
- **Testing**: Jest + Supertest

## 📚 Documentación de Referencia

- [README.md](../README.md) - Guía principal
- [MODULAR-ARCHITECTURE.md](../MODULAR-ARCHITECTURE.md) - Documentación de arquitectura
- [docs/architecture-principles.md](../docs/architecture-principles.md) - Principios detallados
- [docs/configuration.md](../docs/configuration.md) - Configuración
- [docs/testing.md](../docs/testing.md) - Estrategias de testing
- [docs/deployment.md](../docs/deployment.md) - Guía de despliegue

---

**Objetivo**: Mantener una arquitectura limpia, escalable y mantenible siguiendo las mejores prácticas de desarrollo.
