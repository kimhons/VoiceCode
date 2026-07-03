/**
 * Productivity Service
 * Phase 3 Week 11 Day 71-72: Productivity Analytics
 * 
 * Personal productivity tracking and analytics service.
 */

export interface ProductivityMetrics {
  user_id: string;
  date: string;
  total_time: number; // minutes
  focus_time: number; // minutes
  meeting_time: number; // minutes
  transcription_count: number;
  words_transcribed: number;
  productivity_score: number; // 0-100
  efficiency_rating: number; // 0-5
  trend: 'improving' | 'stable' | 'declining';
}

export interface TimeBreakdown {
  category: string;
  time: number; // minutes
  percentage: number;
  color: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  duration: number; // minutes
  interruptions: number;
  quality_score: number; // 0-100
  activity_type: string;
}

export interface ProductivityTrend {
  date: string;
  score: number;
  focus_time: number;
  meeting_time: number;
  transcription_count: number;
}

export interface ProductivityGoal {
  id: string;
  user_id: string;
  goal_type: 'daily_focus' | 'weekly_transcriptions' | 'meeting_efficiency' | 'productivity_score';
  target_value: number;
  current_value: number;
  progress: number; // 0-100
  deadline: string;
  status: 'on_track' | 'at_risk' | 'achieved' | 'missed';
}

export interface ProductivityInsight {
  id: string;
  type: 'peak_hours' | 'focus_patterns' | 'meeting_overload' | 'efficiency_tip';
  title: string;
  description: string;
  recommendation: string;
  impact: 'high' | 'medium' | 'low';
  icon: string;
}

class ProductivityService {
  /**
   * Get productivity metrics for a user
   */
  async getProductivityMetrics(userId: string, period: 'day' | 'week' | 'month'): Promise<ProductivityMetrics> {
    // Mock implementation - replace with actual Supabase query
    await new Promise(resolve => setTimeout(resolve, 500));

    const baseMetrics = {
      day: { total_time: 480, focus_time: 240, meeting_time: 120, transcription_count: 8, words_transcribed: 12500 },
      week: { total_time: 2400, focus_time: 1200, meeting_time: 600, transcription_count: 42, words_transcribed: 65000 },
      month: { total_time: 9600, focus_time: 4800, meeting_time: 2400, transcription_count: 168, words_transcribed: 260000 },
    };

    const metrics = baseMetrics[period];
    const productivityScore = Math.round((metrics.focus_time / metrics.total_time) * 100);
    const efficiencyRating = Math.min(5, Math.round(productivityScore / 20));

    return {
      user_id: userId,
      date: new Date().toISOString().split('T')[0],
      total_time: metrics.total_time,
      focus_time: metrics.focus_time,
      meeting_time: metrics.meeting_time,
      transcription_count: metrics.transcription_count,
      words_transcribed: metrics.words_transcribed,
      productivity_score: productivityScore,
      efficiency_rating: efficiencyRating,
      trend: productivityScore >= 60 ? 'improving' : productivityScore >= 40 ? 'stable' : 'declining',
    };
  }

  /**
   * Get time breakdown for a specific date
   */
  async getTimeBreakdown(userId: string, date: string): Promise<TimeBreakdown[]> {
    // Mock implementation - replace with actual Supabase query
    await new Promise(resolve => setTimeout(resolve, 400));

    const breakdown: TimeBreakdown[] = [
      { category: 'Focus Time', time: 240, percentage: 50, color: '#4CAF50' },
      { category: 'Meetings', time: 120, percentage: 25, color: '#2196F3' },
      { category: 'Breaks', time: 60, percentage: 12.5, color: '#FF9800' },
      { category: 'Other', time: 60, percentage: 12.5, color: '#9E9E9E' },
    ];

    return breakdown;
  }

  /**
   * Get focus sessions for a date range
   */
  async getFocusSessions(userId: string, startDate: string, endDate: string): Promise<FocusSession[]> {
    // Mock implementation - replace with actual Supabase query
    await new Promise(resolve => setTimeout(resolve, 500));

    const sessions: FocusSession[] = [
      {
        id: 'session-1',
        user_id: userId,
        start_time: '2026-01-08T09:00:00Z',
        end_time: '2026-01-08T11:00:00Z',
        duration: 120,
        interruptions: 2,
        quality_score: 85,
        activity_type: 'Deep Work',
      },
      {
        id: 'session-2',
        user_id: userId,
        start_time: '2026-01-08T14:00:00Z',
        end_time: '2026-01-08T16:30:00Z',
        duration: 150,
        interruptions: 1,
        quality_score: 92,
        activity_type: 'Research',
      },
      {
        id: 'session-3',
        user_id: userId,
        start_time: '2026-01-08T17:00:00Z',
        end_time: '2026-01-08T18:00:00Z',
        duration: 60,
        interruptions: 3,
        quality_score: 68,
        activity_type: 'Planning',
      },
    ];

    return sessions;
  }

