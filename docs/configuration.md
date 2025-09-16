# 🔧 Guía de Configuración

## Variables de Entorno

### Base de Datos

```env
# Configuración de PostgreSQL
DB_HOST=localhost              # Host de la base de datos
DB_PORT=5432                   # Puerto de PostgreSQL
DB_USERNAME=nestjs_user        # Usuario de la base de datos
DB_PASSWORD=nestjs_password    # Contraseña del usuario
DB_DATABASE=nestjs_hexagonal_db # Nombre de la base de datos
```

### Autenticación JWT

```env
# Configuración de JSON Web Tokens
JWT_SECRET=your-super-secret-jwt-key    # Clave secreta para firmar tokens
JWT_EXPIRES_IN=1h                       # Tiempo de expiración de tokens
```

### Aplicación

```env
# Configuración general de la aplicación
NODE_ENV=development    # Entorno (development, production, test)
PORT=3000              # Puerto donde correrá la aplicación
```

## Configuración de Base de Datos

### Con Docker (Recomendado)

1. **Usar Docker Compose incluido:**
   ```bash
   npm run docker:up
   ```

2. **O ejecutar manualmente:**
   ```bash
   docker run --name nestjs-postgres \
     -e POSTGRES_USER=nestjs_user \
     -e POSTGRES_PASSWORD=nestjs_password \
     -e POSTGRES_DB=nestjs_hexagonal_db \
     -p 5432:5432 \
     -d postgres:15
   ```

### Instalación Local

1. **Instalar PostgreSQL:**
   - Windows: Descargar desde [postgresql.org](https://www.postgresql.org/download/windows/)
   - macOS: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql postgresql-contrib`

2. **Crear base de datos:**
   ```sql
   CREATE DATABASE nestjs_hexagonal_db;
   CREATE USER nestjs_user WITH PASSWORD 'nestjs_password';
   GRANT ALL PRIVILEGES ON DATABASE nestjs_hexagonal_db TO nestjs_user;
   ```

## Configuración de TypeORM

La configuración se encuentra en `src/shared/persistencia/database/database.config.ts`:

```typescript
export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'nestjs_user',
    password: process.env.DB_PASSWORD || 'nestjs_password',
    database: process.env.DB_DATABASE || 'nestjs_hexagonal_db',
    entities: [User],
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  }),
);
```

### Configuraciones por Entorno

#### Desarrollo
- `synchronize: true` - Sincroniza automáticamente el esquema
- `logging: ['query', 'error']` - Registra todas las consultas

#### Producción
- `synchronize: false` - Usar migraciones en su lugar
- `logging: ['error']` - Solo registra errores
- `ssl: { rejectUnauthorized: false }` - Configuración SSL

## Scripts de Package.json

### Base de Datos
```json
{
  "docker:up": "docker-compose up -d",
  "docker:down": "docker-compose down",
  "migration:generate": "typeorm migration:generate",
  "migration:run": "typeorm migration:run",
  "migration:revert": "typeorm migration:revert"
}
```

### Desarrollo
```json
{
  "start": "nest start",
  "start:dev": "nest start --watch",
  "start:debug": "nest start --debug --watch",
  "start:prod": "node dist/main"
}
```

### Testing
```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",
  "test:e2e": "jest --config ./test/jest-e2e.json"
}
```

## Configuración de JWT

### Generación de Secret Key

```bash
# Generar clave secreta segura
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Configuración en el Módulo

```typescript
JwtModule.registerAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    secret: configService.get('JWT_SECRET', 'super-secret-key'),
    signOptions: {
      expiresIn: configService.get('JWT_EXPIRES_IN', '1h'),
    },
  }),
  inject: [ConfigService],
})
```

## Configuración de Logging

### Middleware de Logging
Ubicado en `src/shared/middlewares/logger.middleware.ts`:

```typescript
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const userAgent = req.get('User-Agent') || '';
    
    res.on('close', () => {
      const { statusCode } = res;
      console.log(`${method} ${originalUrl} ${statusCode} - ${userAgent}`);
    });
    
    next();
  }
}
```

## Configuración de Validación

### Pipes Globales
En `main.ts`:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,                    // Elimina propiedades no definidas en DTOs
    forbidNonWhitelisted: true,         // Lanza error si hay propiedades no permitidas
    transform: true,                    // Transforma payloads a instancias de DTO
    disableErrorMessages: false,        // Habilita mensajes de error detallados
  }),
);
```

## Variables de Entorno por Archivo

### .env.development
```env
NODE_ENV=development
DB_HOST=localhost
JWT_SECRET=dev-secret-key
```

### .env.production
```env
NODE_ENV=production
DB_HOST=production-db-host
JWT_SECRET=production-super-secure-key
```

### .env.test
```env
NODE_ENV=test
DB_DATABASE=nestjs_test_db
JWT_SECRET=test-secret-key
```

## Configuración de CORS

En `main.ts`:

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
});
```

## Configuración de Swagger

```typescript
const config = new DocumentBuilder()
  .setTitle('NestJS Hexagonal API')
  .setDescription('API con arquitectura hexagonal modular')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api', app, document);
```
