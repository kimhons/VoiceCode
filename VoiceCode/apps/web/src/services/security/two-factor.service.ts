/**
 * Two-Factor Authentication Service
 * Handles 2FA setup, verification, and management
 */

import { getSupabaseService } from '../supabase.service';
import { getEncryptionService } from './encryption.service';
import { getAuditService } from './audit.service';

class TwoFactorService {
  async enable2FA(
    userId: string,
    method: '2fa_totp' | '2fa_sms' | '2fa_email'
  ): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
    try {
      const encryptionService = getEncryptionService();
      const secret = encryptionService.generateSecret();
      const backupCodes = encryptionService.generateBackupCodes(10);

      const qrCode = method === '2fa_totp'
        ? `otpauth://totp/VoiceCode:${userId}?secret=${secret}&issuer=VoiceCode`
        : '';

      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      await client.from('two_factor_auth').upsert({
        user_id: userId,
        enabled: false,
        method,
        secret: encryptionService.encrypt(secret),
        backup_codes: backupCodes.map(code => encryptionService.encrypt(code)),
        created_at: new Date().toISOString(),
      });

      const auditService = getAuditService();
      await auditService.logAudit(userId, 'user.2fa_enable', 'two_factor_auth', userId, { method });

      return { secret, qrCode, backupCodes };
    } catch (error) {
      console.error('Failed to enable 2FA:', error);
      throw error;
    }
  }

  async verify2FA(userId: string, code: string): Promise<boolean> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      const { data, error } = await client
        .from('two_factor_auth')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) return false;

      const encryptionService = getEncryptionService();
      const secret = encryptionService.decrypt(data.secret);
      const isValid = encryptionService.verifyTOTP(secret, code);

      if (isValid) {
        await client
          .from('two_factor_auth')
          .update({
            enabled: true,
            verified_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      }

      return isValid;
    } catch (error) {
      console.error('Failed to verify 2FA:', error);
      return false;
    }
  }

  async disable2FA(userId: string, code: string): Promise<boolean> {
    try {
      const isValid = await this.verify2FA(userId, code);
      if (!isValid) return false;

      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      await client
        .from('two_factor_auth')
        .delete()
        .eq('user_id', userId);

      const auditService = getAuditService();
      await auditService.logAudit(userId, 'user.2fa_disable', 'two_factor_auth', userId);

      return true;
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
      return false;
    }
  }

  async is2FAEnabled(userId: string): Promise<boolean> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) return false;

      const { data, error } = await client
        .from('two_factor_auth')
        .select('enabled')
        .eq('user_id', userId)
        .single();

      return !error && data?.enabled === true;
    } catch {
      return false;
    }
  }
}

let twoFactorInstance: TwoFactorService | null = null;

export function getTwoFactorService(): TwoFactorService {
  if (!twoFactorInstance) {
    twoFactorInstance = new TwoFactorService();
  }
  return twoFactorInstance;
}

export default TwoFactorService;
