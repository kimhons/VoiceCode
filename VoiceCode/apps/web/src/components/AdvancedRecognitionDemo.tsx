/**
 * Advanced Recognition Demo Component
 * Phase 2.1: Advanced Voice Recognition
 * 
 * Demonstrates all advanced recognition features:
 * - Multi-language support
 * - Custom vocabulary
 * - Speaker diarization
 * - Confidence scoring
 */

import React, { useState } from 'react';
import { useAdvancedRecognition } from '../hooks/useAdvancedRecognition';
import { ProfessionalMode } from '../services/aiml-api.service';
import {
  getVocabularyForMode,
  getAvailableProfessionalModes,
  createCustomVocabulary,
} from '../config/professional-vocabularies';

const AIML_API_KEY = import.meta.env.VITE_AIML_API_KEY || '63f13c49769f4049b8789d00ab4af4fd';

export function AdvancedRecognitionDemo() {
  // Settings
  const [professionalMode, setProfessionalMode] = useState<ProfessionalMode>(ProfessionalMode.GENERAL);
  const [enableDiarization, setEnableDiarization] = useState(false);
  const [autoDetectLanguage, setAutoDetectLanguage] = useState(false);
  const [confidenceThreshold, setLocalConfidenceThreshold] = useState(0.7);
  const [customTerms, setCustomTerms] = useState('');
  const [showLowConfidence, setShowLowConfidence] = useState(false);

  // Advanced recognition hook
  const {
    isConnected,
    isStreaming,
    transcript,
    interimTranscript,
    currentLanguage,
    speakers,
    confidence,
    error,
    connect,
    disconnect,
    startStreaming,
    stopStreaming,
    clearTranscript,
  setLanguage,
    getSupportedLanguages,
    addCustomVocabulary,
    boostTerms,
  setConfidenceThreshold: setRecognitionConfidenceThreshold,
    highlightLowConfidence,
    setSpeakerName,
  } = useAdvancedRecognition({
    apiKey: AIML_API_KEY,
    autoDetectLanguage,
    preferredLanguages: ['en', 'es', 'fr'],
    enableDiarization,
    confidenceThreshold,
    professionalMode,
    customVocabulary: getVocabularyForMode(professionalMode),
    onLanguageDetected: (lang, conf) => {
      console.log(`Language detected: ${lang} (confidence: ${conf})`);
    },
    onSpeakerDetected: (speaker) => {
      console.log(`Speaker detected: ${speaker.id}`);
    },
    onLowConfidence: (text, conf) => {
      console.log(`Low confidence: ${text} (${conf})`);
    },
  });

  // Handle professional mode change
  const handleProfessionalModeChange = (mode: ProfessionalMode) => {
    setProfessionalMode(mode);
    const vocabulary = getVocabularyForMode(mode);
    addCustomVocabulary(vocabulary);
  };

  // Handle custom terms
  const handleAddCustomTerms = () => {
    if (!customTerms.trim()) return;

    const terms = customTerms.split(',').map(t => t.trim()).filter(Boolean);
    boostTerms(terms);
    setCustomTerms('');
  };

  // Handle confidence threshold change
  const handleConfidenceThresholdChange = (value: number) => {
    setLocalConfidenceThreshold(value);
    setRecognitionConfidenceThreshold(value);
  };

  // Get display transcript
  const displayTranscript = showLowConfidence && transcript
    ? highlightLowConfidence(transcript)
    : transcript;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Advanced Voice Recognition Demo</h1>

      {/* Settings Panel */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Settings</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Professional Mode */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Professional Mode
            </label>
            <select
              value={professionalMode}
              onChange={(e) => handleProfessionalModeChange(e.target.value as ProfessionalMode)}
              className="w-full px-3 py-2 border rounded-md"
            >
              {getAvailableProfessionalModes().map(mode => (
                <option key={mode} value={mode}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Language
            </label>
            <select
              value={currentLanguage}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              disabled={autoDetectLanguage}
            >
              {getSupportedLanguages().map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
          </div>

          {/* Confidence Threshold */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Confidence Threshold: {confidenceThreshold.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={confidenceThreshold}
              onChange={(e) => handleConfidenceThresholdChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Custom Terms */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Custom Terms (comma-separated)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTerms}
                onChange={(e) => setCustomTerms(e.target.value)}
                placeholder="term1, term2, term3"
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <button
                onClick={handleAddCustomTerms}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="mt-4 flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoDetectLanguage}
              onChange={(e) => setAutoDetectLanguage(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Auto-detect Language</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enableDiarization}
              onChange={(e) => setEnableDiarization(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Speaker Diarization</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showLowConfidence}
              onChange={(e) => setShowLowConfidence(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Highlight Low Confidence</span>
          </label>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-wrap gap-4">
          {!isConnected ? (
            <button
              onClick={connect}
              className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 font-semibold"
            >
              Connect
            </button>
          ) : (
            <>
              <button
                onClick={disconnect}
                className="px-6 py-3 bg-red-500 text-white rounded-md hover:bg-red-600 font-semibold"
              >
                Disconnect
              </button>

              {!isStreaming ? (
                <button
                  onClick={async () => {
                    try {
                      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                      await startStreaming(stream);
                    } catch (err) {
                      console.error('Failed to get media stream:', err);
                    }
                  }}
                  className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-semibold"
                >
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={stopStreaming}
                  className="px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 font-semibold"
                >
                  Stop Recording
                </button>
              )}

              <button
                onClick={clearTranscript}
                className="px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-semibold"
              >
                Clear
              </button>
            </>
          )}
        </div>

        {/* Status */}
        <div className="mt-4 flex gap-4 text-sm">
          <span className={`px-3 py-1 rounded-full ${isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {isConnected ? '🟢 Connected' : '⚪ Disconnected'}
          </span>
          <span className={`px-3 py-1 rounded-full ${isStreaming ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
            {isStreaming ? '🎤 Recording' : '⏸️ Idle'}
          </span>
          <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800">
            🌐 {currentLanguage.toUpperCase()}
          </span>
          {confidence && (
            <span className={`px-3 py-1 rounded-full ${confidence.overall >= confidenceThreshold ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              📊 {(confidence.overall * 100).toFixed(0)}% confidence
            </span>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md">
            ❌ {error}
          </div>
        )}
      </div>

      {/* Transcript */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Transcript</h2>
        
        <div className="min-h-[200px] p-4 bg-gray-50 rounded-md">
          <p className="text-gray-900 whitespace-pre-wrap">
            {displayTranscript}
            {interimTranscript && (
              <span className="text-gray-400 italic"> {interimTranscript}</span>
            )}
          </p>
        </div>
      </div>

      {/* Speakers */}
      {enableDiarization && speakers.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Speakers</h2>
          
          <div className="space-y-4">
            {speakers.map(speaker => (
              <div key={speaker.id} className="p-4 bg-gray-50 rounded-md">
                <div className="flex items-center gap-4 mb-2">
                  <span className="font-semibold">Speaker {speaker.id}</span>
                  <input
                    type="text"
                    placeholder="Enter name..."
                    onBlur={(e) => setSpeakerName(speaker.id, e.target.value)}
                    className="px-2 py-1 border rounded text-sm"
                  />
                  <span className="text-sm text-gray-600">
                    {(speaker.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
                <div className="text-sm text-gray-700">
                  {speaker.segments.length} segments
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

