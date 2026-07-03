import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/tauri";
import {
	Brain,
	Code2,
	Copy,
	Cpu,
	Download,
	Eye,
	FilePlus,
	FolderOpen,
	Globe,
	Mic,
	Save,
	Settings,
	Sparkles,
	Square,
	Star,
	Trash2,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AgentControlPanel } from "./components/AgentControlPanel";
import { AIFeaturesPanel } from "./components/AIFeaturesPanel";
import { CodeIntelligenceDashboard } from "./components/CodeIntelligenceDashboard";
import { CodingAssistantPanel } from "./components/CodingAssistantPanel";
import { FloatingDictationButton } from "./components/FloatingDictationButton";
import { GlobalDictationSettings } from "./components/GlobalDictationSettings";
// import { Window } from '@tauri-apps/api/window'; // TODO: Use for window management
import { PricingModal } from "./components/PricingModal";
import { VisionPanel } from "./components/VisionPanel";
import {
	getTauriStreamingService,
	type StreamingEvent,
} from "./services/tauri-streaming.service";

// SpeechRecognition type declarations for Web Speech API
interface ISpeechRecognition extends EventTarget {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	onstart: ((ev: Event) => void) | null;
	onresult: ((ev: ISpeechRecognitionEvent) => void) | null;
	onerror: ((ev: ISpeechRecognitionErrorEvent) => void) | null;
	onend: ((ev: Event) => void) | null;
	start: () => void;
	stop: () => void;
}

interface ISpeechRecognitionEvent extends Event {
	resultIndex: number;
	results: ISpeechRecognitionResultList;
}

interface ISpeechRecognitionResultList {
	length: number;
	[index: number]: ISpeechRecognitionResult;
}

interface ISpeechRecognitionResult {
	isFinal: boolean;
	length: number;
	[index: number]: { transcript: string; confidence: number };
}

interface ISpeechRecognitionErrorEvent extends Event {
	error: string;
}

// Types for our enhanced application
interface Settings {
	language: string;
	voice_model: string;
	hotkey: string;
	auto_start: boolean;
	theme: string;
	notifications: boolean;
	voice_commands_enabled?: boolean;
	voice_recognition: VoiceRecognitionSettings;
	text_processing: TextProcessingSettings;
}

interface VoiceRecognitionSettings {
	continuous: boolean;
	interim_results: boolean;
	max_alternatives: number;
	confidence_threshold: number;
	noise_reduction: boolean;
	privacy_mode: boolean;
}

interface TextProcessingSettings {
	context: string;
	tone: string;
	aggressiveness: number;
	remove_fillers: boolean;
	enable_caching: boolean;
	smart_punctuation: boolean;
	auto_correct: boolean;
}

interface ProcessingResult {
	id: string;
	original_text: string;
	processed_text: string;
	confidence_score: number;
	processing_time_ms: number;
	changes_made: Array<{
		change_type: string;
		original: string;
		replacement: string;
		confidence: number;
	}>;
}

interface Language {
	code: string;
	name: string;
	native_name: string;
	flag: string;
}

// TODO: Use VoiceStatus interface for real-time voice processing
// interface VoiceStatus {
//   is_listening: boolean;
//   is_processing: boolean;
//   current_transcript: string;
//   response: string;
//   engine_type: string;
//   session_id: string;
// }

interface AppInfo {
	name: string;
	version: string;
	platform: string;
	description: string;
}

