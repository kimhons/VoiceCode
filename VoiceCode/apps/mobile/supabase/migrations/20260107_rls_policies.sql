-- Phase 3 Week 9 Day 57-58: Row Level Security Policies
-- Migration: Enable RLS and create policies for multi-tenant data isolation

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ORGANIZATIONS POLICIES
-- ============================================================================

-- Users can view organizations they are members of
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Organization owners and admins can update
CREATE POLICY "Owners and admins can update organizations"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- Only authenticated users can create organizations
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only owners can delete organizations
CREATE POLICY "Only owners can delete organizations"
  ON organizations FOR DELETE
  USING (
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND role = 'owner'
        AND status = 'active'
    )
  );

-- ============================================================================
-- WORKSPACES POLICIES
-- ============================================================================

-- Users can view workspaces they have access to
CREATE POLICY "Users can view their workspaces"
  ON workspaces FOR SELECT
  USING (
    id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
    OR organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- Organization admins and workspace admins can update workspaces
CREATE POLICY "Admins can update workspaces"
  ON workspaces FOR UPDATE
  USING (
    id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- Organization members can create workspaces
CREATE POLICY "Organization members can create workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Only organization owners and workspace admins can delete workspaces
CREATE POLICY "Admins can delete workspaces"
  ON workspaces FOR DELETE
  USING (
    id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND role = 'owner'
        AND status = 'active'
    )
  );

-- ============================================================================
-- ORGANIZATION MEMBERS POLICIES
-- ============================================================================

-- Users can view members of their organizations
CREATE POLICY "Users can view organization members"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Owners and admins can manage members
CREATE POLICY "Admins can manage organization members"
  ON organization_members FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- ============================================================================
-- WORKSPACE MEMBERS POLICIES
-- ============================================================================

-- Users can view workspace members
CREATE POLICY "Users can view workspace members"
  ON workspace_members FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Workspace admins can manage members
CREATE POLICY "Workspace admins can manage members"
  ON workspace_members FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- AUDIT LOGS POLICIES
-- ============================================================================

-- Users can view audit logs for their organizations
CREATE POLICY "Users can view organization audit logs"
  ON audit_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

