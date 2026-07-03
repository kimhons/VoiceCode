-- Phase 3 Week 9 Day 57-58: Multi-Tenant Architecture
-- Migration: Create organizations, workspaces, and RBAC tables with RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  industry VARCHAR(100),
  size VARCHAR(50), -- 'small', 'medium', 'large', 'enterprise'
  
  -- Billing
  subscription_tier VARCHAR(50) DEFAULT 'free', -- 'free', 'pro', 'business', 'enterprise'
  subscription_status VARCHAR(50) DEFAULT 'active', -- 'active', 'cancelled', 'suspended'
  billing_email VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  
  -- Settings
  settings JSONB DEFAULT '{}',
  features JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$')
);

-- ============================================================================
-- WORKSPACES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Isolation Settings
  data_isolation_level VARCHAR(50) DEFAULT 'strict', -- 'strict', 'moderate', 'open'
  allow_cross_workspace_sharing BOOLEAN DEFAULT FALSE,
  
  -- Resource Limits
  max_storage_gb INTEGER DEFAULT 10,
  max_users INTEGER DEFAULT 10,
  max_transcripts INTEGER,
  
  -- Settings
  settings JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(organization_id, slug),
  CONSTRAINT valid_workspace_slug CHECK (slug ~ '^[a-z0-9-]+$')
);

-- ============================================================================
-- ORGANIZATION ROLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS organization_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]',
  is_system_role BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, name)
);

-- ============================================================================
-- ORGANIZATION MEMBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES organization_roles(id),
  role VARCHAR(50) DEFAULT 'member', -- 'owner', 'admin', 'member', 'guest'
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'invited', 'suspended'
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, user_id)
);

-- ============================================================================
-- WORKSPACE MEMBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- 'admin', 'member', 'viewer'
  
  -- Permissions
  can_create BOOLEAN DEFAULT TRUE,
  can_edit BOOLEAN DEFAULT TRUE,
  can_delete BOOLEAN DEFAULT FALSE,
  can_share BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id),
  
  UNIQUE(workspace_id, user_id)
);

-- ============================================================================
-- AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  
  -- Event Details
  event_type VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'access', 'share'
  resource_type VARCHAR(100) NOT NULL, -- 'organization', 'workspace', 'transcript', etc.
  resource_id UUID,
  action VARCHAR(255) NOT NULL,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_workspace ON audit_logs(workspace_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type, created_at DESC);

