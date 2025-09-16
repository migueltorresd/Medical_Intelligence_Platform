import { Column, ColumnOptions } from 'typeorm';
import { EncryptionService } from './encryption.service';

// Instancia singleton del servicio de cifrado
let encryptionService: EncryptionService;

/**
 * Decorator para cifrado transparente de campos sensibles
 * Uso: @Encrypted() en propiedades que contienen PHI/PII
 */
export function Encrypted(options?: ColumnOptions): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    // Lazy initialization del servicio de cifrado
    if (!encryptionService) {
      try {
        encryptionService = new EncryptionService();
      } catch (error) {
        console.warn('EncryptionService not available:', error.message);
        // En desarrollo, puede no estar configurado
      }
    }

    const columnOptions: ColumnOptions = {
      type: 'text', // Usar text para datos cifrados (más largos)
      ...options,
      transformer: {
        to: (value: string) => {
          if (!value || !encryptionService) return value;
          try {
            return encryptionService.encrypt(value);
          } catch (error) {
            console.error('Encryption failed for field:', propertyKey, error);
            return value; // En caso de error, devolver sin cifrar (log del error)
          }
        },
        from: (value: string) => {
          if (!value || !encryptionService) return value;
          try {
            return encryptionService.decrypt(value);
          } catch (error) {
            console.error('Decryption failed for field:', propertyKey, error);
            return value; // En caso de error, devolver cifrado
          }
        }
      }
    };

    return Column(columnOptions)(target, propertyKey);
  };
}

/**
 * Decorator para hash irreversible de identificadores
 * Uso: @Hashed() en campos como DNI, SSN
 */
export function Hashed(options?: ColumnOptions): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    if (!encryptionService) {
      try {
        encryptionService = new EncryptionService();
      } catch (error) {
        console.warn('EncryptionService not available:', error.message);
      }
    }

    const columnOptions: ColumnOptions = {
      type: 'varchar',
      length: 64, // SHA-256 hash length
      ...options,
      transformer: {
        to: (value: string) => {
          if (!value || !encryptionService) return value;
          try {
            return encryptionService.hash(value);
          } catch (error) {
            console.error('Hashing failed for field:', propertyKey, error);
            return value;
          }
        },
        from: (value: string) => value // Los hashes no se pueden revertir
      }
    };

    return Column(columnOptions)(target, propertyKey);
  };
}

/**
 * Decorator para marcar campos con clasificación de datos
 * Uso: @DataClassification(DataClassification.PHI)
 */
export function DataClassification(classification: string): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    // Agregar metadata para compliance y auditoría
    Reflect.defineMetadata('data:classification', classification, target, propertyKey);
    
    // También podemos agregar a un registro global para compliance scanning
    if (!Reflect.hasMetadata('medical:classified-fields', target.constructor)) {
      Reflect.defineMetadata('medical:classified-fields', [], target.constructor);
    }
    
    const classifiedFields = Reflect.getMetadata('medical:classified-fields', target.constructor) || [];
    classifiedFields.push({
      field: propertyKey,
      classification,
      entity: target.constructor.name
    });
    
    Reflect.defineMetadata('medical:classified-fields', classifiedFields, target.constructor);
  };
}