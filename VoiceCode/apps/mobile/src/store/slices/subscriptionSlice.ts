// VoiceCode Mobile - Subscription Slice

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { paymentService, SubscriptionInfo } from '@/services/paymentService';

// ============================================================================
// TYPES
// ============================================================================

interface SubscriptionState {
  subscription: SubscriptionInfo | null;
  tier: 'free' | 'pro' | 'enterprise';
  loading: boolean;
  error: string | null;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: SubscriptionState = {
  subscription: null,
  tier: 'free',
  loading: false,
  error: null,
};

// ============================================================================
// ASYNC THUNKS
// ============================================================================

export const fetchSubscription = createAsyncThunk(
  'subscription/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const sub = await paymentService.getSubscription();
      return sub;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch subscription';
      return rejectWithValue(message);
    }
  }
);

// ============================================================================
// SLICE
// ============================================================================

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setSubscription(state, action: PayloadAction<SubscriptionInfo | null>) {
      state.subscription = action.payload;
      state.tier = action.payload?.tier ?? 'free';
    },
    clearSubscription(state) {
      state.subscription = null;
      state.tier = 'free';
      state.error = null;
    },
    setSubscriptionError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.subscription = action.payload;
        state.tier = action.payload?.tier ?? 'free';
      })
      .addCase(fetchSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSubscription, clearSubscription, setSubscriptionError } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;

