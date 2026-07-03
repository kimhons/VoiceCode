/**
 * IP Whitelist Service
 * Handles IP whitelisting for enhanced security
 */

import { getSupabaseService } from '../supabase.service';
import { getAuditService } from './audit.service';
import type { IPWhitelist } from './types';

class IPWhitelistService {
  async addIP(userId: string, ipAddress: string, description?: string): Promise<void> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) return;

      await client.from('ip_whitelist').insert({
        user_id: userId,
        ip_address: ipAddress,
        description,
        created_at: new Date().toISOString(),
      });

      const auditService = getAuditService();
      await auditService.logAudit(userId, 'settings.update', 'ip_whitelist', ipAddress, { action: 'add' });
    } catch (error) {
      console.error('Failed to add IP to whitelist:', error);
      throw error;
    }
  }

  async removeIP(userId: string, ipAddress: string): Promise<void> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) return;

      await client
        .from('ip_whitelist')
        .delete()
        .eq('user_id', userId)
        .eq('ip_address', ipAddress);

      const auditService = getAuditService();
      await auditService.logAudit(userId, 'settings.update', 'ip_whitelist', ipAddress, { action: 'remove' });
    } catch (error) {
      console.error('Failed to remove IP from whitelist:', error);
      throw error;
    }
  }

  async isWhitelisted(userId: string, ipAddress: string): Promise<boolean> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) return false;

      const { data, error } = await client
        .from('ip_whitelist')
        .select('*')
        .eq('user_id', userId)
        .eq('ip_address', ipAddress)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  }

  async getWhitelist(userId: string): Promise<IPWhitelist[]> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) return [];

      const { data, error } = await client
        .from('ip_whitelist')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as IPWhitelist[];
    } catch (error) {
      console.error('Failed to get IP whitelist:', error);
      return [];
    }
  }
}

let ipWhitelistInstance: IPWhitelistService | null = null;

export function getIPWhitelistService(): IPWhitelistService {
  if (!ipWhitelistInstance) {
    ipWhitelistInstance = new IPWhitelistService();
  }
  return ipWhitelistInstance;
}

export default IPWhitelistService;
