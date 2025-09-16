# 📐 Principios Arquitectónicos

## Arquitectura Hexagonal Modular

### Concepto Central

La **Arquitectura Hexagonal Modular** combina los beneficios de la arquitectura hexagonal (puertos y adaptadores) con la modularidad de Domain-Driven Design, donde cada contexto de dominio es un módulo independiente con su propia estructura hexagonal interna.

## Principios Fundamentales

### 1. Separación por Contextos de Dominio

Cada módulo representa un **contexto acotado** (bounded context) del dominio:

```
modules/
├── user/           # Contexto de gestión de usuarios
├── product/        # Contexto de productos (futuro)
├── order/          # Contexto de órdenes (futuro)
└── payment/        # Contexto de pagos (futuro)
```

### 2. Estructura Hexagonal por Módulo

Cada módulo sigue la arquitectura hexagonal:

```
modules/user/
├── domain/         # ⭕ Core - Reglas de negocio puras
├── application/    # 🔄 Casos de uso - Orquestación
└── infrastructure/ # 🔌 Adaptadores - Detalles técnicos
```

### 3. Elementos Compartidos Centralizados

Infraestructura común en `shared/`:

```
shared/
├── auth/           # Autenticación global
├── guards/         # Guards reutilizables
├── persistencia/   # Configuración de BD compartida
└── decorators/     # Decoradores comunes
```

## Capas de la Arquitectura

### Capa de Dominio (Domain)

**Propósito**: Contiene la lógica de negocio pura, independiente de frameworks.

**Componentes**:
- **Entidades**: Objetos con identidad y ciclo de vida
- **Puertos**: Interfaces que definen contratos
- **Value Objects**: Objetos inmutables sin identidad
- **Domain Services**: Lógica que no pertenece a una entidad específica

**Reglas**:
- ❌ No depende de capas externas
- ❌ No conoce frameworks (NestJS, TypeORM, etc.)
- ✅ Contiene reglas de negocio puras
- ✅ Define interfaces para servicios externos

```typescript
// ✅ Correcto - Entidad de dominio pura
export class User {
  private constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly email: string,
    private status: UserStatus,
  ) {}

  static create(data: CreateUserData): User {
    // Validaciones de negocio
    if (!data.email.includes('@')) {
      throw new Error('Email inválido');
    }
    return new User(generateId(), data.name, data.email, UserStatus.ACTIVE);
  }

  activate(): void {
    if (this.status === UserStatus.DELETED) {
      throw new Error('No se puede activar un usuario eliminado');
    }
    this.status = UserStatus.ACTIVE;
  }
}
```

### Capa de Aplicación (Application)

**Propósito**: Coordina casos de uso y orquesta la lógica de dominio.

**Componentes**:
- **Services**: Implementan casos de uso específicos
- **DTOs**: Objetos de transferencia de datos
- **Mappers**: Transforman datos entre capas

**Reglas**:
- ✅ Usa puertos del dominio para acceder a infraestructura
- ✅ Coordina múltiples entidades de dominio
- ✅ Maneja transacciones
- ❌ No contiene lógica de negocio (esa está en dominio)

```typescript
// ✅ Correcto - Servicio de aplicación
@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async createUser(data: CreateUserDto): Promise<User> {
    // Verificar unicidad (regla de aplicación)
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('Email ya existe');
    }

    // Crear usuario (lógica de dominio)
    const user = User.create({
      name: data.name,
      email: data.email,
      password: await this.hashPassword(data.password),
    });

    // Persistir (a través del puerto)
    return await this.userRepository.create(user);
  }
}
```

### Capa de Infraestructura (Infrastructure)

**Propósito**: Implementa adaptadores para servicios externos y frameworks.

**Componentes**:
- **HTTP**: Controllers, DTOs, Guards específicos del módulo
- **Persistence**: Implementaciones de repositorios
- **Mappers**: Transformaciones entre dominio e infraestructura

**Reglas**:
- ✅ Implementa puertos definidos en el dominio
- ✅ Contiene detalles técnicos específicos
- ✅ Puede depender de frameworks y librerías
- ❌ No contiene lógica de negocio

```typescript
// ✅ Correcto - Adaptador de repositorio
@Injectable()
export class UserRepositoryAdapter implements UserRepositoryPort {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async create(user: User): Promise<User> {
    const entity = this.repository.create(user);
    return await this.repository.save(entity);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.repository.findOne({ where: { email } });
  }
}
```

## Principios SOLID Aplicados

### Single Responsibility Principle (SRP)

Cada clase tiene una única razón para cambiar:

```typescript
// ❌ Incorrecto - Múltiples responsabilidades
class UserController {
  createUser() { /* lógica HTTP */ }
  validateEmail() { /* lógica de negocio */ }
  saveToDatabase() { /* lógica de persistencia */ }
}

// ✅ Correcto - Responsabilidades separadas
class UserController {
  createUser() { /* solo lógica HTTP */ }
}
class UserService {
  createUser() { /* solo casos de uso */ }
}
class UserRepository {
  save() { /* solo persistencia */ }
}
```

### Open/Closed Principle (OCP)

Abierto para extensión, cerrado para modificación:

```typescript
// ✅ Extensible sin modificar código existente
interface NotificationService {
  send(message: string): Promise<void>;
}

class EmailNotificationService implements NotificationService {
  async send(message: string): Promise<void> {
    // Implementación email
  }
}

class SMSNotificationService implements NotificationService {
  async send(message: string): Promise<void> {
    // Implementación SMS
  }
}
```

