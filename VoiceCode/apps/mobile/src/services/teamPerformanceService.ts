/**
 * Team Performance Service
 * Phase 3 Week 11 Day 71-72: Productivity Analytics
 * 
 * Team performance analytics and collaboration tracking service.
 */

export interface TeamMetrics {
  team_id: string;
  date: string;
  member_count: number;
  total_transcriptions: number;
  total_meeting_time: number; // minutes
  average_productivity_score: number;
  collaboration_score: number; // 0-100
  meeting_effectiveness: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
}

export interface TeamMemberPerformance {
  user_id: string;
  user_name: string;
  avatar_url: string;
  productivity_score: number;
  transcription_count: number;
  meeting_time: number;
  focus_time: number;
  collaboration_rating: number; // 0-5
  rank: number;
}

export interface MeetingEffectiveness {
  meeting_id: string;
  title: string;
  date: string;
  duration: number; // minutes
  participant_count: number;
  effectiveness_score: number; // 0-100
  action_items_created: number;
  action_items_completed: number;
  follow_up_required: boolean;
}

export interface CollaborationPattern {
  pattern_type: 'frequent_collaborators' | 'communication_style' | 'meeting_frequency';
  description: string;
  participants: string[];
  frequency: number;
  impact: 'positive' | 'neutral' | 'negative';
}

export interface PerformanceBenchmark {
  metric: string;
  team_value: number;
  industry_average: number;
  top_quartile: number;
  percentile: number;
  status: 'above_average' | 'average' | 'below_average';
}

class TeamPerformanceService {
  /**
   * Get team metrics for a specific period
   */
  async getTeamMetrics(teamId: string, period: 'day' | 'week' | 'month'): Promise<TeamMetrics> {
    // Mock implementation - replace with actual Supabase query
    await new Promise(resolve => setTimeout(resolve, 500));

    const baseMetrics = {
      day: { member_count: 8, total_transcriptions: 64, total_meeting_time: 480 },
      week: { member_count: 8, total_transcriptions: 336, total_meeting_time: 2400 },
      month: { member_count: 8, total_transcriptions: 1344, total_meeting_time: 9600 },
    };

    const metrics = baseMetrics[period];
    const avgProductivityScore = 75 + Math.random() * 15;
    const collaborationScore = 80 + Math.random() * 15;
    const meetingEffectiveness = 70 + Math.random() * 20;

    return {
      team_id: teamId,
      date: new Date().toISOString().split('T')[0],
      member_count: metrics.member_count,
      total_transcriptions: metrics.total_transcriptions,
      total_meeting_time: metrics.total_meeting_time,
      average_productivity_score: Math.round(avgProductivityScore),
      collaboration_score: Math.round(collaborationScore),
      meeting_effectiveness: Math.round(meetingEffectiveness),
      trend: avgProductivityScore >= 80 ? 'improving' : avgProductivityScore >= 70 ? 'stable' : 'declining',
    };
  }

  /**
   * Get team member performance rankings
   */
  async getTeamMemberPerformance(teamId: string, period: 'week' | 'month'): Promise<TeamMemberPerformance[]> {
    // Mock implementation - replace with actual Supabase query
    await new Promise(resolve => setTimeout(resolve, 600));

    const members: TeamMemberPerformance[] = [
      {
        user_id: 'user-1',
        user_name: 'Alice Johnson',
        avatar_url: 'https://i.pravatar.cc/150?img=1',
        productivity_score: 92,
        transcription_count: 58,
        meeting_time: 240,
        focus_time: 1200,
        collaboration_rating: 5,
        rank: 1,
      },
      {
        user_id: 'user-2',
        user_name: 'Bob Smith',
        avatar_url: 'https://i.pravatar.cc/150?img=2',
        productivity_score: 88,
        transcription_count: 52,
        meeting_time: 300,
        focus_time: 1100,
        collaboration_rating: 4,
        rank: 2,
      },
      {
        user_id: 'user-3',
        user_name: 'Carol Davis',
        avatar_url: 'https://i.pravatar.cc/150?img=3',
        productivity_score: 85,
        transcription_count: 48,
        meeting_time: 280,
        focus_time: 1050,
        collaboration_rating: 5,
        rank: 3,
      },
      {
        user_id: 'user-4',
        user_name: 'David Wilson',
        avatar_url: 'https://i.pravatar.cc/150?img=4',
        productivity_score: 82,
        transcription_count: 45,
        meeting_time: 320,
        focus_time: 980,
        collaboration_rating: 4,
        rank: 4,
      },
      {
        user_id: 'user-5',
        user_name: 'Eve Martinez',
        avatar_url: 'https://i.pravatar.cc/150?img=5',
        productivity_score: 78,
        transcription_count: 42,
        meeting_time: 290,
        focus_time: 920,
        collaboration_rating: 3,
        rank: 5,
      },
    ];

    return members;
  }

