/**
 * AI Chat Interface - ChatGPT Quality Conversation Experience
 * Features: Streaming responses, markdown rendering, conversation history,
 * context awareness, voice input, file attachments, and VoiceCode integration
 */

import DOMPurify from "dompurify";
import {
	Bot,
	Brain,
	Check,
	Clock,
	Copy,
	Edit3,
	FileSearch,
	FileText,
	Home,
	ListChecks,
	MessageSquare,
	Mic,
	MicOff,
	PanelLeft,
	PanelLeftClose,
	Paperclip,
	Pin,
	Plus,
	RefreshCw,
	Search,
	Send,
	Settings,
	Share2,
	Sparkles,
	Star,
	Stethoscope,
	StopCircle,
	ThumbsDown,
	ThumbsUp,
	User,
	Volume2,
	X,
	Zap,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// Types
interface Message {
	id: string;
	role: "user" | "assistant" | "system";
	content: string;
	timestamp: Date;
	isStreaming?: boolean;
	attachments?: Attachment[];
	metadata?: {
		model?: string;
		tokens?: number;
		latency?: number;
		context?: string;
	};
	feedback?: "positive" | "negative";
	isEdited?: boolean;
	isPinned?: boolean;
}

interface Attachment {
	id: string;
	name: string;
	type: "transcript" | "file" | "image" | "audio";
	size?: number;
	preview?: string;
}

interface Conversation {
	id: string;
	title: string;
	messages: Message[];
	createdAt: Date;
	updatedAt: Date;
	isPinned?: boolean;
	isStarred?: boolean;
	context?: string;
}

interface QuickPrompt {
	icon: React.ReactNode;
	label: string;
	prompt: string;
	category: string;
}

// Quick prompts for different use cases
const quickPrompts: QuickPrompt[] = [
	{
		icon: <Stethoscope size={18} />,
		label: "Generate SOAP Note",
		prompt: "Generate a SOAP note from my latest transcription",
		category: "Medical",
	},
	{
		icon: <ListChecks size={18} />,
		label: "Extract Action Items",
		prompt: "Extract all action items and tasks from the transcript",
		category: "Productivity",
	},
	{
		icon: <FileSearch size={18} />,
		label: "Summarize Recording",
		prompt: "Provide a comprehensive summary of the selected recording",
		category: "Analysis",
	},
	{
		icon: <Brain size={18} />,
		label: "Key Insights",
		prompt: "What are the key insights and important points discussed?",
		category: "Analysis",
	},
	{
		icon: <Zap size={18} />,
		label: "Quick Summary",
		prompt: "Give me a brief 2-3 sentence summary",
		category: "Quick",
	},
	{
		icon: <FileText size={18} />,
		label: "Meeting Minutes",
		prompt: "Format this as professional meeting minutes",
		category: "Productivity",
	},
];

// Sample conversations for sidebar
const sampleConversations: Conversation[] = [
	{
		id: "1",
		title: "Patient Consultation Analysis",
		messages: [],
		createdAt: new Date(),
		updatedAt: new Date(),
		isPinned: true,
	},
	{
		id: "2",
		title: "Weekly Team Meeting Summary",
		messages: [],
		createdAt: new Date(Date.now() - 86400000),
		updatedAt: new Date(Date.now() - 86400000),
	},
	{
		id: "3",
		title: "Research Interview Notes",
		messages: [],
		createdAt: new Date(Date.now() - 172800000),
		updatedAt: new Date(Date.now() - 172800000),
		isStarred: true,
	},
	{
		id: "4",
		title: "Clinical Documentation Help",
		messages: [],
		createdAt: new Date(Date.now() - 259200000),
		updatedAt: new Date(Date.now() - 259200000),
	},
];

const ChatPage: React.FC = () => {
	const navigate = useNavigate();

	// State
	const [messages, setMessages] = useState<Message[]>([]);
	const [inputValue, setInputValue] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [isRecording, setIsRecording] = useState(false);
	const [showSidebar, setShowSidebar] = useState(true);
	const [conversations, setConversations] =
		useState<Conversation[]>(sampleConversations);
	const [activeConversation, setActiveConversation] = useState<string | null>(
		null,
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [showSettings, setShowSettings] = useState(false);
	const [selectedModel, setSelectedModel] = useState("gpt-4");
	const [copiedId, setCopiedId] = useState<string | null>(null);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editValue, setEditValue] = useState("");
	const [showContextMenu, setShowContextMenu] = useState<string | null>(null);
	const [attachments, setAttachments] = useState<Attachment[]>([]);

	// Refs
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Auto-scroll to bottom
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	// Auto-resize textarea
	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.style.height = "auto";
			inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
		}
	}, [inputValue]);

	// Simulate streaming response
	const streamResponse = useCallback(
		async (userMessage: string) => {
			const assistantId = Date.now().toString();

			// Add empty assistant message
			setMessages((prev) => [
				...prev,
				{
					id: assistantId,
					role: "assistant",
					content: "",
					timestamp: new Date(),
					isStreaming: true,
					metadata: { model: selectedModel },
				},
			]);

			// Simulate streaming with realistic response
			const responses = [
				"I'll analyze that for you. ",
				"Based on the context provided, ",
				"here are my findings:\n\n",
				"**Key Points:**\n",
				"1. The main topic discussed was ",
				userMessage.includes("medical")
					? "patient care and treatment options.\n"
					: "the project timeline and deliverables.\n",
				"2. Several action items were identified.\n",
				"3. Follow-up discussions are recommended.\n\n",
				"**Summary:**\n",
				"The conversation covered important topics that require attention. ",
				"I recommend reviewing the detailed notes and scheduling follow-ups as needed.\n\n",
				"Would you like me to elaborate on any specific point or generate a formal document from this analysis?",
			];

			let fullContent = "";
			for (const chunk of responses) {
				await new Promise((resolve) =>
					setTimeout(resolve, 50 + Math.random() * 100),
				);
				fullContent += chunk;
				setMessages((prev) =>
					prev.map((m) =>
						m.id === assistantId ? { ...m, content: fullContent } : m,
					),
				);
			}

			// Mark as complete
			setMessages((prev) =>
				prev.map((m) =>
					m.id === assistantId
						? {
								...m,
								isStreaming: false,
								metadata: {
									...m.metadata,
									tokens: Math.floor(fullContent.length / 4),
									latency: 1200,
								},
							}
						: m,
				),
			);
			setIsGenerating(false);
		},
		[selectedModel],
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
		setInputValue("");
		setAttachments([]);
		setIsGenerating(true);

		await streamResponse(inputValue);
	}, [inputValue, attachments, isGenerating, streamResponse]);

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

	// Regenerate response
	const regenerateResponse = async (messageId: string) => {
		const messageIndex = messages.findIndex((m) => m.id === messageId);
		if (messageIndex === -1) return;

		// Find the user message before this assistant message
		const userMessage = messages
			.slice(0, messageIndex)
			.reverse()
			.find((m) => m.role === "user");
		if (!userMessage) return;

		// Remove the assistant message and regenerate
		setMessages((prev) => prev.filter((m) => m.id !== messageId));
		setIsGenerating(true);
		await streamResponse(userMessage.content);
	};

	// Start editing
	const startEditing = (message: Message) => {
		setEditingId(message.id);
		setEditValue(message.content);
	};

	// Save edit
	const saveEdit = (id: string) => {
		setMessages((prev) =>
			prev.map((m) =>
				m.id === id ? { ...m, content: editValue, isEdited: true } : m,
			),
		);
		setEditingId(null);
		setEditValue("");
	};

	// Toggle feedback
	const toggleFeedback = (id: string, feedback: "positive" | "negative") => {
		setMessages((prev) =>
			prev.map((m) =>
				m.id === id
					? { ...m, feedback: m.feedback === feedback ? undefined : feedback }
					: m,
			),
		);
	};

	// New conversation
	const newConversation = () => {
		setMessages([]);
		setActiveConversation(null);
		inputRef.current?.focus();
	};

	// Handle file attachment
	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files) return;

		const newAttachments: Attachment[] = Array.from(files).map((file) => ({
			id: Date.now().toString() + Math.random(),
			name: file.name,
			type: file.type.startsWith("image/")
				? "image"
				: file.type.startsWith("audio/")
					? "audio"
					: "file",
			size: file.size,
		}));

		setAttachments((prev) => [...prev, ...newAttachments]);
	};

	// Remove attachment
	const removeAttachment = (id: string) => {
		setAttachments((prev) => prev.filter((a) => a.id !== id));
	};

	// Use quick prompt
	const useQuickPrompt = (prompt: string) => {
		setInputValue(prompt);
		inputRef.current?.focus();
	};

	// Format time
	const formatTime = (date: Date) => {
		return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	};

	// Render markdown (simplified)
	const renderContent = (content: string) => {
		// Convert markdown to basic HTML
		const html = content
			.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
			.replace(/\*(.*?)\*/g, "<em>$1</em>")
			.replace(
				/`([^`]+)`/g,
				'<code style="background:#1f2937;padding:2px 6px;border-radius:4px;font-size:13px;">$1</code>',
			)
			.replace(/\n/g, "<br/>");

		return (
			<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
		);
	};

	// Filter conversations
	const filteredConversations = conversations.filter((c) =>
		c.title.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const pinnedConversations = filteredConversations.filter((c) => c.isPinned);
	const recentConversations = filteredConversations.filter((c) => !c.isPinned);

	return (
		<div style={{ display: "flex", height: "100vh", background: "#111827" }}>
			{/* Sidebar */}
			<div
				style={{
					width: showSidebar ? "280px" : "0px",
					background: "#1f2937",
					borderRight: "1px solid #374151",
					display: "flex",
					flexDirection: "column",
					transition: "width 0.2s ease",
					overflow: "hidden",
				}}
			>
				{/* New Chat Button */}
				<div style={{ padding: "16px" }}>
					<button
						onClick={newConversation}
						style={{
							width: "100%",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: "8px",
							padding: "12px 16px",
							background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
							color: "white",
							border: "none",
							borderRadius: "10px",
							fontSize: "14px",
							fontWeight: "600",
							cursor: "pointer",
							transition: "transform 0.1s, box-shadow 0.2s",
						}}
					>
						<Plus size={18} /> New Chat
					</button>
				</div>

				{/* Search */}
				<div style={{ padding: "0 16px 12px" }}>
					<div style={{ position: "relative" }}>
						<Search
							size={16}
							style={{
								position: "absolute",
								left: "12px",
								top: "50%",
								transform: "translateY(-50%)",
								color: "#6b7280",
							}}
						/>
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search conversations..."
							style={{
								width: "100%",
								padding: "10px 12px 10px 38px",
								background: "#374151",
								border: "1px solid #4b5563",
								borderRadius: "8px",
								color: "white",
								fontSize: "13px",
							}}
						/>
					</div>
				</div>

				{/* Conversations List */}
				<div style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
					{pinnedConversations.length > 0 && (
						<div style={{ marginBottom: "16px" }}>
							<div
								style={{
									padding: "8px 8px 4px",
									fontSize: "11px",
									fontWeight: "600",
									color: "#6b7280",
									textTransform: "uppercase",
								}}
							>
								<Pin
									size={12}
									style={{ display: "inline", marginRight: "4px" }}
								/>{" "}
								Pinned
							</div>
							{pinnedConversations.map((conv) => (
								<button
									key={conv.id}
									onClick={() => setActiveConversation(conv.id)}
									style={{
										width: "100%",
										display: "flex",
										alignItems: "center",
										gap: "10px",
										padding: "10px 12px",
										background:
											activeConversation === conv.id
												? "#374151"
												: "transparent",
										border: "none",
										borderRadius: "8px",
										color: "#e5e7eb",
										fontSize: "13px",
										cursor: "pointer",
										textAlign: "left",
										marginBottom: "2px",
									}}
								>
									<MessageSquare size={16} color="#9ca3af" />
									<span
										style={{
											flex: 1,
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										}}
									>
										{conv.title}
									</span>
									{conv.isStarred && (
										<Star size={14} color="#f59e0b" fill="#f59e0b" />
									)}
								</button>
							))}
						</div>
					)}

					<div>
						<div
							style={{
								padding: "8px 8px 4px",
								fontSize: "11px",
								fontWeight: "600",
								color: "#6b7280",
								textTransform: "uppercase",
							}}
						>
							<Clock
								size={12}
								style={{ display: "inline", marginRight: "4px" }}
							/>{" "}
							Recent
						</div>
						{recentConversations.map((conv) => (
							<button
								key={conv.id}
								onClick={() => setActiveConversation(conv.id)}
								style={{
									width: "100%",
									display: "flex",
									alignItems: "center",
									gap: "10px",
									padding: "10px 12px",
									background:
										activeConversation === conv.id ? "#374151" : "transparent",
									border: "none",
									borderRadius: "8px",
									color: "#e5e7eb",
									fontSize: "13px",
									cursor: "pointer",
									textAlign: "left",
									marginBottom: "2px",
								}}
							>
								<MessageSquare size={16} color="#9ca3af" />
								<span
									style={{
										flex: 1,
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									{conv.title}
								</span>
							</button>
						))}
					</div>
				</div>

				{/* Sidebar Footer */}
				<div style={{ padding: "12px 16px", borderTop: "1px solid #374151" }}>
					<button
						onClick={() => setShowSettings(true)}
						style={{
							width: "100%",
							display: "flex",
							alignItems: "center",
							gap: "10px",
							padding: "10px 12px",
							background: "transparent",
							border: "none",
							borderRadius: "8px",
							color: "#9ca3af",
							fontSize: "13px",
							cursor: "pointer",
						}}
					>
						<Settings size={16} /> Settings
					</button>
				</div>
			</div>

			{/* Main Chat Area */}
			<div
				style={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					minWidth: 0,
				}}
			>
				{/* Header */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						padding: "12px 20px",
						borderBottom: "1px solid #374151",
						background: "#1f2937",
					}}
				>
					<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
						<button
							onClick={() => navigate("/app")}
							style={{
								padding: "8px 12px",
								background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
								border: "none",
								borderRadius: "8px",
								cursor: "pointer",
								color: "white",
								display: "flex",
								alignItems: "center",
								gap: "6px",
								fontSize: "13px",
								fontWeight: "500",
							}}
							title="Back to Dashboard"
						>
							<Home size={16} />
							Dashboard
						</button>
						<button
							onClick={() => setShowSidebar(!showSidebar)}
							style={{
								padding: "8px",
								background: "transparent",
								border: "none",
								borderRadius: "6px",
								cursor: "pointer",
								color: "#9ca3af",
							}}
						>
							{showSidebar ? (
								<PanelLeftClose size={20} />
							) : (
								<PanelLeft size={20} />
							)}
						</button>
						<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
							<Sparkles size={20} color="#8b5cf6" />
							<span
								style={{ fontSize: "16px", fontWeight: "600", color: "white" }}
							>
								VoiceCode AI
							</span>
						</div>
					</div>

					{/* Model Selector */}
					<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
						<select
							value={selectedModel}
							onChange={(e) => setSelectedModel(e.target.value)}
							style={{
								padding: "8px 12px",
								background: "#374151",
								border: "1px solid #4b5563",
								borderRadius: "8px",
								color: "white",
								fontSize: "13px",
								cursor: "pointer",
							}}
						>
							<option value="gpt-4">GPT-4</option>
							<option value="gpt-4-turbo">GPT-4 Turbo</option>
							<option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
							<option value="claude-3">Claude 3</option>
						</select>
						<button
							style={{
								padding: "8px",
								background: "transparent",
								border: "none",
								borderRadius: "6px",
								cursor: "pointer",
								color: "#9ca3af",
							}}
						>
							<Share2 size={18} />
						</button>
					</div>
				</div>

				{/* Messages Area */}
				<div style={{ flex: 1, overflowY: "auto", padding: "20px 0" }}>
					{messages.length === 0 ? (
						/* Empty State with Quick Prompts */
						<div
							style={{
								maxWidth: "800px",
								margin: "0 auto",
								padding: "40px 24px",
							}}
						>
							<div style={{ textAlign: "center", marginBottom: "40px" }}>
								<div
									style={{
										width: "80px",
										height: "80px",
										margin: "0 auto 20px",
										background:
											"linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
										borderRadius: "20px",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<Bot size={40} color="white" />
								</div>
								<h2
									style={{
										fontSize: "28px",
										fontWeight: "700",
										color: "white",
										marginBottom: "8px",
									}}
								>
									How can I help you today?
								</h2>
								<p style={{ fontSize: "15px", color: "#9ca3af" }}>
									Ask me anything about your transcriptions, get summaries, or
									generate medical notes.
								</p>
							</div>

							{/* Quick Prompts Grid */}
							<div
								style={{
									display: "grid",
									gridTemplateColumns: "repeat(2, 1fr)",
									gap: "12px",
								}}
							>
								{quickPrompts.map((prompt, idx) => (
									<button
										key={idx}
										onClick={() => {
											setInputValue(prompt.prompt);
											inputRef.current?.focus();
										}}
										style={{
											display: "flex",
											alignItems: "flex-start",
											gap: "12px",
											padding: "16px",
											background: "#1f2937",
											border: "1px solid #374151",
											borderRadius: "12px",
											cursor: "pointer",
											textAlign: "left",
											transition: "border-color 0.2s, background 0.2s",
										}}
										onMouseOver={(e) => {
											e.currentTarget.style.borderColor = "#6366f1";
											e.currentTarget.style.background = "#252f3f";
										}}
										onMouseOut={(e) => {
											e.currentTarget.style.borderColor = "#374151";
											e.currentTarget.style.background = "#1f2937";
										}}
									>
										<div
											style={{
												padding: "8px",
												background: "#374151",
												borderRadius: "8px",
												color: "#8b5cf6",
											}}
										>
											{prompt.icon}
										</div>
										<div>
											<div
												style={{
													fontSize: "14px",
													fontWeight: "500",
													color: "white",
													marginBottom: "4px",
												}}
											>
												{prompt.label}
											</div>
											<div style={{ fontSize: "12px", color: "#6b7280" }}>
												{prompt.category}
											</div>
										</div>
									</button>
								))}
							</div>
						</div>
					) : (
						/* Messages */
						<div
							style={{ maxWidth: "800px", margin: "0 auto", padding: "0 24px" }}
						>
							{messages.map((message) => (
								<div
									key={message.id}
									style={{
										display: "flex",
										gap: "16px",
										marginBottom: "24px",
										padding: "16px",
										borderRadius: "12px",
										background:
											message.role === "assistant" ? "#1f2937" : "transparent",
									}}
								>
									{/* Avatar */}
									<div
										style={{
											width: "36px",
											height: "36px",
											borderRadius: "8px",
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
											<Bot size={20} color="white" />
										) : (
											<User size={20} color="#9ca3af" />
										)}
									</div>

									{/* Content */}
									<div style={{ flex: 1, minWidth: 0 }}>
										<div
											style={{
												display: "flex",
												alignItems: "center",
												gap: "8px",
												marginBottom: "8px",
											}}
										>
											<span
												style={{
													fontSize: "14px",
													fontWeight: "600",
													color: "white",
												}}
											>
												{message.role === "assistant" ? "VoiceCode AI" : "You"}
											</span>
											<span style={{ fontSize: "12px", color: "#6b7280" }}>
												{formatTime(message.timestamp)}
											</span>
											{message.isEdited && (
												<span style={{ fontSize: "11px", color: "#6b7280" }}>
													(edited)
												</span>
											)}
											{message.metadata?.model && (
												<span
													style={{
														fontSize: "11px",
														color: "#6b7280",
														background: "#374151",
														padding: "2px 6px",
														borderRadius: "4px",
													}}
												>
													{message.metadata.model}
												</span>
											)}
										</div>

										{/* Attachments */}
										{message.attachments && message.attachments.length > 0 && (
											<div
												style={{
													display: "flex",
													gap: "8px",
													marginBottom: "12px",
													flexWrap: "wrap",
												}}
											>
												{message.attachments.map((att) => (
													<div
														key={att.id}
														style={{
															display: "flex",
															alignItems: "center",
															gap: "8px",
															padding: "8px 12px",
															background: "#374151",
															borderRadius: "8px",
															fontSize: "13px",
															color: "#e5e7eb",
														}}
													>
														<FileText size={16} color="#8b5cf6" />
														{att.name}
													</div>
												))}
											</div>
										)}

										{/* Message Content */}
										{editingId === message.id ? (
											<div>
												<textarea
													value={editValue}
													onChange={(e) => setEditValue(e.target.value)}
													style={{
														width: "100%",
														padding: "12px",
														background: "#374151",
														border: "1px solid #4b5563",
														borderRadius: "8px",
														color: "white",
														fontSize: "14px",
														lineHeight: "1.6",
														resize: "vertical",
														minHeight: "80px",
													}}
												/>
												<div
													style={{
														display: "flex",
														gap: "8px",
														marginTop: "8px",
													}}
												>
													<button
														onClick={() => saveEdit(message.id)}
														style={{
															padding: "6px 12px",
															background: "#6366f1",
															color: "white",
															border: "none",
															borderRadius: "6px",
															fontSize: "13px",
															cursor: "pointer",
														}}
													>
														Save
													</button>
													<button
														onClick={() => setEditingId(null)}
														style={{
															padding: "6px 12px",
															background: "#374151",
															color: "#9ca3af",
															border: "none",
															borderRadius: "6px",
															fontSize: "13px",
															cursor: "pointer",
														}}
													>
														Cancel
													</button>
												</div>
											</div>
										) : (
											<div
												style={{
													fontSize: "14px",
													lineHeight: "1.7",
													color: "#e5e7eb",
												}}
											>
												{renderContent(message.content)}
												{message.isStreaming && (
													<span
														style={{
															display: "inline-block",
															width: "8px",
															height: "16px",
															background: "#8b5cf6",
															marginLeft: "2px",
															animation: "blink 1s infinite",
														}}
													/>
												)}
											</div>
										)}

										{/* Actions */}
										{!message.isStreaming && !editingId && (
											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: "4px",
													marginTop: "12px",
												}}
											>
												<button
													onClick={() =>
														copyMessage(message.id, message.content)
													}
													style={{
														padding: "6px 8px",
														background: "transparent",
														border: "none",
														borderRadius: "6px",
														cursor: "pointer",
														color: "#6b7280",
														display: "flex",
														alignItems: "center",
														gap: "4px",
														fontSize: "12px",
													}}
												>
													{copiedId === message.id ? (
														<Check size={14} color="#10b981" />
													) : (
														<Copy size={14} />
													)}
													{copiedId === message.id ? "Copied" : "Copy"}
												</button>

												{message.role === "user" && (
													<button
														onClick={() => startEditing(message)}
														style={{
															padding: "6px 8px",
															background: "transparent",
															border: "none",
															borderRadius: "6px",
															cursor: "pointer",
															color: "#6b7280",
															display: "flex",
															alignItems: "center",
															gap: "4px",
															fontSize: "12px",
														}}
													>
														<Edit3 size={14} /> Edit
													</button>
												)}

												{message.role === "assistant" && (
													<>
														<button
															onClick={() => regenerateResponse(message.id)}
															style={{
																padding: "6px 8px",
																background: "transparent",
																border: "none",
																borderRadius: "6px",
																cursor: "pointer",
																color: "#6b7280",
																display: "flex",
																alignItems: "center",
																gap: "4px",
																fontSize: "12px",
															}}
														>
															<RefreshCw size={14} /> Regenerate
														</button>
														<div
															style={{
																width: "1px",
																height: "16px",
																background: "#374151",
																margin: "0 4px",
															}}
														/>
														<button
															onClick={() =>
																toggleFeedback(message.id, "positive")
															}
															style={{
																padding: "6px",
																background: "transparent",
																border: "none",
																borderRadius: "6px",
																cursor: "pointer",
																color:
																	message.feedback === "positive"
																		? "#10b981"
																		: "#6b7280",
															}}
														>
															<ThumbsUp size={14} />
														</button>
														<button
															onClick={() =>
																toggleFeedback(message.id, "negative")
															}
															style={{
																padding: "6px",
																background: "transparent",
																border: "none",
																borderRadius: "6px",
																cursor: "pointer",
																color:
																	message.feedback === "negative"
																		? "#ef4444"
																		: "#6b7280",
															}}
														>
															<ThumbsDown size={14} />
														</button>
													</>
												)}

												<button
													style={{
														padding: "6px 8px",
														background: "transparent",
														border: "none",
														borderRadius: "6px",
														cursor: "pointer",
														color: "#6b7280",
														display: "flex",
														alignItems: "center",
														gap: "4px",
														fontSize: "12px",
													}}
												>
													<Volume2 size={14} /> Read
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
				<div
					style={{ padding: "16px 24px 24px", borderTop: "1px solid #374151" }}
				>
					<div style={{ maxWidth: "800px", margin: "0 auto" }}>
						{/* Attachments Preview */}
						{attachments.length > 0 && (
							<div
								style={{
									display: "flex",
									gap: "8px",
									marginBottom: "12px",
									flexWrap: "wrap",
								}}
							>
								{attachments.map((att) => (
									<div
										key={att.id}
										style={{
											display: "flex",
											alignItems: "center",
											gap: "8px",
											padding: "8px 12px",
											background: "#1f2937",
											border: "1px solid #374151",
											borderRadius: "8px",
											fontSize: "13px",
											color: "#e5e7eb",
										}}
									>
										<FileText size={16} color="#8b5cf6" />
										{att.name}
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
											<X size={14} />
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
								gap: "12px",
								padding: "12px 16px",
								background: "#1f2937",
								border: "1px solid #374151",
								borderRadius: "16px",
							}}
						>
							{/* Attachment Button */}
							<button
								onClick={() => fileInputRef.current?.click()}
								style={{
									padding: "8px",
									background: "transparent",
									border: "none",
									borderRadius: "8px",
									cursor: "pointer",
									color: "#6b7280",
								}}
							>
								<Paperclip size={20} />
							</button>
							<input
								ref={fileInputRef}
								type="file"
								multiple
								onChange={handleFileSelect}
								style={{ display: "none" }}
							/>

							{/* Text Input */}
							<textarea
								ref={inputRef}
								value={inputValue}
								onChange={(e) => setInputValue(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Ask anything about your transcriptions..."
								rows={1}
								style={{
									flex: 1,
									padding: "8px 0",
									background: "transparent",
									border: "none",
									color: "white",
									fontSize: "15px",
									lineHeight: "1.5",
									resize: "none",
									outline: "none",
									maxHeight: "200px",
								}}
							/>

							{/* Voice Input */}
							<button
								onClick={() => setIsRecording(!isRecording)}
								style={{
									padding: "8px",
									background: isRecording ? "#ef4444" : "transparent",
									border: "none",
									borderRadius: "8px",
									cursor: "pointer",
									color: isRecording ? "white" : "#6b7280",
								}}
							>
								{isRecording ? <MicOff size={20} /> : <Mic size={20} />}
							</button>

							{/* Send Button */}
							<button
								onClick={sendMessage}
								disabled={!inputValue.trim() && attachments.length === 0}
								style={{
									padding: "10px",
									background:
										inputValue.trim() || attachments.length > 0
											? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
											: "#374151",
									border: "none",
									borderRadius: "10px",
									cursor:
										inputValue.trim() || attachments.length > 0
											? "pointer"
											: "not-allowed",
									color: "white",
									transition: "background 0.2s",
								}}
							>
								{isGenerating ? <StopCircle size={20} /> : <Send size={20} />}
							</button>
						</div>

						{/* Footer Note */}
						<div style={{ textAlign: "center", marginTop: "12px" }}>
							<span style={{ fontSize: "12px", color: "#6b7280" }}>
								VoiceCode AI can make mistakes. Consider checking important
								information.
							</span>
						</div>
					</div>
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

export default ChatPage;
