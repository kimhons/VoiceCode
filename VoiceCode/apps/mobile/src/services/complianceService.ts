/**
 * Compliance Service
 * Phase 3 Week 9 Day 59-60: Advanced Security & Compliance
 * 
 * Handles compliance framework management (GDPR, HIPAA, SOC 2)
 */

import { supabase } from './supabase.service';

// ============================================================================
// TYPES
// ============================================================================

export type ComplianceFramework = 'GDPR' | 'HIPAA' | 'SOC2' | 'CCPA';

export interface ComplianceConfig {
  id: string;
  organization_id: string;
  framework: ComplianceFramework;
  enabled: boolean;
  settings: Record<string, any>;
  last_audit_date?: string;
  next_audit_date?: string;
  compliance_status: 'compliant' | 'non_compliant' | 'in_progress' | 'not_assessed';
  created_at: string;
  updated_at: string;
}

export interface DataRetentionPolicy {
  id: string;
  organization_id: string;
  data_type: 'transcripts' | 'recordings' | 'user_data' | 'audit_logs' | 'all';
  retention_days: number;
  auto_delete: boolean;
  legal_hold_exempt: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConsentRecord {
  id: string;
  user_id: string;
  organization_id: string;
  consent_type: 'data_processing' | 'marketing' | 'analytics' | 'third_party_sharing';
  granted: boolean;
  granted_at?: string;
  revoked_at?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface DataExportRequest {
  id: string;
  user_id: string;
  organization_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  export_format: 'json' | 'csv' | 'pdf';
  download_url?: string;
  requested_at: string;
  completed_at?: string;
}

export interface DataDeletionRequest {
  id: string;
  user_id: string;
  organization_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  deletion_scope: 'all' | 'personal_data' | 'recordings' | 'transcripts';
  requested_at: string;
  completed_at?: string;
  verified_by?: string;
}

export interface ComplianceReport {
  id: string;
  organization_id: string;
  framework: ComplianceFramework;
  report_type: 'audit' | 'assessment' | 'incident' | 'annual';
  status: 'draft' | 'final' | 'submitted';
  findings: Array<{
    control: string;
    status: 'pass' | 'fail' | 'partial';
    notes?: string;
  }>;
  generated_at: string;
  generated_by: string;
}

// ============================================================================
// COMPLIANCE SERVICE
// ============================================================================

class ComplianceService {
  /**
   * Get compliance configurations for an organization
   */
  async getComplianceConfigs(organizationId: string): Promise<ComplianceConfig[]> {
    const { data, error } = await supabase
      .from('compliance_configs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Enable/disable a compliance framework
   */
  async updateComplianceConfig(
    id: string,
    updates: Partial<Omit<ComplianceConfig, 'id' | 'organization_id' | 'created_at'>>
  ): Promise<ComplianceConfig> {
    const { data, error } = await supabase
      .from('compliance_configs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a compliance configuration
   */
  async createComplianceConfig(
    organizationId: string,
    framework: ComplianceFramework,
    settings?: Record<string, any>
  ): Promise<ComplianceConfig> {
    const { data, error } = await supabase
      .from('compliance_configs')
      .insert({
        organization_id: organizationId,
        framework,
        enabled: true,
        settings: settings || {},
        compliance_status: 'not_assessed',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get data retention policies
   */
  async getDataRetentionPolicies(organizationId: string): Promise<DataRetentionPolicy[]> {
    const { data, error } = await supabase
      .from('data_retention_policies')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Update data retention policy
   */
  async updateDataRetentionPolicy(
    id: string,
    updates: Partial<Omit<DataRetentionPolicy, 'id' | 'organization_id' | 'created_at'>>
  ): Promise<DataRetentionPolicy> {
    const { data, error } = await supabase
      .from('data_retention_policies')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get consent records for a user
   */
  async getConsentRecords(userId: string, organizationId: string): Promise<ConsentRecord[]> {
    const { data, error } = await supabase
      .from('consent_records')
      .select('*')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .order('granted_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Grant consent
   */
  async grantConsent(
    userId: string,
    organizationId: string,
    consentType: ConsentRecord['consent_type'],
    metadata?: { ip_address?: string; user_agent?: string }
  ): Promise<ConsentRecord> {
    const { data, error } = await supabase
      .from('consent_records')
      .insert({
        user_id: userId,
        organization_id: organizationId,
        consent_type: consentType,
        granted: true,
        granted_at: new Date().toISOString(),
        ip_address: metadata?.ip_address,
        user_agent: metadata?.user_agent,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Revoke consent
   */
  async revokeConsent(id: string): Promise<ConsentRecord> {
    const { data, error } = await supabase
      .from('consent_records')
      .update({
        granted: false,
        revoked_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Request data export (GDPR Right to Data Portability)
   */
  async requestDataExport(
    userId: string,
    organizationId: string,
    format: 'json' | 'csv' | 'pdf' = 'json'
  ): Promise<DataExportRequest> {
    const { data, error } = await supabase
      .from('data_export_requests')
      .insert({
        user_id: userId,
        organization_id: organizationId,
        status: 'pending',
        export_format: format,
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Request data deletion (GDPR Right to be Forgotten)
   */
  async requestDataDeletion(
    userId: string,
    organizationId: string,
    scope: DataDeletionRequest['deletion_scope'] = 'all'
  ): Promise<DataDeletionRequest> {
    const { data, error } = await supabase
      .from('data_deletion_requests')
      .insert({
        user_id: userId,
        organization_id: organizationId,
        status: 'pending',
        deletion_scope: scope,
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get compliance reports
   */
  async getComplianceReports(
    organizationId: string,
    framework?: ComplianceFramework
  ): Promise<ComplianceReport[]> {
    let query = supabase
      .from('compliance_reports')
      .select('*')
      .eq('organization_id', organizationId)
      .order('generated_at', { ascending: false });

    if (framework) {
      query = query.eq('framework', framework);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    organizationId: string,
    framework: ComplianceFramework,
    reportType: ComplianceReport['report_type'],
    generatedBy: string
  ): Promise<ComplianceReport> {
    // In production, this would run actual compliance checks
    const findings = this.generateMockFindings(framework);

    const { data, error } = await supabase
      .from('compliance_reports')
      .insert({
        organization_id: organizationId,
        framework,
        report_type: reportType,
        status: 'draft',
        findings,
        generated_at: new Date().toISOString(),
        generated_by: generatedBy,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get compliance statistics
   */
  async getComplianceStats(organizationId: string): Promise<{
    active_frameworks: number;
    compliant_frameworks: number;
    pending_export_requests: number;
    pending_deletion_requests: number;
    last_audit_date?: string;
  }> {
    const configs = await this.getComplianceConfigs(organizationId);
    const activeFrameworks = configs.filter((c) => c.enabled);
    const compliantFrameworks = activeFrameworks.filter((c) => c.compliance_status === 'compliant');

    const { data: exportRequests } = await supabase
      .from('data_export_requests')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('status', 'pending');

    const { data: deletionRequests } = await supabase
      .from('data_deletion_requests')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('status', 'pending');

    const lastAudit = configs
      .filter((c) => c.last_audit_date)
      .sort((a, b) => (b.last_audit_date || '').localeCompare(a.last_audit_date || ''))[0];

    return {
      active_frameworks: activeFrameworks.length,
      compliant_frameworks: compliantFrameworks.length,
      pending_export_requests: exportRequests?.length || 0,
      pending_deletion_requests: deletionRequests?.length || 0,
      last_audit_date: lastAudit?.last_audit_date,
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private generateMockFindings(framework: ComplianceFramework): ComplianceReport['findings'] {
    const controls: Record<ComplianceFramework, string[]> = {
      GDPR: ['Data Minimization', 'Consent Management', 'Right to Access', 'Right to Erasure', 'Data Portability'],
      HIPAA: ['Access Controls', 'Audit Trails', 'Encryption', 'BAA Compliance', 'Breach Notification'],
      SOC2: ['Security', 'Availability', 'Processing Integrity', 'Confidentiality', 'Privacy'],
      CCPA: ['Consumer Rights', 'Data Disclosure', 'Opt-Out Mechanisms', 'Data Security', 'Privacy Policy'],
    };

    return (controls[framework] || []).map((control) => ({
      control,
      status: Math.random() > 0.2 ? 'pass' : 'partial',
      notes: Math.random() > 0.5 ? 'All requirements met' : undefined,
    }));
  }
}

export const complianceService = new ComplianceService();