// Enhanced App Component
const App: React.FC = () => {
	const [isListening, setIsListening] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [transcript, setTranscript] = useState("");
	const [response, setResponse] = useState("");
	const [settings, setSettings] = useState<Settings | null>(null);
	const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
	const [error, setError] = useState("");
	const [supportedLanguages, setSupportedLanguages] = useState<Language[]>([]);
	const [showSettings, setShowSettings] = useState(false);
	const [showPricing, setShowPricing] = useState(false);
	const [processingResult, setProcessingResult] =
		useState<ProcessingResult | null>(null);
	const [confidence, setConfidence] = useState(0);

	// Browser Speech Recognition (using native browser API - no WebSocket needed)
	const recognitionRef = useRef<ISpeechRecognition | null>(null);
	const [interimTranscript, setInterimTranscript] = useState("");

	// Global dictation state
	const [isGlobalDictationActive, setIsGlobalDictationActive] = useState(false);
	const [, setGlobalDictationText] = useState("");
	const [showGlobalDictationSettings, setShowGlobalDictationSettings] =
		useState(false);

	// Floating button state
	const [showFloatingButton] = useState(true);
	const [floatingButtonPosition] = useState<
		"bottom-right" | "bottom-left" | "top-right" | "top-left"
	>("bottom-right");

	// AI Features Panel state
	const [showAIPanel, setShowAIPanel] = useState(false);

	// Coding Assistant Panel state
	const [showCodingPanel, setShowCodingPanel] = useState(false);
	const [codingVoiceText, setCodingVoiceText] = useState<string | undefined>(
		undefined,
	);

	// Agent Control Panel state
	const [showAgentPanel, setShowAgentPanel] = useState(false);

	// Vision Panel state
	const [showVisionPanel, setShowVisionPanel] = useState(false);

	// Code Intelligence Dashboard state
	const [showCodeIntelPanel, setShowCodeIntelPanel] = useState(false);

	// Streaming state
	const [streamingActive, setStreamingActive] = useState(false);
	const [streamingLatency, setStreamingLatency] = useState(0);
	const [audioLevel, setAudioLevel] = useState(0);

	// Keyboard shortcuts: Ctrl+Shift+A (AI panel), Ctrl+Shift+C (Coding panel)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.ctrlKey && e.shiftKey && e.key === "A") {
				e.preventDefault();
				setShowAIPanel((prev) => !prev);
			}
			if (e.ctrlKey && e.shiftKey && e.key === "C") {
				e.preventDefault();
				setShowCodingPanel((prev) => !prev);
			}
			if (e.ctrlKey && e.shiftKey && e.key === "G") {
				e.preventDefault();
				setShowAgentPanel((prev) => !prev);
			}
			if (e.ctrlKey && e.shiftKey && e.key === "V") {
				e.preventDefault();
				setShowVisionPanel((prev) => !prev);
			}
			if (e.ctrlKey && e.shiftKey && e.key === "I") {
				e.preventDefault();
				setShowCodeIntelPanel((prev) => !prev);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	// Initialize application
	useEffect(() => {
		const initializeApp = async () => {
			try {
				// Reset processing state on mount to prevent stuck state
				setIsProcessing(false);
				setError("");

				// Load initial data
				const [settingsData, appData, languagesData] = await Promise.all([
					invoke<Settings>("get_settings"),
					invoke<AppInfo>("get_app_info"),
					invoke<Language[]>("get_supported_languages_tauri"),
				]);

				// Enable voice commands by default if not set
				if (settingsData.voice_commands_enabled === undefined) {
					settingsData.voice_commands_enabled = true;
				}

				setSettings(settingsData);
				setAppInfo(appData);
				setSupportedLanguages(languagesData);

				// Initialize voice recognition
				// TODO: Fix Window API usage
				// const mainWindow = new Window('main');
				// await invoke('initialize_voice_recognition', { window: mainWindow });

				// Initialize text processor
				await invoke("initialize_text_processor");

				// Initialize LLM client (reads API keys from environment)
				try {
					const llmStatus = await invoke<string>("initialize_llm_client", {
						provider: null,
						apiKey: null,
						modelId: null,
					});
					console.log("LLM client:", llmStatus);
				} catch (llmErr) {
					console.warn("LLM client init (template fallback active):", llmErr);
				}

				console.log("VoiceCode initialized successfully");
			} catch (err) {
				console.error("Failed to initialize application:", err);
				setError("Failed to initialize application");
				setIsProcessing(false); // Ensure processing state is reset on error
			}
		};

		initializeApp();
	}, []);

	// Initialize streaming event bridge
	useEffect(() => {
		const streamingService = getTauriStreamingService();

		const handleStreamingEvent = (event: StreamingEvent) => {
			switch (event.event_type) {
				case "connected":
					setStreamingActive(true);
					break;
				case "disconnected":
					setStreamingActive(false);
					setAudioLevel(0);
					break;
				case "interim":
					if (event.text) {
						setInterimTranscript(event.text);
					}
					if (event.latency_ms != null) {
						setStreamingLatency(event.latency_ms);
					}
					break;
				case "final":
					if (event.text) {
						// Route final transcription to the appropriate panel
						if (showCodingPanel) {
							setCodingVoiceText(event.text);
						} else {
							setTranscript((prev) => prev + (prev ? " " : "") + event.text);
						}
						setInterimTranscript("");
					}
					if (event.confidence != null) {
						setConfidence(event.confidence);
					}
					if (event.latency_ms != null) {
						setStreamingLatency(event.latency_ms);
					}
					break;
				case "enhanced":
					if (event.text) {
						// Enhanced replaces the last final result
						if (showCodingPanel) {
							setCodingVoiceText(event.text);
						} else {
							setTranscript((prev) => {
								// Replace last segment with enhanced version
								if (event.original_text) {
									const idx = prev.lastIndexOf(event.original_text);
									if (idx >= 0) {
										return prev.slice(0, idx) + event.text;
									}
								}
								return prev;
							});
						}
					}
					break;
				case "audio_level":
					if (event.audio_level != null) {
						setAudioLevel(event.audio_level);
					}
					break;
				case "error":
					if (event.error) {
						setError(`Streaming: ${event.error}`);
					}
					break;
			}
		};

		streamingService.on(handleStreamingEvent);
		streamingService.init().catch((err: unknown) => {
			console.warn("Streaming bridge init (non-critical):", err);
		});

		return () => {
			streamingService.off(handleStreamingEvent);
		};
	}, [showCodingPanel]);

	// Set up event listeners
	useEffect(() => {
		const unlistenFunctions: UnlistenFn[] = [];

		const setupEventListeners = async () => {
			try {
				// Voice status events
				unlistenFunctions.push(
					await listen("voice-status", (event) => {
						const status = event.payload as string;
						setIsListening(status === "listening");
						if (status === "listening") {
							setError("");
						}
					}),
				);

				// Speech transcript events
				unlistenFunctions.push(
					await listen("speech-transcript", async (event) => {
						const transcriptData = event.payload as string;
						setTranscript(transcriptData);
						setIsProcessing(true);

						// If global dictation is active, update the global dictation text
						if (isGlobalDictationActive) {
							try {
								await invoke("update_global_dictation_text", {
									text: transcriptData,
								});
								setGlobalDictationText(transcriptData);
							} catch (err) {
								console.error("Failed to update global dictation text:", err);
							}
						}
					}),
				);

				// Voice response events
				unlistenFunctions.push(
					await listen("voice-response", (event) => {
						const responseData = event.payload as string;
						setResponse(responseData);
						setIsProcessing(false);
					}),
				);

				// Audio metrics events
				unlistenFunctions.push(
					await listen("audio-metrics", (event) => {
						const metrics = event.payload as Record<string, unknown>;
						// Could be used to update audio visualization
						console.log("Audio metrics:", metrics);
					}),
				);

				// System tray actions
				unlistenFunctions.push(
					await listen("tray-action", (event) => {
						const action = event.payload as string;
						handleTrayAction(action);
					}),
				);

				// Global dictation toggle event (triggered by hotkey Ctrl+Shift+D)
				unlistenFunctions.push(
					await listen("global-dictation-toggle", async () => {
						if (isGlobalDictationActive) {
							// Stop global dictation
							try {
								await invoke<string>("stop_global_dictation");
								setGlobalDictationText("");
								setIsGlobalDictationActive(false);
							} catch (err) {
								console.error("Failed to stop global dictation:", err);
							}
						} else {
							// Start global dictation
							try {
								await invoke("start_global_dictation");
								setIsGlobalDictationActive(true);
								setGlobalDictationText("");
								// Start voice recognition
								if (!isListening) {
									await startListening();
								}
							} catch (err) {
								console.error("Failed to start global dictation:", err);
							}
						}
					}),
				);
			} catch (err) {
				console.error("Failed to setup event listeners:", err);
				setError("Failed to setup event listeners");
			}
		};

		setupEventListeners();

		return () => {
			unlistenFunctions.forEach((unlisten) => unlisten());
		};
	}, [isGlobalDictationActive, isListening]);

	const handleTrayAction = useCallback(
		async (action: string) => {
			switch (action) {
				case "start_listening":
					await startListening();
					break;
				case "stop_listening":
					await stopListening();
					break;
				case "settings":
					setShowSettings(!showSettings);
					break;
				default:
					break;
			}
		},
		[showSettings],
	);

	// Voice command processing function
	const processVoiceCommands = (text: string): string => {
		if (!settings?.voice_commands_enabled) {
			return text;
		}

		let processedText = text;

		// Voice command mappings (case-insensitive)
		const commands: { [key: string]: string } = {
			// Punctuation
			comma: ",",
			period: ".",
			"question mark": "?",
			"exclamation point": "!",
			"exclamation mark": "!",
			colon: ":",
			semicolon: ";",
			apostrophe: "'",
			quote: '"',
			"open quote": '"',
			"close quote": '"',
			dash: "-",
			hyphen: "-",

			// Line breaks
			"new line": "\n",
			"new paragraph": "\n\n",
			"line break": "\n",

			// Special characters
			"at sign": "@",
			hashtag: "#",
			"dollar sign": "$",
			percent: "%",
			ampersand: "&",
			asterisk: "*",
			plus: "+",
			equals: "=",
			underscore: "_",
			slash: "/",
			backslash: "\\",

			// Brackets
			"open parenthesis": "(",
			"close parenthesis": ")",
			"open bracket": "[",
			"close bracket": "]",
			"open brace": "{",
			"close brace": "}",
		};

		// Replace voice commands with their symbols
		for (const [command, symbol] of Object.entries(commands)) {
			const regex = new RegExp(`\\b${command}\\b`, "gi");
			processedText = processedText.replace(regex, symbol);
		}

		// Handle "delete that" command - remove last word
		if (/\bdelete that\b/i.test(processedText)) {
			processedText = processedText.replace(/\bdelete that\b/i, "").trim();
			// Remove last word from transcript
			setTranscript((prev) => {
				const words = prev.trim().split(/\s+/);
				words.pop();
				return words.join(" ");
			});
			return "";
		}

		// Handle "select all" command
		if (/\bselect all\b/i.test(processedText)) {
			// This would need to be handled by the UI
			console.log("Select all command detected");
			return processedText.replace(/\bselect all\b/i, "").trim();
		}

		return processedText;
	};

	// Initialize Browser Speech Recognition (using native browser API - no WebSocket)
	useEffect(() => {
		// Use browser's built-in speech recognition
		const win = window as Window & {
			SpeechRecognition?: new () => ISpeechRecognition;
			webkitSpeechRecognition?: new () => ISpeechRecognition;
		};
		const SpeechRecognitionCtor =
			win.SpeechRecognition || win.webkitSpeechRecognition;

		if (SpeechRecognitionCtor) {
			const recognition = new SpeechRecognitionCtor();
			recognition.continuous = true;
			recognition.interimResults = true;
			recognition.lang = settings?.language || "en-US";

			recognition.onstart = () => {
				console.log("✅ Speech recognition started");
				setError("");
			};

			recognition.onresult = async (event: ISpeechRecognitionEvent) => {
				let interimText = "";
				let finalText = "";

				for (let i = event.resultIndex; i < event.results.length; i++) {
					const result = event.results[i];
					if (result.isFinal) {
						finalText += result[0].transcript;
						setConfidence(result[0].confidence || 0.9);
					} else {
						interimText += result[0].transcript;
					}
				}

				if (finalText) {
					// Check if coding panel is open — if so, route to coding assistant
					if (showCodingPanel) {
						setCodingVoiceText(finalText.trim());
						setInterimTranscript("");
						return;
					}

					// Auto-detect coding intent: if text starts with a coding verb,
					// open the coding panel and route there
					const codingPrefixes = [
						"create ",
						"generate ",
						"explain ",
						"refactor ",
						"fix ",
						"debug ",
						"run ",
						"execute ",
						"add test",
						"document ",
						"go to ",
					];
					const lower = finalText.toLowerCase().trim();
					const isCodingCommand = codingPrefixes.some((p) =>
						lower.startsWith(p),
					);

					if (isCodingCommand) {
						setShowCodingPanel(true);
						setCodingVoiceText(finalText.trim());
						setInterimTranscript("");
						return;
					}

					// Default: process as regular dictation text
					const processedText = processVoiceCommands(finalText);
					setTranscript((prev) => prev + (prev ? " " : "") + processedText);
					setInterimTranscript("");
				} else {
					setInterimTranscript(interimText);
				}
			};

			recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
				console.error("❌ Speech recognition error:", event.error);
				if (event.error !== "no-speech") {
					setError(`Speech recognition error: ${event.error}`);
				}
				setIsListening(false);
			};

			recognition.onend = () => {
				console.log("🔌 Speech recognition ended");
				setIsListening(false);
			};

			recognitionRef.current = recognition;
		} else {
			setError("Speech recognition not supported in this browser");
		}
	}, [settings?.language]);

	const startListening = async () => {
		try {
			setError("");

			// Use browser speech recognition (native API - no WebSocket)
			if (recognitionRef.current) {
				recognitionRef.current.start();
				setIsListening(true);
			} else {
				throw new Error("Speech recognition not initialized");
			}
		} catch (err) {
			console.error("Failed to start listening:", err);
			setError(
				"Failed to start listening: " +
					(err instanceof Error ? err.message : String(err)),
			);
		}
	};

	const stopListening = async () => {
		try {
			// Stop browser speech recognition
			if (recognitionRef.current) {
				recognitionRef.current.stop();
			}
			setIsListening(false);
		} catch (err) {
			console.error("Failed to stop listening:", err);
			setError("Failed to stop listening");
		}
	};

	const processTranscript = async (transcriptText: string) => {
		try {
			setIsProcessing(true);
			setError(""); // Clear any previous errors

			const result = await invoke<ProcessingResult>("process_speech_with_ai", {
				transcript: transcriptText,
			});

			setResponse(result.processed_text);
			setProcessingResult(result);
			setConfidence(result.confidence_score);
			setIsProcessing(false);
		} catch (err) {
			console.error("Failed to process speech:", err);
			setError(`Failed to process speech: ${err}`);
			setIsProcessing(false);
		}
	};

	const toggleListening = async () => {
		if (isListening) {
			await stopListening();
		} else {
			await startListening();
		}
	};

	// TODO: Implement AI text processing
	// const processTextWithAI = async (text: string, context: string = 'email', tone: string = 'professional') => {
	//   try {
	//     const result = await invoke<ProcessingResult>('process_text', {
	//       text,
	//       context,
	//       tone,
	//       state: null
	//     });

	//     setProcessingResult(result);
	//     setResponse(result.processed_text);
	//     setConfidence(result.confidence_score);
	//   } catch (err) {
	//     console.error('Failed to process text:', err);
	//     setError('Failed to process text');
	//   }
	// };

	const openSettings = () => {
		setShowSettings(!showSettings);
	};

	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			// Could show a toast notification here
		} catch (err) {
			console.error("Failed to copy to clipboard:", err);
		}
	};

	const exportTranscript = () => {
		const content = `VoiceCode Transcript\n\nOriginal:\n${transcript}\n\nProcessed:\n${response}\n\nConfidence: ${Math.round(confidence * 100)}%\nGenerated: ${new Date().toLocaleString()}`;

		const blob = new Blob([content], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `voicecode-transcript-${Date.now()}.txt`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	return (
		<div className="vc-app">
			{/* Header: branding + primary action + exposed features */}
			<header className="vc-header">
				<div className="vc-brand">
					<div className="vc-logo" aria-hidden>
						<Mic size={24} strokeWidth={2} />
					</div>
					<div className="vc-title-block">
						<h1 className="vc-title">VoiceCode</h1>
						<p className="vc-tagline">
							Professional dictation & voice recognition
						</p>
					</div>
					{isGlobalDictationActive && (
						<div className="vc-badge vc-badge-global" role="status">
							<Globe size={14} />
							<span>Global dictation</span>
							<kbd>Ctrl+Shift+D</kbd>
						</div>
					)}
				</div>

				<nav className="vc-toolbar" aria-label="Main actions">
					<button
						type="button"
						className={`vc-btn vc-btn-primary ${isListening ? "vc-btn-recording" : ""}`}
						onClick={toggleListening}
						disabled={isProcessing}
						aria-pressed={isListening}
						aria-label={isListening ? "Stop dictation" : "Start dictation"}
					>
						{isListening ? <Square size={18} /> : <Mic size={18} />}
						<span>{isListening ? "Stop dictation" : "Start dictation"}</span>
					</button>

					<div className="vc-toolbar-group" role="group" aria-label="Documents">
						<button
							type="button"
							className="vc-btn vc-btn-icon"
							title="New document"
							aria-label="New document"
						>
							<FilePlus size={18} />
							<span>New</span>
						</button>
						<button
							type="button"
							className="vc-btn vc-btn-icon"
							title="Open"
							aria-label="Open file"
						>
							<FolderOpen size={18} />
							<span>Open</span>
						</button>
						<button
							type="button"
							className="vc-btn vc-btn-icon"
							title="Save"
							onClick={exportTranscript}
							aria-label="Save transcript"
						>
							<Save size={18} />
							<span>Save</span>
						</button>
					</div>

					<div
						className="vc-toolbar-group vc-toolbar-panels"
						role="group"
						aria-label="Panels"
					>
						<button
							type="button"
							className={`vc-btn vc-btn-icon ${showCodingPanel ? "vc-btn-active" : ""}`}
							onClick={() => setShowCodingPanel(!showCodingPanel)}
							title="Coding Assistant (Ctrl+Shift+C)"
							aria-pressed={showCodingPanel}
							aria-label="Coding Assistant"
						>
							<Code2 size={18} />
							<span>Code</span>
						</button>
						<button
							type="button"
							className={`vc-btn vc-btn-icon ${showAgentPanel ? "vc-btn-active" : ""}`}
							onClick={() => setShowAgentPanel(!showAgentPanel)}
							title="Agent Control (Ctrl+Shift+G)"
							aria-pressed={showAgentPanel}
							aria-label="Agent Control"
						>
							<Cpu size={18} />
							<span>Agent</span>
						</button>
						<button
							type="button"
							className={`vc-btn vc-btn-icon ${showVisionPanel ? "vc-btn-active" : ""}`}
							onClick={() => setShowVisionPanel(!showVisionPanel)}
							title="Vision / OCR (Ctrl+Shift+V)"
							aria-pressed={showVisionPanel}
							aria-label="Vision / OCR"
						>
							<Eye size={18} />
							<span>Vision</span>
						</button>
						<button
							type="button"
							className={`vc-btn vc-btn-icon ${showCodeIntelPanel ? "vc-btn-active" : ""}`}
							onClick={() => setShowCodeIntelPanel(!showCodeIntelPanel)}
							title="Code Intelligence (Ctrl+Shift+I)"
							aria-pressed={showCodeIntelPanel}
							aria-label="Code Intelligence"
						>
							<Brain size={18} />
							<span>Code Intel</span>
						</button>
						<button
							type="button"
							className={`vc-btn vc-btn-icon ${showAIPanel ? "vc-btn-active" : ""}`}
							onClick={() => setShowAIPanel(!showAIPanel)}
							title="AI Features (Ctrl+Shift+A)"
							aria-pressed={showAIPanel}
							aria-label="AI Features"
						>
							<Sparkles size={18} />
							<span>AI</span>
						</button>
					</div>

					<div className="vc-toolbar-divider" aria-hidden />

					<button
						type="button"
						className="vc-btn vc-btn-icon"
						onClick={() => setShowGlobalDictationSettings(true)}
						title="Global dictation settings"
						aria-label="Global dictation settings"
					>
						<Globe size={18} />
						<span>Global</span>
					</button>
					<button
						type="button"
						className="vc-btn vc-btn-icon"
						onClick={() => setShowPricing(true)}
						title="Upgrade to Pro"
						aria-label="Upgrade to Pro"
					>
						<Star size={18} />
						<span>Upgrade</span>
					</button>
					<button
						type="button"
						className="vc-btn vc-btn-icon"
						onClick={openSettings}
						title="Settings"
						aria-label="Settings"
					>
						<Settings size={18} />
						<span>Settings</span>
					</button>
				</nav>
			</header>

			{/* Status bar */}
			<div className="vc-status" role="status" aria-live="polite">
				<div className="vc-status-left">
					<div
						className={`vc-status-dot ${isListening ? "vc-status-listening" : ""} ${error ? "vc-status-error" : ""}`}
					/>
					<span className="vc-status-label">
						{error
							? "Error"
							: isListening
								? "Listening…"
								: isProcessing
									? "Processing…"
									: "Ready"}
					</span>
					<div
						className="vc-status-audio"
						role="group"
						aria-label="Audio level"
					>
						<span>Level</span>
						<div className="vc-audio-bars">
							{[...Array(10)].map((_, i) => (
								<div
									key={`audio-bar-${i}`}
									className={`vc-audio-bar ${i < (streamingActive ? Math.round(audioLevel * 10) : isListening ? 7 : 0) ? "vc-audio-bar-on" : ""}`}
								/>
							))}
						</div>
					</div>
					{streamingActive && streamingLatency > 0 && (
						<span className="vc-latency">{streamingLatency}ms</span>
					)}
				</div>
				<div className="vc-status-right">
					<span className="vc-accuracy">
						Accuracy: {Math.round(confidence * 100)}%
					</span>
					<select
						className="vc-lang-select"
						value={settings?.language || "en-US"}
						disabled={isListening}
						aria-label="Dictation language"
					>
						{supportedLanguages.slice(0, 5).map((lang) => (
							<option key={lang.code} value={lang.code}>
								{lang.flag} {lang.name}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Main content */}
			<main className="vc-main">
				<section className="vc-dictation" aria-label="Dictation">
					<div className="vc-dictation-head">
						<h2 className="vc-dictation-title">Dictation</h2>
						<div className="vc-dictation-actions">
							<button
								type="button"
								className="vc-btn vc-btn-ghost"
								title="Clear"
								onClick={() => setTranscript("")}
								disabled={!transcript}
								aria-label="Clear"
							>
								<Trash2 size={16} />
							</button>
							<button
								type="button"
								className="vc-btn vc-btn-ghost"
								title="Copy"
								onClick={() => copyToClipboard(transcript)}
								disabled={!transcript}
								aria-label="Copy"
							>
								<Copy size={16} />
							</button>
							<button
								type="button"
								className="vc-btn vc-btn-ghost"
								title="Export"
								onClick={exportTranscript}
								disabled={!transcript}
								aria-label="Export"
							>
								<Download size={16} />
							</button>
						</div>
					</div>
					<div className="vc-dictation-body">
						{!transcript && !interimTranscript ? (
							<div className="vc-dictation-empty">
								<Mic
									size={48}
									strokeWidth={1.5}
									className="vc-dictation-empty-icon"
									aria-hidden
								/>
								<p className="vc-dictation-empty-title">Ready to dictate</p>
								<p className="vc-dictation-empty-hint">
									Click <strong>Start dictation</strong> or use your hotkey to
									begin.
								</p>
								<details className="vc-tips">
									<summary>Voice tips</summary>
									<ul>
										<li>
											Say &ldquo;comma&rdquo;, &ldquo;period&rdquo;, &ldquo;new
											line&rdquo; for punctuation.
										</li>
										<li>
											Use &ldquo;delete that&rdquo; or &ldquo;select all&rdquo;
											for editing.
										</li>
									</ul>
								</details>
							</div>
						) : (
							<div className="vc-dictation-text">
								{transcript}
								{interimTranscript && (
									<span className="vc-interim"> {interimTranscript}</span>
								)}
								{isProcessing && (
									<span className="vc-cursor" aria-hidden>
										|
									</span>
								)}
							</div>
						)}
						{transcript && (
							<div className="vc-dictation-stats">
								<span>
									Words: {transcript.split(/\s+/).filter(Boolean).length}
								</span>
								<span>Characters: {transcript.length}</span>
								<span>Accuracy: {Math.round(confidence * 100)}%</span>
							</div>
						)}
					</div>
				</section>

				<aside className="vc-sidebar" aria-label="AI &amp; commands">
					<div className="vc-card">
						<h3 className="vc-card-title">AI enhancement</h3>
						<div className="vc-form-row">
							<label>
								<span>Context</span>
								<select
									value={settings?.text_processing.context || "email"}
									onChange={(e) =>
										settings &&
										setSettings({
											...settings,
											text_processing: {
												...settings.text_processing,
												context: e.target.value,
											},
										})
									}
									aria-label="Context"
								>
									<option value="email">Email</option>
									<option value="document">Document</option>
									<option value="medical">Medical</option>
									<option value="legal">Legal</option>
									<option value="technical">Technical</option>
								</select>
							</label>
						</div>
						<div className="vc-form-row">
							<label>
								<span>Tone</span>
								<select
									value={settings?.text_processing.tone || "professional"}
									onChange={(e) =>
										settings &&
										setSettings({
											...settings,
											text_processing: {
												...settings.text_processing,
												tone: e.target.value,
											},
										})
									}
									aria-label="Tone"
								>
									<option value="professional">Professional</option>
									<option value="friendly">Friendly</option>
									<option value="formal">Formal</option>
									<option value="casual">Casual</option>
								</select>
							</label>
						</div>
						<button
							type="button"
							className="vc-btn vc-btn-secondary vc-btn-enhance"
							onClick={() => transcript && processTranscript(transcript)}
							disabled={!transcript || isProcessing}
							aria-label="Enhance text with AI"
						>
							<Sparkles size={16} />
							Enhance text
						</button>
						{response && (
							<div className="vc-enhanced">
								<p className="vc-enhanced-label">Enhanced</p>
								<div className="vc-enhanced-text">{response}</div>
								<div className="vc-enhanced-actions">
									<button
										type="button"
										className="vc-btn vc-btn-ghost"
										onClick={() => copyToClipboard(response)}
									>
										Copy
									</button>
									<button
										type="button"
										className="vc-btn vc-btn-ghost"
										onClick={exportTranscript}
									>
										Save
									</button>
								</div>
							</div>
						)}
					</div>

					<div className="vc-card">
						<h3 className="vc-card-title">Voice commands</h3>
						<ul className="vc-commands-list">
							<li>
								<kbd>New line</kbd> — new paragraph
							</li>
							<li>
								<kbd>Period</kbd> — insert period
							</li>
							<li>
								<kbd>Comma</kbd> — insert comma
							</li>
							<li>
								<kbd>Delete that</kbd> — remove last word
							</li>
							<li>
								<kbd>Select all</kbd> — select all text
							</li>
						</ul>
					</div>

					{processingResult && (
						<div className="vc-card">
							<h3 className="vc-card-title">Statistics</h3>
							<dl className="vc-stats-dl">
								<div>
									<dt>Processing time</dt>
									<dd>{processingResult.processing_time_ms}ms</dd>
								</div>
								<div>
									<dt>Changes</dt>
									<dd>{processingResult.changes_made.length}</dd>
								</div>
								<div>
									<dt>Confidence</dt>
									<dd>{Math.round(confidence * 100)}%</dd>
								</div>
							</dl>
						</div>
					)}
				</aside>

				{/* Slide-out panels */}
				{showAIPanel && (
					<aside className="ai-features-panel-container vc-panel">
						<AIFeaturesPanel
							transcript={transcript || ""}
							autoAnalyze={false}
							onClose={() => setShowAIPanel(false)}
						/>
					</aside>
				)}
				{showCodingPanel && (
					<aside
						className="coding-assistant-panel-container vc-panel"
						style={{ width: "400px", minWidth: "320px" }}
					>
						<CodingAssistantPanel
							voiceText={codingVoiceText}
							onClose={() => setShowCodingPanel(false)}
							visible={showCodingPanel}
						/>
					</aside>
				)}
				{showAgentPanel && (
					<aside
						className="agent-control-panel-container vc-panel"
						style={{ width: "380px", minWidth: "300px" }}
					>
						<AgentControlPanel
							onClose={() => setShowAgentPanel(false)}
							visible={showAgentPanel}
						/>
					</aside>
				)}
				{showVisionPanel && (
					<aside
						className="vision-panel-container vc-panel"
						style={{ width: "380px", minWidth: "300px" }}
					>
						<VisionPanel
							onClose={() => setShowVisionPanel(false)}
							visible={showVisionPanel}
						/>
					</aside>
				)}
				{showCodeIntelPanel && (
					<aside
						className="code-intel-panel-container vc-panel"
						style={{ width: "380px", minWidth: "300px" }}
					>
						<CodeIntelligenceDashboard
							onClose={() => setShowCodeIntelPanel(false)}
							visible={showCodeIntelPanel}
						/>
					</aside>
				)}
			</main>

			<footer className="vc-footer">
				<div className="vc-footer-left">
					<span className="vc-footer-version">
						{appInfo
							? `${appInfo.name ?? "VoiceCode"} v${appInfo.version}`
							: "VoiceCode"}{" "}
						· {appInfo?.platform ?? "desktop"}
					</span>
				</div>
				<div className="vc-footer-center">
					{error && (
						<span className="vc-footer-error" role="alert">
							⚠ {error}
						</span>
					)}
				</div>
				<div className="vc-footer-right">
					<button
						type="button"
						className="vc-footer-link"
						onClick={() => setShowPricing(true)}
					>
						Upgrade to Pro
					</button>
					<span className="vc-footer-sep" aria-hidden>
						·
					</span>
					<button
						type="button"
						className="vc-footer-link"
						onClick={openSettings}
					>
						Help &amp; Support
					</button>
				</div>
			</footer>

			{/* Settings Modal (simplified for now) */}
			{showSettings && (
				<div className="settings-modal">
					<div className="settings-content">
						<div className="settings-header">
							<h2>⚙️ Settings</h2>
							<button
								type="button"
								className="close-button"
								onClick={() => setShowSettings(false)}
							>
								✕
							</button>
						</div>
						<div className="settings-body">
							<div className="setting-group">
								<h3>Voice Recognition</h3>
								<label>
									<input
										type="checkbox"
										checked={settings?.voice_recognition.continuous || false}
									/>
									Continuous Recognition
								</label>
								<label>
									<input
										type="checkbox"
										checked={
											settings?.voice_recognition.noise_reduction || false
										}
									/>
									Noise Reduction
								</label>
								<label>
									<input
										type="checkbox"
										checked={settings?.voice_recognition.privacy_mode || false}
									/>
									Privacy Mode (Offline Processing)
								</label>
							</div>

							<div className="setting-group">
								<h3>AI Text Processing</h3>
								<label>
									<input
										type="checkbox"
										checked={settings?.text_processing.auto_correct || false}
									/>
									Auto Correct Grammar
								</label>
								<label>
									<input
										type="checkbox"
										checked={
											settings?.text_processing.smart_punctuation || false
										}
									/>
									Smart Punctuation
								</label>
								<label>
									<input
										type="checkbox"
										checked={settings?.text_processing.remove_fillers || false}
									/>
									Remove Filler Words
								</label>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Pricing Modal */}
			<PricingModal
				isOpen={showPricing}
				onClose={() => setShowPricing(false)}
			/>

			{/* Global Dictation Settings Modal */}
			{showGlobalDictationSettings && (
				<GlobalDictationSettings
					onClose={() => setShowGlobalDictationSettings(false)}
				/>
			)}

			{/* Floating Dictation Button */}
			<FloatingDictationButton
				onStartDictation={startListening}
				onStopDictation={stopListening}
				isRecording={isListening}
				position={floatingButtonPosition}
				size="medium"
				showTimer={true}
				enabled={showFloatingButton}
			/>
		</div>
	);
};

export default App;
