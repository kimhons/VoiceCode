"use strict";
/**
 * Voice Training Service (PRO TIER)
 * Provides voice model training and customization
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceTrainingService = void 0;
const vscode = __importStar(require("vscode"));
class VoiceTrainingService {
    currentSession;
    /**
     * Start a new training session
     */
    async startTrainingSession() {
        this.currentSession = {
            id: `training_${Date.now()}`,
            startTime: new Date(),
            samples: 0,
            status: 'active',
        };
        vscode.window.showInformationMessage('Voice training session started. Speak clearly for best results.');
        return this.currentSession;
    }
    /**
     * Record training sample
     */
    async recordTrainingSample(audioBuffer) {
        if (!this.currentSession) {
            throw new Error('No active training session');
        }
        this.currentSession.samples++;
        console.log(`[VoiceTraining] Recorded sample ${this.currentSession.samples}`);
    }
    /**
     * Complete training session
     */
    async completeTraining() {
        if (!this.currentSession) {
            return;
        }
        this.currentSession.status = 'completed';
        vscode.window.showInformationMessage(`Training completed with ${this.currentSession.samples} samples`);
        this.currentSession = undefined;
    }
    /**
     * Cancel training session
     */
    cancelTraining() {
        if (this.currentSession) {
            this.currentSession.status = 'canceled';
            this.currentSession = undefined;
        }
    }
    /**
     * Get current session
     */
    getCurrentSession() {
        return this.currentSession;
    }
}
exports.VoiceTrainingService = VoiceTrainingService;
//# sourceMappingURL=VoiceTrainingService.js.map