  /**
   * Get productivity trend for a number of days
   */
  async getProductivityTrend(userId: string, days: number): Promise<ProductivityTrend[]> {
    // Mock implementation - replace with actual Supabase query
    await new Promise(resolve => setTimeout(resolve, 600));

    const trend: ProductivityTrend[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const baseScore = 50 + Math.random() * 40;
      const focusTime = 180 + Math.random() * 120;
      const meetingTime = 60 + Math.random() * 120;

      trend.push({
        date: date.toISOString().split('T')[0],
        score: Math.round(baseScore),
        focus_time: Math.round(focusTime),
        meeting_time: Math.round(meetingTime),
        transcription_count: Math.floor(5 + Math.random() * 10),
      });
    }

    return trend;
  }

  /**
   * Get productivity goals for a user
   */
  async getProductivityGoals(userId: string): Promise<ProductivityGoal[]> {
    // Mock implementation - replace with actual Supabase query
    await new Promise(resolve => setTimeout(resolve, 400));

    const goals: ProductivityGoal[] = [
      {
        id: 'goal-1',
        user_id: userId,
        goal_type: 'daily_focus',
        target_value: 240,
        current_value: 180,
        progress: 75,
        deadline: new Date(Date.now() + 86400000).toISOString(),
        status: 'on_track',
      },
      {
        id: 'goal-2',
        user_id: userId,
        goal_type: 'weekly_transcriptions',
        target_value: 50,
        current_value: 42,
        progress: 84,
        deadline: new Date(Date.now() + 172800000).toISOString(),
        status: 'on_track',
      },
      {
        id: 'goal-3',
        user_id: userId,
        goal_type: 'productivity_score',
        target_value: 85,
        current_value: 72,
        progress: 85,
        deadline: new Date(Date.now() + 604800000).toISOString(),
        status: 'at_risk',
      },
    ];

    return goals;
  }

  /**
   * Create a new productivity goal
   */
  async createProductivityGoal(goal: Omit<ProductivityGoal, 'id' | 'current_value' | 'progress'>): Promise<ProductivityGoal> {
    // Mock implementation - replace with actual Supabase insert
    await new Promise(resolve => setTimeout(resolve, 500));

    const newGoal: ProductivityGoal = {
      ...goal,
      id: `goal-${Date.now()}`,
      current_value: 0,
      progress: 0,
    };

    return newGoal;
  }

  /**
   * Update a productivity goal
   */
  async updateProductivityGoal(goalId: string, updates: Partial<ProductivityGoal>): Promise<ProductivityGoal> {
    // Mock implementation - replace with actual Supabase update
    await new Promise(resolve => setTimeout(resolve, 500));

    const currentGoals = await this.getProductivityGoals('current-user');
    const goal = currentGoals.find(g => g.id === goalId);

    if (!goal) {
      throw new Error('Goal not found');
    }

    const updatedGoal = { ...goal, ...updates };
    updatedGoal.progress = Math.round((updatedGoal.current_value / updatedGoal.target_value) * 100);

    return updatedGoal;
  }

  /**
   * Get productivity insights for a user
   */
  async getProductivityInsights(userId: string): Promise<ProductivityInsight[]> {
    // Mock implementation - replace with actual AI-powered insights
    await new Promise(resolve => setTimeout(resolve, 700));

    const insights: ProductivityInsight[] = [
      {
        id: 'insight-1',
        type: 'peak_hours',
        title: 'Peak Productivity Hours',
        description: 'You are most productive between 9 AM and 11 AM',
        recommendation: 'Schedule your most important tasks during these hours',
        impact: 'high',
        icon: 'trending-up',
      },
      {
        id: 'insight-2',
        type: 'focus_patterns',
        title: 'Focus Session Length',
        description: 'Your optimal focus session is 90-120 minutes',
        recommendation: 'Take a 15-minute break after each 90-minute session',
        impact: 'medium',
        icon: 'time',
      },
      {
        id: 'insight-3',
        type: 'meeting_overload',
        title: 'Meeting Time Alert',
        description: 'You spend 25% of your time in meetings',
        recommendation: 'Consider declining non-essential meetings or making them shorter',
        impact: 'high',
        icon: 'warning',
      },
      {
        id: 'insight-4',
        type: 'efficiency_tip',
        title: 'Efficiency Improvement',
        description: 'Your efficiency rating has improved by 15% this week',
        recommendation: 'Keep up the good work! Maintain your current routine',
        impact: 'low',
        icon: 'trophy',
      },
    ];

    return insights;
  }

  /**
   * Calculate productivity score for a specific date
   */
  async calculateProductivityScore(userId: string, date: string): Promise<number> {
    // Mock implementation - replace with actual calculation algorithm
    await new Promise(resolve => setTimeout(resolve, 400));

    const metrics = await this.getProductivityMetrics(userId, 'day');
    return metrics.productivity_score;
  }
}

// Singleton instance
let productivityServiceInstance: ProductivityService | null = null;

export function getProductivityService(): ProductivityService {
  if (!productivityServiceInstance) {
    productivityServiceInstance = new ProductivityService();
  }
  return productivityServiceInstance;
}