### Liskov Substitution Principle (LSP)

Las implementaciones deben ser intercambiables:

```typescript
// ✅ Cualquier implementación de UserRepositoryPort debe funcionar
class UserService {
  constructor(private userRepository: UserRepositoryPort) {}
  
  // Funciona con cualquier implementación:
  // - UserRepositoryAdapter (TypeORM)
  // - InMemoryUserRepository (testing)
  // - MongoUserRepository (futuro)
}
```

### Interface Segregation Principle (ISP)

Interfaces específicas y cohesivas:

```typescript
// ❌ Incorrecto - Interfaz demasiado amplia
interface UserRepository {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User>;
  create(user: User): Promise<User>;
  sendEmail(email: string): Promise<void>; // No pertenece aquí
}

// ✅ Correcto - Interfaces específicas
interface UserRepositoryPort {
  findById(id: string): Promise<User>;
  create(user: User): Promise<User>;
}

interface EmailService {
  send(email: string): Promise<void>;
}
```

### Dependency Inversion Principle (DIP)

Dependencias en abstracciones, no en concreciones:

```typescript
// ❌ Incorrecto - Depende de concreción
class UserService {
  private userRepository = new TypeOrmUserRepository(); // ❌ Acoplado
}

// ✅ Correcto - Depende de abstracción
class UserService {
  constructor(
    @Inject(USER_REPOSITORY_PORT) // ✅ Inyección de dependencia
    private readonly userRepository: UserRepositoryPort,
  ) {}
}
```

## Patrones Arquitectónicos

### Repository Pattern

```typescript
// Puerto (interfaz en dominio)
export interface UserRepositoryPort {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
}

// Adaptador (implementación en infraestructura)
@Injectable()
export class UserRepositoryAdapter implements UserRepositoryPort {
  // Implementación con TypeORM
}
```

### Mapper Pattern

```typescript
export class UserMapper {
  static toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      // No exponer password u otros datos sensibles
    };
  }

  static toDomain(entity: UserEntity): User {
    return User.create({
      id: entity.id,
      name: entity.name,
      email: entity.email,
      status: entity.status,
    });
  }
}
```

### Factory Pattern

```typescript
export class User {
  static create(data: CreateUserData): User {
    // Validaciones y lógica de creación
    const id = generateId();
    const hashedPassword = hashPassword(data.password);
    
    return new User(id, data.name, data.email, hashedPassword);
  }
}
```

## Ventajas de la Arquitectura

### Escalabilidad
- ✅ Agregar nuevos módulos sin afectar existentes
- ✅ Cada módulo puede evolucionar independientemente
- ✅ Teams pueden trabajar en paralelo

### Mantenibilidad
- ✅ Código organizado por contexto de dominio
- ✅ Dependencias claras y explícitas
- ✅ Fácil localización de funcionalidad

### Testabilidad
- ✅ Componentes aislados y mockeables
- ✅ Lógica de negocio independiente de frameworks
- ✅ Tests rápidos para el dominio

### Flexibilidad
- ✅ Cambiar implementaciones sin afectar lógica
- ✅ Adaptarse a nuevos requerimientos
- ✅ Integrar con sistemas externos

## Anti-patrones a Evitar

### Anemic Domain Model
```typescript
// ❌ Modelo anémico - solo datos
class User {
  public name: string;
  public email: string;
  public status: string;
}

// ✅ Modelo rico - datos + comportamiento
class User {
  activate(): void { /* lógica */ }
  deactivate(): void { /* lógica */ }
  changeEmail(newEmail: string): void { /* lógica */ }
}
```

### Fat Controllers
```typescript
// ❌ Controller con lógica de negocio
class UserController {
  async createUser(data: CreateUserDto) {
    // Validación de negocio en controller ❌
    if (!data.email.includes('@')) {
      throw new Error('Email inválido');
    }
    // Lógica de persistencia en controller ❌
    const user = this.repository.save(data);
    return user;
  }
}

// ✅ Controller delegando responsabilidades
class UserController {
  async createUser(data: CreateUserDto) {
    const user = await this.userService.createUser(data);
    return UserMapper.toResponseDto(user);
  }
}
```

### Shared Database
```typescript
// ❌ Acceso directo a entidades de otros módulos
class OrderService {
  async createOrder(userId: string) {
    const user = await this.userRepository.findById(userId); // ❌
  }
}

// ✅ Comunicación a través de servicios públicos
class OrderService {
  async createOrder(userId: string) {
    const user = await this.userService.getUserById(userId); // ✅
  }
}
```

## Evolución de la Arquitectura

### Agregando Nuevos Módulos

1. **Crear estructura**:
   ```
   modules/product/
   ├── domain/
   ├── application/
   └── infrastructure/
   ```

2. **Definir dominio**:
   - Entidades
   - Puertos
   - Value Objects

3. **Implementar aplicación**:
   - Services
   - DTOs

4. **Crear adaptadores**:
   - Controllers
   - Repositories
   - Mappers

### Refactoring Estratégico

- **Extraer servicios compartidos** a `shared/`
- **Dividir módulos grandes** en contextos más específicos
- **Crear bounded contexts** cuando la complejidad aumente
