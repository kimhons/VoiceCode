/**
 * Automation Redux Slice
 * Phase 3 Week 10 Day 68-69: Intelligent Automation
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  getAutomationService,
  Workflow,
  WorkflowExecution,
  TriggerTemplate,
  ActionTemplate,
  WorkflowTemplate,
} from '../../services/automationService';

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface AutomationState {
  workflows: Workflow[];
  activeWorkflow: Workflow | null;
  triggers: TriggerTemplate[];
  actions: ActionTemplate[];
  templates: WorkflowTemplate[];
  executionStatus: WorkflowExecution | null;
  loading: boolean;
  error: string | null;
}

const initialState: AutomationState = {
  workflows: [],
  activeWorkflow: null,
  triggers: [],
  actions: [],
  templates: [],
  executionStatus: null,
  loading: false,
  error: null,
};

// ============================================================================
// ASYNC THUNKS
// ============================================================================

export const fetchWorkflows = createAsyncThunk(
  'automation/fetchWorkflows',
  async (userId: string) => {
    const service = getAutomationService();
    return await service.getWorkflows(userId);
  }
);

export const fetchWorkflow = createAsyncThunk(
  'automation/fetchWorkflow',
  async (workflowId: string) => {
    const service = getAutomationService();
    return await service.getWorkflow(workflowId);
  }
);

export const createWorkflow = createAsyncThunk(
  'automation/createWorkflow',
  async (workflow: Omit<Workflow, 'id' | 'created_at' | 'updated_at'>) => {
    const service = getAutomationService();
    return await service.createWorkflow(workflow);
  }
);

export const updateWorkflow = createAsyncThunk(
  'automation/updateWorkflow',
  async ({ workflowId, updates }: { workflowId: string; updates: Partial<Workflow> }) => {
    const service = getAutomationService();
    return await service.updateWorkflow(workflowId, updates);
  }
);

export const deleteWorkflow = createAsyncThunk(
  'automation/deleteWorkflow',
  async (workflowId: string) => {
    const service = getAutomationService();
    await service.deleteWorkflow(workflowId);
    return workflowId;
  }
);

export const toggleWorkflow = createAsyncThunk(
  'automation/toggleWorkflow',
  async ({ workflowId, enabled }: { workflowId: string; enabled: boolean }) => {
    const service = getAutomationService();
    return await service.toggleWorkflow(workflowId, enabled);
  }
);

export const executeWorkflow = createAsyncThunk(
  'automation/executeWorkflow',
  async ({ workflowId, context }: { workflowId: string; context?: Record<string, any> }) => {
    const service = getAutomationService();
    return await service.executeWorkflow(workflowId, context);
  }
);

export const fetchTriggers = createAsyncThunk(
  'automation/fetchTriggers',
  async () => {
    const service = getAutomationService();
    return await service.getTriggerTemplates();
  }
);

export const fetchActions = createAsyncThunk(
  'automation/fetchActions',
  async () => {
    const service = getAutomationService();
    return await service.getActionTemplates();
  }
);

export const fetchTemplates = createAsyncThunk(
  'automation/fetchTemplates',
  async () => {
    const service = getAutomationService();
    return await service.getWorkflowTemplates();
  }
);

export const createFromTemplate = createAsyncThunk(
  'automation/createFromTemplate',
  async ({ templateId, userId }: { templateId: string; userId: string }) => {
    const service = getAutomationService();
    return await service.createWorkflowFromTemplate(templateId, userId);
  }
);

// ============================================================================
// SLICE
// ============================================================================

const automationSlice = createSlice({
  name: 'automation',
  initialState,
  reducers: {
    setActiveWorkflow: (state, action: PayloadAction<Workflow | null>) => {
      state.activeWorkflow = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearExecutionStatus: (state) => {
      state.executionStatus = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Workflows
    builder.addCase(fetchWorkflows.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchWorkflows.fulfilled, (state, action) => {
      state.loading = false;
      state.workflows = action.payload;
    });
    builder.addCase(fetchWorkflows.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch workflows';
    });

    // Fetch Workflow
    builder.addCase(fetchWorkflow.fulfilled, (state, action) => {
      state.activeWorkflow = action.payload;
    });

    // Create Workflow
    builder.addCase(createWorkflow.fulfilled, (state, action) => {
      state.workflows.push(action.payload);
      state.activeWorkflow = action.payload;
    });

    // Update Workflow
    builder.addCase(updateWorkflow.fulfilled, (state, action) => {
      const index = state.workflows.findIndex(w => w.id === action.payload.id);
      if (index !== -1) {
        state.workflows[index] = action.payload;
      }
      if (state.activeWorkflow?.id === action.payload.id) {
        state.activeWorkflow = action.payload;
      }
    });

    // Delete Workflow
    builder.addCase(deleteWorkflow.fulfilled, (state, action) => {
      state.workflows = state.workflows.filter(w => w.id !== action.payload);
      if (state.activeWorkflow?.id === action.payload) {
        state.activeWorkflow = null;
      }
    });

    // Toggle Workflow
    builder.addCase(toggleWorkflow.fulfilled, (state, action) => {
      const index = state.workflows.findIndex(w => w.id === action.payload.id);
      if (index !== -1) {
        state.workflows[index] = action.payload;
      }
    });

    // Execute Workflow
    builder.addCase(executeWorkflow.pending, (state) => {
      state.loading = true;
      state.executionStatus = null;
    });
    builder.addCase(executeWorkflow.fulfilled, (state, action) => {
      state.loading = false;
      state.executionStatus = action.payload;
    });
    builder.addCase(executeWorkflow.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to execute workflow';
    });

    // Fetch Triggers
    builder.addCase(fetchTriggers.fulfilled, (state, action) => {
      state.triggers = action.payload;
    });

    // Fetch Actions
    builder.addCase(fetchActions.fulfilled, (state, action) => {
      state.actions = action.payload;
    });

    // Fetch Templates
    builder.addCase(fetchTemplates.fulfilled, (state, action) => {
      state.templates = action.payload;
    });

    // Create from Template
    builder.addCase(createFromTemplate.fulfilled, (state, action) => {
      state.workflows.push(action.payload);
      state.activeWorkflow = action.payload;
    });
  },
});

export const { setActiveWorkflow, clearError, clearExecutionStatus } = automationSlice.actions;
export default automationSlice.reducer;

