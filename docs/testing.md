# 🧪 Estrategias de Testing

## Configuración de Testing

### Jest Configuration

El proyecto usa Jest como framework de testing con la siguiente configuración:

```javascript
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
```

## Tipos de Tests

### 1. Tests Unitarios

#### Testing de Entities (Dominio)

```typescript
// user.entity.spec.ts
describe('User Entity', () => {
  let user: User;

  beforeEach(() => {
    user = User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedPassword',
    });
  });

  it('should create a user with valid data', () => {
    expect(user).toBeDefined();
    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('john@example.com');
  });

  it('should activate user', () => {
    user.activate();
    expect(user.status).toBe(UserStatus.ACTIVE);
  });

  it('should deactivate user', () => {
    user.deactivate();
    expect(user.status).toBe(UserStatus.INACTIVE);
  });
});
```

#### Testing de Services (Aplicación)

```typescript
// user.service.spec.ts
describe('UserService', () => {
  let service: UserService;
  let mockRepository: jest.Mocked<UserRepositoryPort>;

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: USER_REPOSITORY_PORT,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    mockRepository = module.get(USER_REPOSITORY_PORT);
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const createUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: UserRole.USER,
      };

      const expectedUser = User.create({
        ...createUserDto,
        password: 'hashedPassword',
      });

      mockRepository.create.mockResolvedValue(expectedUser);

      const result = await service.createUser(createUserDto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: createUserDto.name,
          email: createUserDto.email,
        })
      );
      expect(result).toEqual(expectedUser);
    });

    it('should throw ConflictException when email exists', async () => {
      const createUserDto = {
        name: 'John Doe',
        email: 'existing@example.com',
        password: 'password123',
        role: UserRole.USER,
      };

      mockRepository.findByEmail.mockResolvedValue(
        User.create(createUserDto)
      );

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        ConflictException
      );
    });
  });
});
```

#### Testing de Controllers (Infraestructura)

```typescript
// user.controller.spec.ts
describe('UserController', () => {
  let controller: UserController;
  let service: jest.Mocked<UserService>;

  beforeEach(async () => {
    const mockService = {
      createUser: jest.fn(),
      getUserById: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      getAllUsers: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get(UserService);
  });

  describe('createUser', () => {
    it('should create a user and return response DTO', async () => {
      const createUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: UserRole.USER,
      };

      const user = User.create({
        ...createUserDto,
        password: 'hashedPassword',
      });

      service.createUser.mockResolvedValue(user);

      const result = await controller.createUser(createUserDto);

      expect(service.createUser).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(UserMapper.toResponseDto(user));
    });
  });
});
```

### 2. Tests de Integración

#### Testing de Repository (Infraestructura + BD)

```typescript
// user.repository.integration.spec.ts
describe('UserRepositoryAdapter Integration', () => {
  let repository: UserRepositoryAdapter;
  let typeOrmRepository: Repository<User>;
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([User]),
      ],
      providers: [UserRepositoryAdapter],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    repository = module.get<UserRepositoryAdapter>(UserRepositoryAdapter);
    typeOrmRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  beforeEach(async () => {
    await typeOrmRepository.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create and persist user', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedPassword',
      role: UserRole.USER,
    };

    const user = User.create(userData);
    const savedUser = await repository.create(user);

    expect(savedUser.id).toBeDefined();
    expect(savedUser.email).toBe(userData.email);

    const foundUser = await repository.findById(savedUser.id);
    expect(foundUser).toBeDefined();
    expect(foundUser.email).toBe(userData.email);
  });
});
```

### 3. Tests End-to-End (E2E)

```typescript
// users.e2e-spec.ts
describe('Users (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Configurar pipes y middlewares como en producción
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();

    // Obtener token JWT para tests autenticados
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'admin123',
      })
      .expect(200);

    jwtToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users (POST)', () => {
    it('should create a new user', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          role: 'user',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe('John Doe');
          expect(res.body.email).toBe('john@example.com');
          expect(res.body.password).toBeUndefined();
        });
    });

    it('should return 400 for invalid data', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          name: '',
          email: 'invalid-email',
        })
        .expect(400);
    });

    it('should return 401 without authorization', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        })
        .expect(401);
    });
  });

  describe('/users (GET)', () => {
    it('should return paginated users', () => {
      return request(app.getHttpServer())
        .get('/users?page=1&limit=10')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.meta).toBeDefined();
          expect(res.body.meta.page).toBe(1);
          expect(res.body.meta.limit).toBe(10);
        });
    });
  });
});
```

## Mocks y Test Doubles

### Mock de Repository

```typescript
export const createMockUserRepository = (): jest.Mocked<UserRepositoryPort> => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
});
```

### Factory de Test Data

```typescript
export class UserTestFactory {
  static createUser(overrides?: Partial<User>): User {
    return User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedPassword',
      role: UserRole.USER,
      ...overrides,
    });
  }

  static createAdmin(): User {
    return this.createUser({
      role: UserRole.ADMIN,
      email: 'admin@example.com',
    });
  }

  static createCreateUserDto(overrides?: Partial<CreateUserDto>): CreateUserDto {
    return {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: UserRole.USER,
      ...overrides,
    };
  }
}
```

## Configuración de Base de Datos para Tests

### SQLite en Memoria (Rápido)

```typescript
TypeOrmModule.forRoot({
  type: 'sqlite',
  database: ':memory:',
  entities: [User],
  synchronize: true,
  dropSchema: true,
})
```

### PostgreSQL Test Database

```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'test_user',
  password: 'test_password',
  database: 'nestjs_test_db',
  entities: [User],
  synchronize: true,
  dropSchema: true,
})
```

## Scripts de Testing

```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",
  "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
  "test:e2e": "jest --config ./test/jest-e2e.json",
  "test:unit": "jest --testPathPattern=src",
  "test:integration": "jest --testPathPattern=integration"
}
```

## Cobertura de Código

### Configuración de Coverage

```javascript
// jest.config.js
collectCoverageFrom: [
  'src/**/*.(t|j)s',
  '!src/**/*.spec.ts',
  '!src/**/*.interface.ts',
  '!src/main.ts',
  '!src/**/*.module.ts',
],
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
},
```

## Mejores Prácticas

### 1. Estructura de Tests
- Usa `describe` para agrupar tests relacionados
- Usa `beforeEach/afterEach` para setup/cleanup
- Mantén tests independientes entre sí

### 2. Naming
- Tests descriptivos: `should create user when valid data is provided`
- Usa AAA pattern: Arrange, Act, Assert

### 3. Mocking
- Mock solo dependencias externas
- Usa test doubles apropiados (mock, stub, spy)
- Evita over-mocking

### 4. Assertions
- Una assertion por test (idealmente)
- Usa matchers específicos de Jest
- Verifica tanto el resultado como las interacciones

### 5. Test Data
- Usa factories para crear datos de test
- Mantén datos mínimos pero válidos
- Evita hardcodear IDs o timestamps
