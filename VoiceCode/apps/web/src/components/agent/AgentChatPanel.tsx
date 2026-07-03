/**
 * Agent Chat Panel - Integrated Chat for Split-View Dashboard
 * Features: OCR, Computer Vision, Web Search, Streaming Responses
 */

import DOMPurify from "dompurify";
import {
	Bot,
	Brain,
	Check,
	Copy,
	Eye,
	FileText,
	Globe,
	Image,
	ListChecks,
	Maximize2,
	Mic,
	MicOff,
	Minimize2,
	Paperclip,
	Scan,
	Search,
	Send,
	Settings,
	Sparkles,
	Stethoscope,
	StopCircle,
	ThumbsDown,
	ThumbsUp,
	User,
	X,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	agentCapabilities,
	type OCRResult,
	type VisionAnalysisResult,
	type WebSearchResult,
} from "../../services/agentCapabilities.service";

// Types
interface Message {
	id: string;
	role: "user" | "assistant" | "system";
	content: string;
	timestamp: Date;
	isStreaming?: boolean;
	attachments?: Attachment[];
	capabilities?: UsedCapability[];
	metadata?: {
		model?: string;
		tokens?: number;
	};
	feedback?: "positive" | "negative";
}

interface Attachment {
	id: string;
	name: string;
	type: "image" | "file" | "transcript";
	preview?: string;
	data?: string;
}

interface UsedCapability {
	type: "ocr" | "vision" | "search" | "medical-search";
	result?: OCRResult | VisionAnalysisResult | WebSearchResult;
	status: "pending" | "complete" | "error";
}

interface QuickAction {
	id: string;
	icon: React.ReactNode;
	label: string;
	prompt: string;
	capability?: "ocr" | "vision" | "search";
}

const quickActions: QuickAction[] = [
	{
		id: "summarize",
		icon: <FileText size={16} />,
		label: "Summarize",
		prompt: "Summarize the current transcript",
	},
	{
		id: "soap",
		icon: <Stethoscope size={16} />,
		label: "SOAP Note",
		prompt: "Generate a SOAP note from the transcript",
	},
	{
		id: "actions",
		icon: <ListChecks size={16} />,
		label: "Actions",
		prompt: "Extract action items from the transcript",
	},
	{
		id: "insights",
		icon: <Brain size={16} />,
		label: "Insights",
		prompt: "What are the key insights?",
	},
	{
		id: "search",
		icon: <Globe size={16} />,
		label: "Search",
		prompt: "Search for: ",
		capability: "search",
	},
	{
		id: "ocr",
		icon: <Scan size={16} />,
		label: "OCR",
		prompt: "Extract text from the uploaded image",
		capability: "ocr",
	},
];

interface AgentChatPanelProps {
	transcriptContext?: string;
	isExpanded?: boolean;
	onToggleExpand?: () => void;
	className?: string;
}

