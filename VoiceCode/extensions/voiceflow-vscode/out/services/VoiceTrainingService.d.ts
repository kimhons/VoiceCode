/**
 * Voice Training Service (PRO TIER)
 * Provides voice model training and customization
 */
export interface TrainingSession {
    id: string;
    startTime: Date;
    samples: number;
    status: 'active' | 'completed' | 'canceled';
}
export declare class VoiceTrainingService {
    private currentSession?;
    /**
     * Start a new training session
     */
    startTrainingSession(): Promise<TrainingSession>;
    /**
     * Record training sample
     */
    recordTrainingSample(audioBuffer: Float32Array): Promise<void>;
    /**
     * Complete training session
     */
    completeTraining(): Promise<void>;
    /**
     * Cancel training session
     */
    cancelTraining(): void;
    /**
     * Get current session
     */
    getCurrentSession(): TrainingSession | undefined;
}
//# sourceMappingURL=VoiceTrainingService.d.ts.map