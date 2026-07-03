/**
 * useSpeakerDiarization Hook
 * Manages speaker identification and segmentation for transcripts
 */

import { useState, useCallback, useMemo } from 'react';

export interface Speaker {
  id: string;
  name: string;
  color: string;
}

export interface SpeakerSegment {
  speakerId: string;
  startTime: number; // seconds
  endTime: number; // seconds
  text: string;
  wordIndices: number[]; // indices into words array
}

export interface WordWithSpeaker {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speakerId?: string;
}

interface UseSpeakerDiarizationOptions {
  initialSpeakers?: Speaker[];
  initialSegments?: SpeakerSegment[];
  onSpeakersChange?: (speakers: Speaker[]) => void;
  onSegmentsChange?: (segments: SpeakerSegment[]) => void;
}

interface UseSpeakerDiarizationReturn {
  // State
  speakers: Speaker[];
  segments: SpeakerSegment[];

  // Speaker management
  addSpeaker: (name?: string) => Speaker;
  removeSpeaker: (speakerId: string) => void;
  renameSpeaker: (speakerId: string, newName: string) => void;
  changeSpeakerColor: (speakerId: string, newColor: string) => void;
  mergeSpeakers: (sourceId: string, targetId: string) => void;

  // Segment management
  assignSpeakerToSegment: (segmentIndex: number, speakerId: string) => void;
  splitSegment: (segmentIndex: number, splitTime: number) => void;
  mergeSegments: (segmentIndices: number[]) => void;

  // Utilities
  getSpeakerForTime: (timeSeconds: number) => Speaker | undefined;
  getSpeakerForWord: (wordIndex: number) => Speaker | undefined;
  getSegmentsForSpeaker: (speakerId: string) => SpeakerSegment[];
  getSpeakerStats: () => SpeakerStats[];

  // Auto-detection (placeholder for ML integration)
  detectSpeakers: (words: WordWithSpeaker[]) => Promise<void>;
  isDetecting: boolean;
}

interface SpeakerStats {
  speaker: Speaker;
  totalTime: number; // seconds
  segmentCount: number;
  wordCount: number;
  percentage: number; // 0-100
}

// Predefined speaker colors
const SPEAKER_COLORS = [
  '#667eea', // Primary purple
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
];

