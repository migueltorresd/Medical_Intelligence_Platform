import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  
  private readonly encryptionKey: Buffer;

  constructor() {
    // En producción, esto debe venir de variables de entorno seguras
    const keyString = process.env.MEDICAL_ENCRYPTION_KEY;
    if (!keyString) {
      throw new Error('MEDICAL_ENCRYPTION_KEY environment variable is required');
    }
    
    // Derivar key usando PBKDF2 para mayor seguridad
    this.encryptionKey = crypto.pbkdf2Sync(
      keyString, 
      'medical-salt-2024', // En producción, usar salt aleatorio almacenado seguramente
      100000, // 100k iteraciones
      this.keyLength, 
      'sha512'
    );
  }

  /**
   * Cifra datos médicos sensibles (PHI/PII)
   * Usa AES-256-GCM para autenticación + cifrado
   */
  encrypt(plaintext: string): string {
    if (!plaintext) return plaintext;

    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
      cipher.setAAD(Buffer.from('medical-data-v1')); // Additional Authenticated Data
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Formato: iv:authTag:encryptedData
      return [
        iv.toString('hex'),
        authTag.toString('hex'),
        encrypted
      ].join(':');
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Descifra datos médicos
   */
  decrypt(encryptedData: string): string {
    if (!encryptedData || !encryptedData.includes(':')) return encryptedData;

    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const [ivHex, authTagHex, encrypted] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAAD(Buffer.from('medical-data-v1'));
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Hash seguro para identificadores (irreversible)
   * Usa SHA-256 con salt para datos como DNI, SSN
   */
  hash(data: string): string {
    if (!data) return data;
    
    const salt = 'medical-hash-salt-2024'; // En producción, usar salt único por institución
    const hash = crypto.createHash('sha256');
    hash.update(data + salt);
    return hash.digest('hex');
  }

  /**
   * Genera token seguro para sesiones médicas
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Verifica integridad de datos médicos
   */
  verifyIntegrity(data: string, expectedHash: string): boolean {
    const actualHash = crypto.createHash('sha256').update(data).digest('hex');
    return actualHash === expectedHash;
  }
}