import React, { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import './VisionPanel.css';

interface CaptureResult {
  width: number;
  height: number;
  format: string;
  file_path: string | null;
  timestamp: string;
}

interface ScreenContext {
  app_name: string;
  window_title: string;
  file_path: string | null;
  language: string | null;
  visible_text: string | null;
  keywords: string[];
  git_branch: string | null;
}

interface VisionPanelProps {
  onClose?: () => void;
  visible?: boolean;
}

type OcrTier = 'fast' | 'standard' | 'semantic';

export const VisionPanel: React.FC<VisionPanelProps> = ({
  onClose,
  visible = true,
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureResult, setCaptureResult] = useState<CaptureResult | null>(null);
  const [screenContext, setScreenContext] = useState<ScreenContext | null>(null);
  const [ocrTier, setOcrTier] = useState<OcrTier>('fast');
  const [error, setError] = useState<string | null>(null);
  const [captureHistory, setCaptureHistory] = useState<ScreenContext[]>([]);

  const captureScreen = useCallback(async () => {
    setIsCapturing(true);
    setError(null);

    try {
      const result = await invoke<CaptureResult>('capture_screen', {
        outputPath: null,
      });
      setCaptureResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const captureContext = useCallback(async () => {
    setIsCapturing(true);
    setError(null);

    try {
      const context = await invoke<ScreenContext>('capture_screen_context_now');
      setScreenContext(context);
      setCaptureHistory((prev) => [context, ...prev].slice(0, 10));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const handleCopyText = async () => {
    if (screenContext?.visible_text) {
      await navigator.clipboard.writeText(screenContext.visible_text);
    }
  };

  if (!visible) return null;

  return (
    <div className="vision-panel">
      <div className="vp-header">
        <div className="vp-title">
          <span className="vp-icon">&#128065;</span>
          <h3>Vision / OCR</h3>
        </div>
        {onClose && (
          <button className="vp-close" onClick={onClose} title="Close">
            x
          </button>
        )}
      </div>

      {/* Capture Controls */}
      <div className="vp-section">
        <div className="vp-capture-controls">
          <button
            className="vp-capture-btn"
            onClick={captureScreen}
            disabled={isCapturing}
          >
            {isCapturing ? 'Capturing...' : 'Screenshot'}
          </button>
          <button
            className="vp-capture-btn vp-capture-context"
            onClick={captureContext}
            disabled={isCapturing}
          >
            {isCapturing ? 'Analyzing...' : 'Capture Context'}
          </button>
        </div>

        {/* OCR Tier Selection */}
        <div className="vp-tier-select">
          <span className="vp-tier-label">OCR Tier:</span>
          <div className="vp-tier-buttons">
            {([
              { value: 'fast', label: 'Fast', desc: 'Tesseract' },
              { value: 'standard', label: 'Standard', desc: 'PaddleOCR' },
              { value: 'semantic', label: 'Semantic', desc: 'Vision LLM' },
            ] as const).map((t) => (
              <button
                key={t.value}
                className={`vp-tier-btn ${ocrTier === t.value ? 'active' : ''}`}
                onClick={() => setOcrTier(t.value)}
                title={t.desc}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="vp-error">
          <span className="vp-error-icon">!</span>
          {error}
        </div>
      )}

      {/* Capture Result */}
      {captureResult && (
        <div className="vp-section">
          <h4>Screenshot</h4>
          <div className="vp-capture-info">
            <span>{captureResult.width} x {captureResult.height}</span>
            <span>{captureResult.format}</span>
            <span>{captureResult.timestamp}</span>
          </div>
          {captureResult.file_path && (
            <div className="vp-file-path" title={captureResult.file_path}>
              Saved: {captureResult.file_path.split(/[/\\]/).pop()}
            </div>
          )}
        </div>
      )}

      {/* Screen Context */}
      {screenContext && (
        <div className="vp-section">
          <h4>Screen Context</h4>
          <div className="vp-context-grid">
            <div className="vp-context-row">
              <span className="vp-context-label">App:</span>
              <span className="vp-context-value">{screenContext.app_name}</span>
            </div>
            {screenContext.window_title && (
              <div className="vp-context-row">
                <span className="vp-context-label">Window:</span>
                <span className="vp-context-value">{screenContext.window_title}</span>
              </div>
            )}
            {screenContext.language && (
              <div className="vp-context-row">
                <span className="vp-context-label">Language:</span>
                <span className="vp-badge">{screenContext.language}</span>
              </div>
            )}
            {screenContext.file_path && (
              <div className="vp-context-row">
                <span className="vp-context-label">File:</span>
                <span className="vp-context-value" title={screenContext.file_path}>
                  {screenContext.file_path.split(/[/\\]/).pop()}
                </span>
              </div>
            )}
            {screenContext.git_branch && (
              <div className="vp-context-row">
                <span className="vp-context-label">Branch:</span>
                <span className="vp-badge vp-badge-git">{screenContext.git_branch}</span>
              </div>
            )}
          </div>

          {/* Keywords */}
          {screenContext.keywords.length > 0 && (
            <div className="vp-keywords">
              <span className="vp-context-label">Keywords:</span>
              <div className="vp-keyword-chips">
                {screenContext.keywords.slice(0, 15).map((kw, i) => (
                  <span key={i} className="vp-keyword-chip">{kw}</span>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Text */}
          {screenContext.visible_text && (
            <div className="vp-ocr-text">
              <div className="vp-ocr-header">
                <span>Extracted Text</span>
                <button className="vp-copy-btn" onClick={handleCopyText}>
                  Copy
                </button>
              </div>
              <pre className="vp-text-content">{screenContext.visible_text}</pre>
            </div>
          )}
        </div>
      )}

      {/* Capture History */}
      {captureHistory.length > 1 && (
        <div className="vp-section">
          <h4>Recent Captures</h4>
          <div className="vp-history">
            {captureHistory.slice(1, 6).map((ctx, i) => (
              <div
                key={i}
                className="vp-history-item"
                onClick={() => setScreenContext(ctx)}
              >
                <span className="vp-history-app">{ctx.app_name}</span>
                {ctx.language && (
                  <span className="vp-history-lang">{ctx.language}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