const generateSpeakerId = () => `speaker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export function useSpeakerDiarization(
  options: UseSpeakerDiarizationOptions = {}
): UseSpeakerDiarizationReturn {
  const {
    initialSpeakers = [],
    initialSegments = [],
    onSpeakersChange,
    onSegmentsChange,
  } = options;

  const [speakers, setSpeakers] = useState<Speaker[]>(initialSpeakers);
  const [segments, setSegments] = useState<SpeakerSegment[]>(initialSegments);
  const [isDetecting, setIsDetecting] = useState(false);

  // Get next available color
  const getNextColor = useCallback(() => {
    const usedColors = new Set(speakers.map(s => s.color));
    return SPEAKER_COLORS.find(c => !usedColors.has(c)) || SPEAKER_COLORS[speakers.length % SPEAKER_COLORS.length];
  }, [speakers]);

  // Add a new speaker
  const addSpeaker = useCallback((name?: string): Speaker => {
    const speakerNumber = speakers.length + 1;
    const newSpeaker: Speaker = {
      id: generateSpeakerId(),
      name: name || `Speaker ${speakerNumber}`,
      color: getNextColor(),
    };

    setSpeakers(prev => {
      const updated = [...prev, newSpeaker];
      onSpeakersChange?.(updated);
      return updated;
    });

    return newSpeaker;
  }, [speakers.length, getNextColor, onSpeakersChange]);

  // Remove a speaker
  const removeSpeaker = useCallback((speakerId: string) => {
    setSpeakers(prev => {
      const updated = prev.filter(s => s.id !== speakerId);
      onSpeakersChange?.(updated);
      return updated;
    });

    // Remove speaker from segments
    setSegments(prev => {
      const updated = prev.filter(seg => seg.speakerId !== speakerId);
      onSegmentsChange?.(updated);
      return updated;
    });
  }, [onSpeakersChange, onSegmentsChange]);

  // Rename a speaker
  const renameSpeaker = useCallback((speakerId: string, newName: string) => {
    setSpeakers(prev => {
      const updated = prev.map(s =>
        s.id === speakerId ? { ...s, name: newName } : s
      );
      onSpeakersChange?.(updated);
      return updated;
    });
  }, [onSpeakersChange]);

  // Change speaker color
  const changeSpeakerColor = useCallback((speakerId: string, newColor: string) => {
    setSpeakers(prev => {
      const updated = prev.map(s =>
        s.id === speakerId ? { ...s, color: newColor } : s
      );
      onSpeakersChange?.(updated);
      return updated;
    });
  }, [onSpeakersChange]);

  // Merge two speakers (source -> target)
  const mergeSpeakers = useCallback((sourceId: string, targetId: string) => {
    // Update all segments from source to target
    setSegments(prev => {
      const updated = prev.map(seg =>
        seg.speakerId === sourceId ? { ...seg, speakerId: targetId } : seg
      );
      onSegmentsChange?.(updated);
      return updated;
    });

    // Remove source speaker
    setSpeakers(prev => {
      const updated = prev.filter(s => s.id !== sourceId);
      onSpeakersChange?.(updated);
      return updated;
    });
  }, [onSpeakersChange, onSegmentsChange]);

  // Assign speaker to a segment
  const assignSpeakerToSegment = useCallback((segmentIndex: number, speakerId: string) => {
    setSegments(prev => {
      const updated = [...prev];
      if (updated[segmentIndex]) {
        updated[segmentIndex] = { ...updated[segmentIndex], speakerId };
      }
      onSegmentsChange?.(updated);
      return updated;
    });
  }, [onSegmentsChange]);

  // Split a segment at a specific time
  const splitSegment = useCallback((segmentIndex: number, splitTime: number) => {
    setSegments(prev => {
      const segment = prev[segmentIndex];
      if (!segment || splitTime <= segment.startTime || splitTime >= segment.endTime) {
        return prev;
      }

      const firstHalf: SpeakerSegment = {
        ...segment,
        endTime: splitTime,
        text: '', // Would need word data to split text properly
        wordIndices: segment.wordIndices.filter(i => true), // Would filter based on word times
      };

      const secondHalf: SpeakerSegment = {
        ...segment,
        startTime: splitTime,
        text: '',
        wordIndices: [],
      };

      const updated = [
        ...prev.slice(0, segmentIndex),
        firstHalf,
        secondHalf,
        ...prev.slice(segmentIndex + 1),
      ];

      onSegmentsChange?.(updated);
      return updated;
    });
  }, [onSegmentsChange]);

  // Merge multiple segments
  const mergeSegments = useCallback((segmentIndices: number[]) => {
    if (segmentIndices.length < 2) return;

    setSegments(prev => {
      const sortedIndices = [...segmentIndices].sort((a, b) => a - b);
      const segmentsToMerge = sortedIndices.map(i => prev[i]).filter(Boolean);

      if (segmentsToMerge.length < 2) return prev;

      // Use the speaker from the first segment
      const merged: SpeakerSegment = {
        speakerId: segmentsToMerge[0].speakerId,
        startTime: Math.min(...segmentsToMerge.map(s => s.startTime)),
        endTime: Math.max(...segmentsToMerge.map(s => s.endTime)),
        text: segmentsToMerge.map(s => s.text).join(' '),
        wordIndices: segmentsToMerge.flatMap(s => s.wordIndices),
      };

      // Remove old segments and add merged one
      const updated = prev.filter((_, i) => !sortedIndices.includes(i));

      // Insert at the position of the first merged segment
      updated.splice(sortedIndices[0], 0, merged);

      onSegmentsChange?.(updated);
      return updated;
    });
  }, [onSegmentsChange]);

  // Get speaker for a specific time
  const getSpeakerForTime = useCallback((timeSeconds: number): Speaker | undefined => {
    const segment = segments.find(
      seg => timeSeconds >= seg.startTime && timeSeconds <= seg.endTime
    );
    if (!segment) return undefined;
    return speakers.find(s => s.id === segment.speakerId);
  }, [segments, speakers]);

  // Get speaker for a word index
  const getSpeakerForWord = useCallback((wordIndex: number): Speaker | undefined => {
    const segment = segments.find(seg => seg.wordIndices.includes(wordIndex));
    if (!segment) return undefined;
    return speakers.find(s => s.id === segment.speakerId);
  }, [segments, speakers]);

  // Get all segments for a speaker
  const getSegmentsForSpeaker = useCallback((speakerId: string): SpeakerSegment[] => {
    return segments.filter(seg => seg.speakerId === speakerId);
  }, [segments]);

  // Calculate speaker statistics
  const getSpeakerStats = useCallback((): SpeakerStats[] => {
    const totalDuration = segments.reduce((sum, seg) => sum + (seg.endTime - seg.startTime), 0);

    return speakers.map(speaker => {
      const speakerSegments = segments.filter(seg => seg.speakerId === speaker.id);
      const totalTime = speakerSegments.reduce(
        (sum, seg) => sum + (seg.endTime - seg.startTime),
        0
      );
      const wordCount = speakerSegments.reduce(
        (sum, seg) => sum + seg.wordIndices.length,
        0
      );

      return {
        speaker,
        totalTime,
        segmentCount: speakerSegments.length,
        wordCount,
        percentage: totalDuration > 0 ? (totalTime / totalDuration) * 100 : 0,
      };
    });
  }, [speakers, segments]);

  // Detect speakers from words (placeholder for ML integration)
  const detectSpeakers = useCallback(async (words: WordWithSpeaker[]): Promise<void> => {
    setIsDetecting(true);

    try {
      // Placeholder: In production, this would call an ML service
      // For now, we'll create mock segments based on pauses in speech

      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing

      // Create default speakers if none exist
      let currentSpeakers = speakers;
      if (currentSpeakers.length === 0) {
        const speaker1: Speaker = {
          id: generateSpeakerId(),
          name: 'Speaker 1',
          color: SPEAKER_COLORS[0],
        };
        const speaker2: Speaker = {
          id: generateSpeakerId(),
          name: 'Speaker 2',
          color: SPEAKER_COLORS[1],
        };
        currentSpeakers = [speaker1, speaker2];
        setSpeakers(currentSpeakers);
        onSpeakersChange?.(currentSpeakers);
      }

      // Create mock segments based on gaps in speech
      const newSegments: SpeakerSegment[] = [];
      let currentSegment: Partial<SpeakerSegment> | null = null;
      let currentSpeakerIndex = 0;

      words.forEach((word, index) => {
        const gap = currentSegment ? word.start - (words[index - 1]?.end || 0) : 0;

        // Start new segment if gap is > 2 seconds or first word
        if (!currentSegment || gap > 2) {
          if (currentSegment) {
            newSegments.push(currentSegment as SpeakerSegment);
            // Switch speaker on long pause
            if (gap > 2) {
              currentSpeakerIndex = (currentSpeakerIndex + 1) % currentSpeakers.length;
            }
          }

          currentSegment = {
            speakerId: currentSpeakers[currentSpeakerIndex].id,
            startTime: word.start,
            endTime: word.end,
            text: word.word,
            wordIndices: [index],
          };
        } else {
          // Add to current segment
          currentSegment.endTime = word.end;
          currentSegment.text += ' ' + word.word;
          currentSegment.wordIndices?.push(index);
        }
      });

      // Add final segment
      if (currentSegment) {
        newSegments.push(currentSegment as SpeakerSegment);
      }

      setSegments(newSegments);
      onSegmentsChange?.(newSegments);
    } finally {
      setIsDetecting(false);
    }
  }, [speakers, onSpeakersChange, onSegmentsChange]);

  return {
    // State
    speakers,
    segments,

    // Speaker management
    addSpeaker,
    removeSpeaker,
    renameSpeaker,
    changeSpeakerColor,
    mergeSpeakers,

    // Segment management
    assignSpeakerToSegment,
    splitSegment,
    mergeSegments,

    // Utilities
    getSpeakerForTime,
    getSpeakerForWord,
    getSegmentsForSpeaker,
    getSpeakerStats,

    // Auto-detection
    detectSpeakers,
    isDetecting,
  };
}

export default useSpeakerDiarization;
