/**
 * Live & Video Hub Component
 * Phase 5.9 & 5.10: Live Streaming + Video Transcription
 * 
 * Combined dashboard for live streaming and video transcription
 */

import React, { useState } from 'react';
import { useLiveStreaming } from '../hooks/useLiveStreaming';
import { useVideoTranscription } from '../hooks/useVideoTranscription';
import './LiveVideoHub.css';

interface LiveVideoHubProps {
  userId: string;
}

export const LiveVideoHub: React.FC<LiveVideoHubProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<'live' | 'video'>('live');

  // Live Streaming
  const {
    createStream,
    startStream,
    stopStream,
    pauseStream,
    resumeStream,
    startLiveTranscription,
    currentStream,
    streams,
    captions,
    isStreaming,
    isLoading: liveLoading,
    error: liveError,
    clearError: clearLiveError,
  } = useLiveStreaming({ userId, autoLoad: true });

  // Video Transcription
  const {
    uploadVideo,
    getSubtitleTracks,
    downloadSubtitles,
    deleteVideoTranscription,
    videos,
    currentVideo,
    subtitles,
    uploadProgress,
    isUploading,
    isLoading: videoLoading,
    error: videoError,
    clearError: clearVideoError,
  } = useVideoTranscription({ userId, autoLoad: true });

  // Live Streaming Handlers
  const [showCreateStream, setShowCreateStream] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');

  const handleCreateStream = async () => {
    try {
      const stream = await createStream(streamTitle, 'general', 'en', {
        enableCaptions: true,
        captionDelay: 500,
        enableRecording: true,
        enableChat: false,
        isPublic: false,
        maxViewers: 100,
        quality: 'high',
        protocol: 'websocket',
      });

      // Start audio stream
      const mediaStream = await startStream(stream.id);

      // Start live transcription
      await startLiveTranscription(stream.id, mediaStream);

      setShowCreateStream(false);
      setStreamTitle('');
    } catch (err) {
      console.error('Failed to create stream:', err);
    }
  };

  const handleStopStream = async () => {
    if (currentStream) {
      await stopStream(currentStream.id);
    }
  };

  const handlePauseStream = async () => {
    if (currentStream) {
      await pauseStream(currentStream.id);
    }
  };

  const handleResumeStream = async () => {
    if (currentStream) {
      await resumeStream(currentStream.id);
    }
  };

  // Video Transcription Handlers
  const [showUploadVideo, setShowUploadVideo] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
      setVideoTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUploadVideo = async () => {
    if (!videoFile) return;

    try {
      await uploadVideo(videoFile, videoTitle);
      setShowUploadVideo(false);
      setVideoFile(null);
      setVideoTitle('');
    } catch (err) {
      console.error('Failed to upload video:', err);
    }
  };

  const handleDownloadSubtitles = async (subtitleId: string, format: string) => {
    try {
      const blob = await downloadSubtitles(subtitleId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subtitles.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download subtitles:', err);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      await deleteVideoTranscription(videoId);
    } catch (err) {
      console.error('Failed to delete video:', err);
    }
  };

  const handleViewSubtitles = async (videoId: string) => {
    try {
      await getSubtitleTracks(videoId);
    } catch (err) {
      console.error('Failed to get subtitles:', err);
    }
  };

  return (
    <div className="live-video-hub">
      {/* Error Messages */}
      {liveError && (
        <div className="error-banner">
          <span>{liveError}</span>
          <button onClick={clearLiveError}>×</button>
        </div>
      )}
      {videoError && (
        <div className="error-banner">
          <span>{videoError}</span>
          <button onClick={clearVideoError}>×</button>
        </div>
      )}

      {/* Header */}
      <div className="hub-header">
        <div>
          <h1>🎙️ Live & Video Hub</h1>
          <p>Live streaming and video transcription</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={activeTab === 'live' ? 'active' : ''} onClick={() => setActiveTab('live')}>
          🎙️ Live Streaming
        </button>
        <button className={activeTab === 'video' ? 'active' : ''} onClick={() => setActiveTab('video')}>
          🎥 Video Transcription
        </button>
      </div>

      {/* Live Streaming Tab */}
      {activeTab === 'live' && (
        <div className="live-tab">
          {/* Current Stream */}
          {currentStream && (
            <div className="current-stream">
              <div className="stream-header">
                <h2>{currentStream.title}</h2>
                <span className={`status-badge ${currentStream.status}`}>{currentStream.status}</span>
              </div>

              <div className="stream-controls">
                {isStreaming ? (
                  <>
                    <button className="btn-pause" onClick={handlePauseStream}>
                      ⏸️ Pause
                    </button>
                    <button className="btn-stop" onClick={handleStopStream}>
                      ⏹️ Stop
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn-resume" onClick={handleResumeStream}>
                      ▶️ Resume
                    </button>
                    <button className="btn-stop" onClick={handleStopStream}>
                      ⏹️ End Stream
                    </button>
                  </>
                )}
              </div>

              {/* Live Captions */}
              <div className="live-captions">
                <h3>Live Captions</h3>
                <div className="captions-container">
                  {captions.slice(-5).map((caption) => (
                    <div key={caption.id} className={`caption ${caption.isFinal ? 'final' : 'interim'}`}>
                      <span className="caption-text">{caption.text}</span>
                      <span className="caption-confidence">{Math.round(caption.confidence * 100)}%</span>
                    </div>
                  ))}
                  {captions.length === 0 && <p className="no-captions">Waiting for audio...</p>}
                </div>
              </div>
            </div>
          )}

          {/* Create Stream Button */}
          {!currentStream && (
            <div className="create-stream-section">
              <button className="btn-create-stream" onClick={() => setShowCreateStream(true)}>
                🎙️ Start Live Stream
              </button>
            </div>
          )}

          {/* Stream History */}
          <div className="stream-history">
            <h2>Stream History</h2>
            <div className="streams-list">
              {streams.map((stream) => (
                <div key={stream.id} className="stream-card">
                  <div className="stream-info">
                    <h3>{stream.title}</h3>
                    <p>
                      {new Date(stream.startedAt).toLocaleString()} • {Math.round(stream.duration / 60)} min
                    </p>
                  </div>
                  <span className={`status-badge ${stream.status}`}>{stream.status}</span>
                </div>
              ))}
              {streams.length === 0 && <p className="no-streams">No streams yet</p>}
            </div>
          </div>
        </div>
      )}

      {/* Video Transcription Tab */}
      {activeTab === 'video' && (
        <div className="video-tab">
          {/* Upload Button */}
          <div className="upload-section">
            <button className="btn-upload-video" onClick={() => setShowUploadVideo(true)}>
              📤 Upload Video
            </button>
          </div>

          {/* Upload Progress */}
          {isUploading && uploadProgress && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress.percentage}%` }} />
              </div>
              <p>{Math.round(uploadProgress.percentage)}% uploaded</p>
            </div>
          )}

          {/* Videos List */}
          <div className="videos-list">
            <h2>Your Videos</h2>
            {videos.map((video) => (
              <div key={video.id} className="video-card">
                <div className="video-info">
                  <h3>{video.title}</h3>
                  <p>
                    {video.fileName} • {(video.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <span className={`status-badge ${video.status}`}>{video.status}</span>
                  {video.status === 'processing' && (
                    <div className="processing-progress">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${video.progress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="video-actions">
                  {video.status === 'completed' && (
                    <>
                      <button className="btn-view" onClick={() => handleViewSubtitles(video.id)}>
                        View Subtitles
                      </button>
                      <button className="btn-delete" onClick={() => handleDeleteVideo(video.id)}>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {videos.length === 0 && <p className="no-videos">No videos yet</p>}
          </div>

          {/* Subtitles Panel */}
          {subtitles.length > 0 && (
            <div className="subtitles-panel">
              <h2>Subtitles</h2>
              <div className="subtitles-list">
                {subtitles.map((subtitle) => (
                  <div key={subtitle.id} className="subtitle-card">
                    <div className="subtitle-info">
                      <span className="subtitle-format">{subtitle.format.toUpperCase()}</span>
                      <span className="subtitle-language">{subtitle.language}</span>
                    </div>
                    <button
                      className="btn-download"
                      onClick={() => handleDownloadSubtitles(subtitle.id, subtitle.format)}
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Stream Modal */}
      {showCreateStream && (
        <div className="modal-overlay" onClick={() => setShowCreateStream(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Start Live Stream</h2>
              <button className="modal-close" onClick={() => setShowCreateStream(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Stream Title</label>
                <input
                  type="text"
                  placeholder="My Live Stream"
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowCreateStream(false)}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleCreateStream} disabled={!streamTitle || liveLoading}>
                {liveLoading ? 'Starting...' : 'Start Stream'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Video Modal */}
      {showUploadVideo && (
        <div className="modal-overlay" onClick={() => setShowUploadVideo(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Video</h2>
              <button className="modal-close" onClick={() => setShowUploadVideo(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Video File</label>
                <input type="file" accept="video/*" onChange={handleVideoFileChange} />
              </div>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  placeholder="Video Title"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowUploadVideo(false)}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleUploadVideo} disabled={!videoFile || !videoTitle || isUploading}>
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveVideoHub;

