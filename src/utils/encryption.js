import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const IV_LENGTH = 16; // Para AES, el IV es siempre de 16 bytes

class EncryptionService {
  constructor() {
    // Ruta donde guardaremos la clave (si no hay ENV)
    this.KEY_FILE = path.join(process.cwd(), '.encryption_key');
    this.ENCRYPTION_KEY = this.getEncryptionKey();
  }

  // Obtener la clave de encriptación (de ENV o archivo)
  getEncryptionKey() {
    // 1. Intentar obtener de variables de entorno
    if (process.env.ENCRYPTION_KEY) {
      return Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    }

    // 2. Intentar leer de archivo existente
    try {
      if (fs.existsSync(this.KEY_FILE)) {
        const keyHex = fs.readFileSync(this.KEY_FILE, 'utf8');
        return Buffer.from(keyHex, 'hex');
      }
    } catch (error) {
      console.warn('No se pudo leer el archivo de clave:', error.message);
    }

    // 3. Generar nueva clave y guardarla
    const newKey = crypto.randomBytes(32);
    try {
      fs.writeFileSync(this.KEY_FILE, newKey.toString('hex'), { mode: 0o600 }); // Permisos restringidos
      console.log('Nueva clave de encriptación generada y guardada');
    } catch (error) {
      console.warn('No se pudo guardar la nueva clave:', error.message);
    }

    return newKey;
  }

  // Encriptar JWT token
  encryptToken(token) {
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(
        'aes-256-cbc',
        this.ENCRYPTION_KEY,
        iv
      );

      let encrypted = cipher.update(token, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      throw new Error(`Error al encriptar token: ${error.message}`);
    }
  }

  // Desencriptar JWT token
  decryptToken(encryptedToken) {
    try {
      const [ivHex, encryptedText] = encryptedToken.split(':');
      const iv = Buffer.from(ivHex, 'hex');

      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        this.ENCRYPTION_KEY,
        iv
      );

      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Error al desencriptar token: ${error.message}`);
    }
  }

  // Generar hash para session ID
  generateSessionHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

export default new EncryptionService();
