/**
 * AIML API Test Page
 * Demonstrates all AIML API capabilities
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Mic, FileText, Languages, Volume2, CheckSquare } from 'lucide-react';
import AIMLTranscription from '@/components/AIMLTranscription';
import { ProfessionalModeSelector } from '@/components/ProfessionalModeSelector';
import { useProfessionalMode } from '@/contexts/ProfessionalModeContext';
import { STTResult } from '@/services/aiml-api.service';

export const AIMLTestPage: React.FC = () => {
  const { currentMode } = useProfessionalMode();
  const [transcriptionResult, setTranscriptionResult] = useState<STTResult | null>(null);
  const [formattedText, setFormattedText] = useState<string>('');

  const features = [
    {
      icon: <Mic className="w-6 h-6" />,
      title: 'Professional STT Models',
      description: '10+ specialized Deepgram Nova-2 models for medical, business, finance, and more',
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'AI-Powered Formatting',
      description: 'Automatic formatting with GPT-5, Claude 4.5, and other advanced models',
    },
    {
      icon: <CheckSquare className="w-6 h-6" />,
      title: 'Action Item Extraction',
      description: 'Automatically extract tasks, owners, and deadlines from meetings',
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Smart Summarization',
      description: 'Generate concise summaries tailored to your professional mode',
    },
    {
      icon: <Languages className="w-6 h-6" />,
      title: 'Real-time Translation',
      description: 'Translate transcripts to 150+ languages with context preservation',
    },
    {
      icon: <Volume2 className="w-6 h-6" />,
      title: 'Text-to-Speech',
      description: 'High-quality voice synthesis with OpenAI TTS and ElevenLabs',
    },
  ];

  const modelInfo = {
    medical: {
      stt: 'Deepgram Nova-2 Medical',
      chat: 'GPT-5 Pro',
      features: ['Medical terminology', 'HIPAA compliance', 'Entity detection', 'SOAP notes'],
    },
    business: {
      stt: 'Deepgram Nova-2 Meeting',
      chat: 'GPT-5 Pro',
      features: ['Speaker diarization', 'Action items', 'Meeting summaries', 'Sentiment analysis'],
    },
    developer: {
      stt: 'Deepgram Nova-2 General',
      chat: 'Claude 4.5 Sonnet',
      features: ['Code generation', 'Technical terminology', 'Architecture notes', 'Task extraction'],
    },
    legal: {
      stt: 'Deepgram Nova-2 General',
      chat: 'GPT-5 Pro',
      features: ['Legal terminology', 'Case citations', 'Contract analysis', 'Structured formatting'],
    },
    education: {
      stt: 'Deepgram Nova-2 General',
      chat: 'Gemini 2.5 Flash',
      features: ['Lecture transcription', 'Study guides', 'Key concepts', 'Q&A generation'],
    },
    general: {
      stt: 'Deepgram Nova-2 General',
      chat: 'GPT-4o',
      features: ['General transcription', 'Smart formatting', 'Summarization', 'Translation'],
    },
  };

  const currentModelInfo = modelInfo[currentMode as keyof typeof modelInfo] || modelInfo.general;

  return (
    <div className="aiml-test-page">
      {/* Header */}
      <header className="page-header">
        <Link to="/" className="back-button">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>
        <div className="header-content">
          <div className="header-icon">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h1>AIML API Integration</h1>
            <p>Powered by 300+ AI models from OpenAI, Anthropic, Google, Deepgram, and more</p>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section className="features-section">
        <h2>Enhanced Capabilities</h2>
        <div className="features-grid">
          {features.map((feature, idx) => (
            <div key={idx} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Professional Mode Selector */}
      <section className="mode-section">
        <h2>Select Professional Mode</h2>
        <ProfessionalModeSelector />
        
        <div className="current-models">
          <h3>Current Configuration</h3>
          <div className="model-info">
            <div className="model-item">
              <strong>Speech-to-Text:</strong>
              <span>{currentModelInfo.stt}</span>
            </div>
            <div className="model-item">
              <strong>AI Chat:</strong>
              <span>{currentModelInfo.chat}</span>
            </div>
            <div className="model-features">
              <strong>Features:</strong>
              <div className="feature-tags">
                {currentModelInfo.features.map((feature, idx) => (
                  <span key={idx} className="feature-tag">{feature}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Transcription Demo */}
      <section className="demo-section">
        <h2>Try It Now</h2>
        <AIMLTranscription
          onTranscriptionComplete={setTranscriptionResult}
          onFormattedText={setFormattedText}
        />
      </section>

      {/* API Info */}
      <section className="api-info">
        <h2>API Information</h2>
        <div className="info-grid">
          <div className="info-card">
            <h3>Available Models</h3>
            <ul>
              <li><strong>STT:</strong> 10+ Deepgram Nova-2 variants</li>
              <li><strong>Chat:</strong> GPT-5, Claude 4.5, Gemini 2.5, DeepSeek R1</li>
              <li><strong>TTS:</strong> OpenAI TTS-1 HD, ElevenLabs</li>
              <li><strong>Image:</strong> FLUX Pro, Imagen 4.0, Stable Diffusion</li>
              <li><strong>Video:</strong> Sora 2, Veo 3.1, Runway Gen-4</li>
            </ul>
          </div>

          <div className="info-card">
            <h3>Cost Savings</h3>
            <ul>
              <li><strong>vs Otter.ai:</strong> 91% cheaper ($0.005 vs $0.056/min)</li>
              <li><strong>vs Rev.ai:</strong> 99% cheaper ($0.005 vs $0.37/min)</li>
              <li><strong>Single API:</strong> One billing for all AI services</li>
              <li><strong>No Lock-in:</strong> Switch models anytime</li>
            </ul>
          </div>

          <div className="info-card">
            <h3>Performance</h3>
            <ul>
              <li><strong>Accuracy:</strong> &gt;95% with specialized models</li>
              <li><strong>Latency:</strong> &lt;2 seconds for real-time</li>
              <li><strong>Uptime:</strong> 99.9% guaranteed</li>
              <li><strong>Languages:</strong> 150+ supported</li>
            </ul>
          </div>
        </div>
      </section>

      <style>{`
        .aiml-test-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
        }

        .page-header {
          max-width: 1200px;
          margin: 0 auto 3rem;
        }

        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border-radius: 0.5rem;
          text-decoration: none;
          font-weight: 500;
          margin-bottom: 1.5rem;
          transition: all 0.2s;
        }

        .back-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          color: white;
        }

        .header-icon {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 1rem;
        }

        .header-content h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0 0 0.5rem;
        }

        .header-content p {
          font-size: 1.125rem;
          opacity: 0.9;
          margin: 0;
        }

        section {
          max-width: 1200px;
          margin: 0 auto 3rem;
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        section h2 {
          font-size: 1.875rem;
          font-weight: 700;
          margin: 0 0 1.5rem;
          color: #111827;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .feature-card {
          padding: 1.5rem;
          background: #f9fafb;
          border-radius: 0.75rem;
          transition: all 0.2s;
        }

        .feature-card:hover {
          background: #f3f4f6;
          transform: translateY(-2px);
        }

        .feature-icon {
          display: inline-flex;
          padding: 0.75rem;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }

        .feature-card h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 0.5rem;
          color: #111827;
        }

        .feature-card p {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.5;
        }

        .current-models {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #f9fafb;
          border-radius: 0.75rem;
        }

        .current-models h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 1rem;
          color: #111827;
        }

        .model-info {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .model-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .model-item strong {
          color: #374151;
        }

        .model-item span {
          color: #6b7280;
        }

        .model-features {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .feature-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .feature-tag {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 0.25rem;
          font-size: 0.875rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .info-card {
          padding: 1.5rem;
          background: #f9fafb;
          border-radius: 0.75rem;
        }

        .info-card h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 1rem;
          color: #111827;
        }

        .info-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .info-card li {
          padding: 0.5rem 0;
          color: #6b7280;
          line-height: 1.5;
        }

        .info-card li strong {
          color: #374151;
        }

        @media (max-width: 768px) {
          .aiml-test-page {
            padding: 1rem;
          }

          .header-content {
            flex-direction: column;
            text-align: center;
          }

          .header-content h1 {
            font-size: 1.875rem;
          }

          section {
            padding: 1.5rem;
          }

          .features-grid,
          .info-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AIMLTestPage;