export const AgentChatPanel: React.FC<AgentChatPanelProps> = ({
	transcriptContext,
	isExpanded = true,
	onToggleExpand,
	className = "",
}) => {
	// State
	const [messages, setMessages] = useState<Message[]>([]);
	const [inputValue, setInputValue] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [isRecording, setIsRecording] = useState(false);
	const [attachments, setAttachments] = useState<Attachment[]>([]);
	const [copiedId, setCopiedId] = useState<string | null>(null);
	const [showCapabilities, setShowCapabilities] = useState(false);
	const [activeCapability, setActiveCapability] = useState<string | null>(null);

	// Refs
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Auto-scroll
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	// Auto-resize textarea
	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.style.height = "auto";
			inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
		}
	}, [inputValue]);

	// Process capabilities before sending
	const processCapabilities = useCallback(
		async (
			userMessage: string,
			messageAttachments: Attachment[],
		): Promise<{ enhancedPrompt: string; capabilities: UsedCapability[] }> => {
			const capabilities: UsedCapability[] = [];
			let enhancedPrompt = userMessage;

			// Check for image attachments - run OCR/Vision
			for (const att of messageAttachments) {
				if (att.type === "image" && att.data) {
					// Determine if user wants OCR or vision analysis
					const wantsOCR =
						userMessage.toLowerCase().includes("text") ||
						userMessage.toLowerCase().includes("ocr") ||
						userMessage.toLowerCase().includes("read") ||
						userMessage.toLowerCase().includes("extract");

					if (wantsOCR) {
						const ocrCap: UsedCapability = { type: "ocr", status: "pending" };
						capabilities.push(ocrCap);
						try {
							const result = await agentCapabilities.extractTextFromImage(
								att.data,
							);
							ocrCap.result = result;
							ocrCap.status = "complete";
							enhancedPrompt += `\n\n[OCR Result from ${att.name}]:\n${result.text}`;
						} catch {
							ocrCap.status = "error";
						}
					} else {
						// Vision analysis
						const visionCap: UsedCapability = {
							type: "vision",
							status: "pending",
						};
						capabilities.push(visionCap);
						try {
							const result = await agentCapabilities.analyzeImage(att.data, {
								detectObjects: true,
								analyzeMedical:
									userMessage.toLowerCase().includes("medical") ||
									userMessage.toLowerCase().includes("xray") ||
									userMessage.toLowerCase().includes("scan"),
							});
							visionCap.result = result;
							visionCap.status = "complete";
							enhancedPrompt += `\n\n[Image Analysis of ${att.name}]:\n${result.description}\nTags: ${result.tags.join(", ")}`;
							if (result.medicalAnalysis) {
								enhancedPrompt += `\nMedical Findings: ${result.medicalAnalysis.findings.join("; ")}`;
							}
						} catch {
							visionCap.status = "error";
						}
					}
				}
			}

			// Check for web search intent
			const searchPatterns = [
				/search (?:for |the web for |online for )?["']?(.+?)["']?$/i,
				/look up ["']?(.+?)["']?$/i,
				/find (?:information (?:about|on) )?["']?(.+?)["']?$/i,
				/what (?:is|are) the latest (?:on |about )?["']?(.+?)["']?$/i,
			];

			for (const pattern of searchPatterns) {
				const match = userMessage.match(pattern);
				if (match) {
					const searchQuery = match[1];
					const searchCap: UsedCapability = {
						type: "search",
						status: "pending",
					};
					capabilities.push(searchCap);
					try {
						const isMedical =
							searchQuery.toLowerCase().includes("medical") ||
							searchQuery.toLowerCase().includes("treatment") ||
							searchQuery.toLowerCase().includes("diagnosis") ||
							searchQuery.toLowerCase().includes("clinical");

						const result = isMedical
							? await agentCapabilities.searchMedicalLiterature(searchQuery)
							: await agentCapabilities.webSearch(searchQuery);

						searchCap.result = result;
						searchCap.status = "complete";

						const searchResults = result.results
							.slice(0, 5)
							.map((r) => `- [${r.title}](${r.url})\n  ${r.snippet}`)
							.join("\n\n");

						enhancedPrompt += `\n\n[Web Search Results for "${searchQuery}"]:\n${searchResults}`;
					} catch {
						searchCap.status = "error";
					}
					break;
				}
			}

			// Add transcript context if available
			if (transcriptContext) {
				enhancedPrompt = `[Current Transcript Context]:\n${transcriptContext}\n\n[User Query]: ${enhancedPrompt}`;
			}

			return { enhancedPrompt, capabilities };
		},
		[transcriptContext],
	);

	// Stream response simulation
	const streamResponse = useCallback(
		async (userMessage: string, capabilities: UsedCapability[]) => {
			const assistantId = Date.now().toString();

			setMessages((prev) => [
				...prev,
				{
					id: assistantId,
					role: "assistant",
					content: "",
					timestamp: new Date(),
					isStreaming: true,
					capabilities,
					metadata: { model: "gpt-4o" },
				},
			]);

			// Generate contextual response based on capabilities used
			let response = "";

			if (
				capabilities.some((c) => c.type === "ocr" && c.status === "complete")
			) {
				response =
					"I've extracted the text from your image. Here's what I found:\n\n";
				const ocrResult = capabilities.find((c) => c.type === "ocr")
					?.result as OCRResult;
				if (ocrResult) {
					response += `**Extracted Text:**\n${ocrResult.text}\n\n`;
					response += `*Confidence: ${(ocrResult.confidence * 100).toFixed(1)}% | Processing time: ${ocrResult.processingTime}ms*`;
				}
			} else if (
				capabilities.some((c) => c.type === "vision" && c.status === "complete")
			) {
				response = "I've analyzed your image. Here's my assessment:\n\n";
				const visionResult = capabilities.find((c) => c.type === "vision")
					?.result as VisionAnalysisResult;
				if (visionResult) {
					response += `**Description:** ${visionResult.description}\n\n`;
					response += `**Tags:** ${visionResult.tags.join(", ")}\n\n`;
					if (visionResult.objects.length > 0) {
						response += `**Detected Objects:** ${visionResult.objects.map((o) => o.name).join(", ")}\n\n`;
					}
					if (visionResult.medicalAnalysis) {
						response += `**Medical Analysis:**\n`;
						response += `- Type: ${visionResult.medicalAnalysis.type}\n`;
						response += `- Findings: ${visionResult.medicalAnalysis.findings.join("; ")}\n`;
						response += `- Priority: ${visionResult.medicalAnalysis.urgency}\n\n`;
						response += `⚠️ ${visionResult.medicalAnalysis.disclaimer}`;
					}
				}
			} else if (
				capabilities.some((c) => c.type === "search" && c.status === "complete")
			) {
				const searchResult = capabilities.find((c) => c.type === "search")
					?.result as WebSearchResult;
				response = `Here's what I found for "${searchResult?.query}":\n\n`;
				if (searchResult) {
					searchResult.results.slice(0, 5).forEach((r, i) => {
						response += `**${i + 1}. ${r.title}**\n`;
						response += `${r.snippet}\n`;
						response += `[Source: ${r.source}](${r.url})\n\n`;
					});
					if (searchResult.suggestions.length > 0) {
						response += `\n**Related searches:** ${searchResult.suggestions.slice(0, 3).join(", ")}`;
					}
				}
			} else {
				// Default contextual response
				const responses = [
					"Based on your request, ",
					"here's my analysis:\n\n",
					"**Key Points:**\n",
					"1. I've reviewed the available context.\n",
					"2. The main topics include the items discussed.\n",
					"3. I can help with summarization, SOAP notes, or action items.\n\n",
					"**Suggestions:**\n",
					"- Upload an image for OCR or visual analysis\n",
					"- Ask me to search the web for current information\n",
					"- Request a specific document format\n\n",
					"Would you like me to help with any specific task?",
				];
				response = responses.join("");
			}

			// Stream the response
			let currentContent = "";
			const words = response.split(" ");

			for (let i = 0; i < words.length; i++) {
				await new Promise((resolve) =>
					setTimeout(resolve, 30 + Math.random() * 40),
				);
				currentContent += (i > 0 ? " " : "") + words[i];
				setMessages((prev) =>
					prev.map((m) =>
						m.id === assistantId ? { ...m, content: currentContent } : m,
					),
				);
			}

			// Mark complete
			setMessages((prev) =>
				prev.map((m) =>
					m.id === assistantId ? { ...m, isStreaming: false } : m,
				),
			);
			setIsGenerating(false);
		},
		[],
	);

	// Send message
	const sendMessage = useCallback(async () => {
		if (!inputValue.trim() && attachments.length === 0) return;
		if (isGenerating) return;

		const userMessage: Message = {
			id: Date.now().toString(),
			role: "user",
			content: inputValue,
			timestamp: new Date(),
			attachments: attachments.length > 0 ? [...attachments] : undefined,
		};

		setMessages((prev) => [...prev, userMessage]);
		const currentInput = inputValue;
		const currentAttachments = [...attachments];
		setInputValue("");
		setAttachments([]);
		setIsGenerating(true);

		// Process capabilities and enhance prompt
		const { enhancedPrompt, capabilities } = await processCapabilities(
			currentInput,
			currentAttachments,
		);

		await streamResponse(enhancedPrompt, capabilities);
	}, [
		inputValue,
		attachments,
		isGenerating,
		processCapabilities,
		streamResponse,
	]);

	// Handle keyboard
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	};

	// Copy message
	const copyMessage = (id: string, content: string) => {
		navigator.clipboard.writeText(content);
		setCopiedId(id);
		setTimeout(() => setCopiedId(null), 2000);
	};

	// Handle file selection
	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files) return;

		for (const file of Array.from(files)) {
			const isImage = file.type.startsWith("image/");

			if (isImage) {
				const reader = new FileReader();
				reader.onload = () => {
					const dataUrl = reader.result as string;
					setAttachments((prev) => [
						...prev,
						{
							id: `${Date.now()}-${Math.random()}`,
							name: file.name,
							type: "image",
							preview: dataUrl,
							data: dataUrl,
						},
					]);
				};
				reader.readAsDataURL(file);
			} else {
				setAttachments((prev) => [
					...prev,
					{
						id: `${Date.now()}-${Math.random()}`,
						name: file.name,
						type: "file",
					},
				]);
			}
		}

		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	// Remove attachment
	const removeAttachment = (id: string) => {
		setAttachments((prev) => prev.filter((a) => a.id !== id));
	};

	// Handle quick action
	const handleQuickAction = (action: QuickAction) => {
		if (action.capability === "search") {
			setInputValue(action.prompt);
			inputRef.current?.focus();
		} else {
			setInputValue(action.prompt);
			setTimeout(() => sendMessage(), 100);
		}
	};

	// Render markdown (simplified)
	const renderContent = (content: string) => {
		const html = content
			.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
			.replace(/\*(.*?)\*/g, "<em>$1</em>")
			.replace(
				/`([^`]+)`/g,
				'<code style="background:#374151;padding:2px 6px;border-radius:4px;font-size:13px;">$1</code>',
			)
			.replace(
				/\[([^\]]+)\]\(([^)]+)\)/g,
				'<a href="$2" target="_blank" style="color:#8b5cf6;text-decoration:underline;">$1</a>',
			)
			.replace(/\n/g, "<br/>");
		return (
			<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
		);
	};

	const capabilities = agentCapabilities.getCapabilities();

	return (
		<div
			className={className}
			style={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				background: "#111827",
				borderLeft: "1px solid #374151",
			}}
		>
			{/* Header */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					padding: "12px 16px",
					borderBottom: "1px solid #374151",
					background: "#1f2937",
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
					<div
						style={{
							width: "32px",
							height: "32px",
							borderRadius: "8px",
							background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Bot size={18} color="white" />
					</div>
					<div>
						<div
							style={{ fontSize: "14px", fontWeight: "600", color: "white" }}
						>
							VoiceCode AI
						</div>
						<div style={{ fontSize: "11px", color: "#9ca3af" }}>
							OCR • Vision • Search
						</div>
					</div>
				</div>
				<div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
					<button
						onClick={() => setShowCapabilities(!showCapabilities)}
						style={{
							padding: "6px",
							background: showCapabilities ? "#374151" : "transparent",
							border: "none",
							borderRadius: "6px",
							cursor: "pointer",
							color: "#9ca3af",
						}}
						title="Capabilities"
					>
						<Settings size={16} />
					</button>
					{onToggleExpand && (
						<button
							onClick={onToggleExpand}
							style={{
								padding: "6px",
								background: "transparent",
								border: "none",
								borderRadius: "6px",
								cursor: "pointer",
								color: "#9ca3af",
							}}
							title={isExpanded ? "Minimize" : "Expand"}
						>
							{isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
						</button>
					)}
				</div>
			</div>

			{/* Capabilities Panel */}
			{showCapabilities && (
				<div
					style={{
						padding: "12px",
						background: "#1f2937",
						borderBottom: "1px solid #374151",
					}}
				>
					<div
						style={{
							fontSize: "12px",
							fontWeight: "500",
							color: "#9ca3af",
							marginBottom: "8px",
						}}
					>
						AGENT CAPABILITIES
					</div>
					<div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
						{capabilities.map((cap) => (
							<div
								key={cap.id}
								style={{
									display: "flex",
									alignItems: "center",
									gap: "6px",
									padding: "6px 10px",
									background: cap.apiKeyConfigured ? "#374151" : "#1f2937",
									border: `1px solid ${cap.apiKeyConfigured ? "#4b5563" : "#374151"}`,
									borderRadius: "6px",
									fontSize: "12px",
									color: cap.apiKeyConfigured ? "#e5e7eb" : "#6b7280",
								}}
							>
								{cap.id === "ocr" && <Scan size={14} />}
								{cap.id === "vision" && <Eye size={14} />}
								{cap.id === "medical-vision" && <Stethoscope size={14} />}
								{cap.id === "web-search" && <Globe size={14} />}
								{cap.id === "medical-search" && <Search size={14} />}
								{cap.name}
								{!cap.apiKeyConfigured && (
									<span style={{ fontSize: "10px", color: "#f59e0b" }}>
										Demo
									</span>
								)}
							</div>
						))}
					</div>
				</div>
			)}

			{/* Messages Area */}
			<div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
				{messages.length === 0 ? (
					/* Empty State */
					<div style={{ textAlign: "center", padding: "32px 16px" }}>
						<div
							style={{
								width: "56px",
								height: "56px",
								margin: "0 auto 16px",
								background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
								borderRadius: "14px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<Sparkles size={28} color="white" />
						</div>
						<h3
							style={{
								fontSize: "16px",
								fontWeight: "600",
								color: "white",
								marginBottom: "8px",
							}}
						>
							AI Assistant Ready
						</h3>
						<p
							style={{
								fontSize: "13px",
								color: "#9ca3af",
								marginBottom: "20px",
							}}
						>
							Upload images for OCR, search the web, or ask about your
							transcripts
						</p>

						{/* Quick Actions */}
						<div
							style={{
								display: "flex",
								flexWrap: "wrap",
								justifyContent: "center",
								gap: "8px",
							}}
						>
							{quickActions.map((action) => (
								<button
									key={action.id}
									onClick={() => handleQuickAction(action)}
									style={{
										display: "flex",
										alignItems: "center",
										gap: "6px",
										padding: "8px 12px",
										background: "#1f2937",
										border: "1px solid #374151",
										borderRadius: "8px",
										color: "#e5e7eb",
										fontSize: "12px",
										cursor: "pointer",
									}}
								>
									{action.icon}
									{action.label}
								</button>
							))}
						</div>
					</div>
				) : (
					/* Messages */
					<div>
						{messages.map((message) => (
							<div
								key={message.id}
								style={{
									display: "flex",
									gap: "12px",
									marginBottom: "16px",
								}}
							>
								{/* Avatar */}
								<div
									style={{
										width: "28px",
										height: "28px",
										borderRadius: "6px",
										background:
											message.role === "assistant"
												? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
												: "#374151",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										flexShrink: 0,
									}}
								>
									{message.role === "assistant" ? (
										<Bot size={16} color="white" />
									) : (
										<User size={16} color="#9ca3af" />
									)}
								</div>

								{/* Content */}
								<div style={{ flex: 1, minWidth: 0 }}>
									{/* Attachments */}
									{message.attachments && message.attachments.length > 0 && (
										<div
											style={{
												display: "flex",
												gap: "8px",
												marginBottom: "8px",
												flexWrap: "wrap",
											}}
										>
											{message.attachments.map((att) => (
												<div
													key={att.id}
													style={{
														display: "flex",
														alignItems: "center",
														gap: "6px",
														padding: "6px 10px",
														background: "#374151",
														borderRadius: "6px",
														fontSize: "12px",
														color: "#e5e7eb",
													}}
												>
													{att.type === "image" ? (
														<Image size={14} color="#8b5cf6" />
													) : (
														<FileText size={14} color="#8b5cf6" />
													)}
													{att.name}
												</div>
											))}
										</div>
									)}

									{/* Capabilities Used */}
									{message.capabilities && message.capabilities.length > 0 && (
										<div
											style={{
												display: "flex",
												gap: "6px",
												marginBottom: "8px",
												flexWrap: "wrap",
											}}
										>
											{message.capabilities.map((cap, idx) => (
												<div
													key={idx}
													style={{
														display: "flex",
														alignItems: "center",
														gap: "4px",
														padding: "4px 8px",
														background:
															cap.status === "complete"
																? "#065f46"
																: cap.status === "error"
																	? "#7f1d1d"
																	: "#374151",
														borderRadius: "4px",
														fontSize: "11px",
														color: "#e5e7eb",
													}}
												>
													{cap.type === "ocr" && <Scan size={12} />}
													{cap.type === "vision" && <Eye size={12} />}
													{cap.type === "search" && <Globe size={12} />}
													{cap.type}
													{cap.status === "pending" && "..."}
												</div>
											))}
										</div>
									)}

									{/* Message Text */}
									<div
										style={{
											fontSize: "13px",
											lineHeight: "1.6",
											color: "#e5e7eb",
										}}
									>
										{renderContent(message.content)}
										{message.isStreaming && (
											<span
												style={{
													display: "inline-block",
													width: "6px",
													height: "14px",
													background: "#8b5cf6",
													marginLeft: "2px",
													animation: "blink 1s infinite",
												}}
											/>
										)}
									</div>

									{/* Actions */}
									{!message.isStreaming && message.role === "assistant" && (
										<div
											style={{
												display: "flex",
												alignItems: "center",
												gap: "4px",
												marginTop: "8px",
											}}
										>
											<button
												onClick={() => copyMessage(message.id, message.content)}
												style={{
													padding: "4px 6px",
													background: "transparent",
													border: "none",
													borderRadius: "4px",
													cursor: "pointer",
													color: "#6b7280",
													display: "flex",
													alignItems: "center",
													gap: "4px",
													fontSize: "11px",
												}}
											>
												{copiedId === message.id ? (
													<Check size={12} color="#10b981" />
												) : (
													<Copy size={12} />
												)}
											</button>
											<button
												style={{
													padding: "4px",
													background: "transparent",
													border: "none",
													borderRadius: "4px",
													cursor: "pointer",
													color:
														message.feedback === "positive"
															? "#10b981"
															: "#6b7280",
												}}
											>
												<ThumbsUp size={12} />
											</button>
											<button
												style={{
													padding: "4px",
													background: "transparent",
													border: "none",
													borderRadius: "4px",
													cursor: "pointer",
													color:
														message.feedback === "negative"
															? "#ef4444"
															: "#6b7280",
												}}
											>
												<ThumbsDown size={12} />
											</button>
										</div>
									)}
								</div>
							</div>
						))}
						<div ref={messagesEndRef} />
					</div>
				)}
			</div>

			{/* Input Area */}
			<div style={{ padding: "12px", borderTop: "1px solid #374151" }}>
				{/* Attachments Preview */}
				{attachments.length > 0 && (
					<div
						style={{
							display: "flex",
							gap: "8px",
							marginBottom: "8px",
							flexWrap: "wrap",
						}}
					>
						{attachments.map((att) => (
							<div
								key={att.id}
								style={{
									position: "relative",
									display: "flex",
									alignItems: "center",
									gap: "6px",
									padding: "6px 10px",
									background: "#1f2937",
									border: "1px solid #374151",
									borderRadius: "8px",
									fontSize: "12px",
									color: "#e5e7eb",
								}}
							>
								{att.preview ? (
									<img
										src={att.preview}
										alt={att.name}
										style={{
											width: "24px",
											height: "24px",
											objectFit: "cover",
											borderRadius: "4px",
										}}
									/>
								) : (
									<FileText size={14} color="#8b5cf6" />
								)}
								<span
									style={{
										maxWidth: "100px",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									{att.name}
								</span>
								<button
									onClick={() => removeAttachment(att.id)}
									style={{
										padding: "2px",
										background: "transparent",
										border: "none",
										cursor: "pointer",
										color: "#6b7280",
									}}
								>
									<X size={12} />
								</button>
							</div>
						))}
					</div>
				)}

				{/* Input Box */}
				<div
					style={{
						display: "flex",
						alignItems: "flex-end",
						gap: "8px",
						padding: "8px 12px",
						background: "#1f2937",
						border: "1px solid #374151",
						borderRadius: "12px",
					}}
				>
					{/* Attachment Button */}
					<button
						onClick={() => fileInputRef.current?.click()}
						style={{
							padding: "6px",
							background: "transparent",
							border: "none",
							borderRadius: "6px",
							cursor: "pointer",
							color: "#6b7280",
						}}
						title="Attach file or image"
					>
						<Paperclip size={18} />
					</button>
					<input
						ref={fileInputRef}
						type="file"
						multiple
						accept="image/*,.pdf,.doc,.docx,.txt"
						onChange={handleFileSelect}
						style={{ display: "none" }}
					/>

					{/* Text Input */}
					<textarea
						ref={inputRef}
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Ask anything, upload images, or search..."
						rows={1}
						style={{
							flex: 1,
							padding: "6px 0",
							background: "transparent",
							border: "none",
							color: "white",
							fontSize: "14px",
							lineHeight: "1.4",
							resize: "none",
							outline: "none",
							maxHeight: "120px",
						}}
					/>

					{/* Voice Input */}
					<button
						onClick={() => setIsRecording(!isRecording)}
						style={{
							padding: "6px",
							background: isRecording ? "#ef4444" : "transparent",
							border: "none",
							borderRadius: "6px",
							cursor: "pointer",
							color: isRecording ? "white" : "#6b7280",
						}}
					>
						{isRecording ? <MicOff size={18} /> : <Mic size={18} />}
					</button>

					{/* Send Button */}
					<button
						onClick={sendMessage}
						disabled={!inputValue.trim() && attachments.length === 0}
						style={{
							padding: "8px",
							background:
								inputValue.trim() || attachments.length > 0
									? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
									: "#374151",
							border: "none",
							borderRadius: "8px",
							cursor:
								inputValue.trim() || attachments.length > 0
									? "pointer"
									: "not-allowed",
							color: "white",
						}}
					>
						{isGenerating ? <StopCircle size={18} /> : <Send size={18} />}
					</button>
				</div>
			</div>

			{/* CSS Animation */}
			<style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
		</div>
	);
};

export default AgentChatPanel;
