import { Transform } from 'class-transformer';

/**
 * Decorator for automatic encryption/decryption of entity fields
 * This is a placeholder implementation for demonstration purposes.
 * In production, you would implement actual encryption/decryption logic
 * that integrates with TypeORM transformers and the EncryptionService.
 */
export function Encrypted() {
  return function (target: any, propertyName: string) {
    // In a real implementation, this would:
    // 1. Register the field for automatic encryption before saving to database
    // 2. Register the field for automatic decryption when loading from database
    // 3. Integrate with TypeORM transformers to handle the encryption/decryption
    
    // For now, we'll use a simple Transform decorator that doesn't actually encrypt
    // but marks the field as encrypted for type safety and future implementation
    Transform(({ value }) => value, { toClassOnly: true })(target, propertyName);
    Transform(({ value }) => value, { toPlainOnly: true })(target, propertyName);
    
    // Store metadata about encrypted fields for future use
    const existingEncryptedFields = Reflect.getMetadata('encrypted:fields', target.constructor) || [];
    existingEncryptedFields.push(propertyName);
    Reflect.defineMetadata('encrypted:fields', existingEncryptedFields, target.constructor);
  };
}

/**
 * Helper function to get encrypted fields from an entity class
 */
export function getEncryptedFields(entityClass: any): string[] {
  return Reflect.getMetadata('encrypted:fields', entityClass) || [];
}

/**
 * Helper function to check if a field is encrypted
 */
export function isFieldEncrypted(entityClass: any, fieldName: string): boolean {
  const encryptedFields = getEncryptedFields(entityClass);
  return encryptedFields.includes(fieldName);
}