  /**
   * Get meeting effectiveness data
   */
  async getMeetingEffectiveness(teamId: string, startDate: string, endDate: string): Promise<MeetingEffectiveness[]> {
    // Mock implementation - replace with actual Supabase query
    await new Promise(resolve => setTimeout(resolve, 500));

    const meetings: MeetingEffectiveness[] = [
      {
        meeting_id: 'meeting-1',
        title: 'Weekly Team Sync',
        date: '2026-01-08T10:00:00Z',
        duration: 60,
        participant_count: 8,
        effectiveness_score: 85,
        action_items_created: 12,
        action_items_completed: 10,
        follow_up_required: true,
      },
      {
        meeting_id: 'meeting-2',
        title: 'Product Planning',
        date: '2026-01-07T14:00:00Z',
        duration: 90,
        participant_count: 6,
        effectiveness_score: 92,
        action_items_created: 8,
        action_items_completed: 8,
        follow_up_required: false,
      },
      {
        meeting_id: 'meeting-3',
        title: 'Sprint Retrospective',
        date: '2026-01-06T16:00:00Z',
        duration: 75,
        participant_count: 8,
        effectiveness_score: 78,
        action_items_created: 15,
        action_items_completed: 11,
        follow_up_required: true,
      },
    ];

    return meetings;
  }

  /**
   * Get collaboration patterns for the team
   */
  async getCollaborationPatterns(teamId: string): Promise<CollaborationPattern[]> {
    // Mock implementation - replace with actual analysis
    await new Promise(resolve => setTimeout(resolve, 600));

    const patterns: CollaborationPattern[] = [
      {
        pattern_type: 'frequent_collaborators',
        description: 'Alice and Bob collaborate frequently on projects',
        participants: ['Alice Johnson', 'Bob Smith'],
        frequency: 15,
        impact: 'positive',
      },
      {
        pattern_type: 'communication_style',
        description: 'Team prefers async communication over meetings',
        participants: ['Team'],
        frequency: 8,
        impact: 'positive',
      },
      {
        pattern_type: 'meeting_frequency',
        description: 'Daily standups are consistently attended',
        participants: ['All Members'],
        frequency: 20,
        impact: 'neutral',
      },
    ];

    return patterns;
  }

  /**
   * Get performance benchmarks compared to industry
   */
  async getPerformanceBenchmarks(teamId: string): Promise<PerformanceBenchmark[]> {
    // Mock implementation - replace with actual benchmark data
    await new Promise(resolve => setTimeout(resolve, 500));

    const benchmarks: PerformanceBenchmark[] = [
      {
        metric: 'Productivity Score',
        team_value: 85,
        industry_average: 75,
        top_quartile: 90,
        percentile: 75,
        status: 'above_average',
      },
      {
        metric: 'Meeting Effectiveness',
        team_value: 82,
        industry_average: 70,
        top_quartile: 85,
        percentile: 80,
        status: 'above_average',
      },
      {
        metric: 'Collaboration Score',
        team_value: 88,
        industry_average: 80,
        top_quartile: 92,
        percentile: 70,
        status: 'above_average',
      },
      {
        metric: 'Focus Time Ratio',
        team_value: 50,
        industry_average: 45,
        top_quartile: 60,
        percentile: 65,
        status: 'above_average',
      },
      {
        metric: 'Transcription Volume',
        team_value: 42,
        industry_average: 40,
        top_quartile: 50,
        percentile: 55,
        status: 'average',
      },
    ];

    return benchmarks;
  }

  /**
   * Calculate meeting effectiveness score
   */
  async calculateMeetingEffectiveness(meetingId: string): Promise<number> {
    // Mock implementation - replace with actual calculation
    await new Promise(resolve => setTimeout(resolve, 400));

    const meetings = await this.getMeetingEffectiveness('team-1', '', '');
    const meeting = meetings.find(m => m.meeting_id === meetingId);

    if (!meeting) {
      return 0;
    }

    return meeting.effectiveness_score;
  }

  /**
   * Get team performance trend
   */
  async getTeamTrend(teamId: string, days: number): Promise<Array<{ date: string; score: number }>> {
    // Mock implementation - replace with actual Supabase query
    await new Promise(resolve => setTimeout(resolve, 500));

    const trend: Array<{ date: string; score: number }> = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const baseScore = 70 + Math.random() * 20;

      trend.push({
        date: date.toISOString().split('T')[0],
        score: Math.round(baseScore),
      });
    }

    return trend;
  }
}

// Singleton instance
let teamPerformanceServiceInstance: TeamPerformanceService | null = null;

export function getTeamPerformanceService(): TeamPerformanceService {
  if (!teamPerformanceServiceInstance) {
    teamPerformanceServiceInstance = new TeamPerformanceService();
  }
  return teamPerformanceServiceInstance;
}

