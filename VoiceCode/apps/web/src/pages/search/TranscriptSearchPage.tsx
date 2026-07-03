/**
 * Transcript Search Page
 * Global search across all transcriptions
 */

import DOMPurify from "dompurify";
import {
	Calendar,
	ChevronDown,
	Clock,
	ExternalLink,
	FileText,
	Filter,
	Play,
	Search,
	User,
} from "lucide-react";
import type React from "react";
import { useCallback, useState } from "react";

interface SearchResult {
	id: string;
	title: string;
	excerpt: string;
	matchedText: string;
	speaker?: string;
	timestamp: string;
	date: string;
	tags: string[];
	relevance: number;
}

const mockResults: SearchResult[] = [
	{
		id: "1",
		title: "Team Meeting - Project Review",
		excerpt:
			"...discussed the timeline for the **quarterly review** and budget allocation...",
		matchedText: "quarterly review",
		speaker: "John Smith",
		timestamp: "12:34",
		date: "2026-01-19",
		tags: ["meeting", "project"],
		relevance: 98,
	},
	{
		id: "2",
		title: "Patient Consultation - John D.",
		excerpt:
			"...patient reports experiencing **headaches** in the afternoon, typically lasting 2-3 hours...",
		matchedText: "headaches",
		speaker: "Dr. Johnson",
		timestamp: "5:21",
		date: "2026-01-18",
		tags: ["medical", "consultation"],
		relevance: 95,
	},
	{
		id: "3",
		title: "Interview - Senior Developer",
		excerpt:
			"...experience with **React and TypeScript** for the past 5 years, including large-scale applications...",
		matchedText: "React and TypeScript",
		speaker: "Candidate",
		timestamp: "23:45",
		date: "2026-01-17",
		tags: ["interview", "hiring"],
		relevance: 92,
	},
	{
		id: "4",
		title: "Client Call - ABC Corp",
		excerpt:
			"...they are interested in expanding the **quarterly review** process to include...",
		matchedText: "quarterly review",
		speaker: "Sarah",
		timestamp: "8:12",
		date: "2026-01-16",
		tags: ["client", "sales"],
		relevance: 88,
	},
	{
		id: "5",
		title: "Training Session - New Features",
		excerpt:
			"...the new dashboard includes a **quarterly review** feature that automatically...",
		matchedText: "quarterly review",
		speaker: "Mike",
		timestamp: "45:30",
		date: "2026-01-15",
		tags: ["training"],
		relevance: 85,
	},
];

const TranscriptSearchPage: React.FC = () => {
	const [searchQuery, setSearchQuery] = useState("");
	const [results, setResults] = useState<SearchResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);
	const [showFilters, setShowFilters] = useState(false);

	const [filters, setFilters] = useState({
		dateFrom: "",
		dateTo: "",
		speaker: "",
		tags: [] as string[],
		sortBy: "relevance" as "relevance" | "date" | "title",
	});

	const handleSearch = useCallback(async () => {
		if (!searchQuery.trim()) return;

		setIsSearching(true);
		setHasSearched(true);

		await new Promise((resolve) => setTimeout(resolve, 800));

		// Filter mock results based on query
		const filtered = mockResults.filter(
			(r) =>
				r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				r.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
				r.matchedText.toLowerCase().includes(searchQuery.toLowerCase()),
		);

		setResults(filtered.length > 0 ? filtered : mockResults.slice(0, 3));
		setIsSearching(false);
	}, [searchQuery]);

	const clearFilters = () => {
		setFilters({
			dateFrom: "",
			dateTo: "",
			speaker: "",
			tags: [],
			sortBy: "relevance",
		});
	};

	const highlightMatch = (text: string): React.ReactNode => {
		return text.replace(
			/\*\*(.*?)\*\*/g,
			'<mark style="background: #fef08a; padding: 0 2px; border-radius: 2px;">$1</mark>',
		);
	};

	return (
		<div style={{ minHeight: "100vh", background: "#f9fafb" }}>
			{/* Header */}
			<div
				style={{
					background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
					color: "white",
					padding: "48px 24px",
				}}
			>
				<div
					style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}
				>
					<h1
						style={{ fontSize: "32px", fontWeight: "700", marginBottom: "8px" }}
					>
						Search Transcripts
					</h1>
					<p style={{ fontSize: "16px", opacity: 0.8, marginBottom: "32px" }}>
						Find anything across all your recordings and transcriptions
					</p>

					{/* Search Bar */}
					<div
						style={{
							position: "relative",
							maxWidth: "700px",
							margin: "0 auto",
						}}
					>
						<Search
							size={22}
							style={{
								position: "absolute",
								left: "20px",
								top: "50%",
								transform: "translateY(-50%)",
								color: "#9ca3af",
							}}
						/>
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSearch()}
							placeholder="Search by keyword, phrase, speaker name..."
							style={{
								width: "100%",
								padding: "18px 140px 18px 56px",
								border: "none",
								borderRadius: "12px",
								fontSize: "16px",
								boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
							}}
						/>
						<button
							onClick={handleSearch}
							disabled={isSearching}
							style={{
								position: "absolute",
								right: "8px",
								top: "50%",
								transform: "translateY(-50%)",
								padding: "12px 24px",
								background: "#4f46e5",
								color: "white",
								border: "none",
								borderRadius: "8px",
								fontSize: "15px",
								fontWeight: "600",
								cursor: "pointer",
							}}
						>
							{isSearching ? "Searching..." : "Search"}
						</button>
					</div>

					{/* Quick Filters */}
					<div
						style={{
							display: "flex",
							justifyContent: "center",
							gap: "8px",
							marginTop: "16px",
						}}
					>
						<button
							onClick={() => setShowFilters(!showFilters)}
							style={{
								display: "flex",
								alignItems: "center",
								gap: "6px",
								padding: "8px 16px",
								background: "rgba(255,255,255,0.1)",
								color: "white",
								border: "1px solid rgba(255,255,255,0.2)",
								borderRadius: "8px",
								fontSize: "13px",
								cursor: "pointer",
							}}
						>
							<Filter size={14} /> Filters
							<ChevronDown
								size={14}
								style={{ transform: showFilters ? "rotate(180deg)" : "none" }}
							/>
						</button>
						<button
							style={{
								padding: "8px 16px",
								background: "rgba(255,255,255,0.1)",
								color: "white",
								border: "1px solid rgba(255,255,255,0.2)",
								borderRadius: "8px",
								fontSize: "13px",
								cursor: "pointer",
							}}
						>
							Last 7 days
						</button>
						<button
							style={{
								padding: "8px 16px",
								background: "rgba(255,255,255,0.1)",
								color: "white",
								border: "1px solid rgba(255,255,255,0.2)",
								borderRadius: "8px",
								fontSize: "13px",
								cursor: "pointer",
							}}
						>
							Medical
						</button>
						<button
							style={{
								padding: "8px 16px",
								background: "rgba(255,255,255,0.1)",
								color: "white",
								border: "1px solid rgba(255,255,255,0.2)",
								borderRadius: "8px",
								fontSize: "13px",
								cursor: "pointer",
							}}
						>
							Meetings
						</button>
					</div>
				</div>
			</div>

			{/* Filters Panel */}
			{showFilters && (
				<div
					style={{
						background: "white",
						borderBottom: "1px solid #e5e7eb",
						padding: "20px 24px",
					}}
				>
					<div style={{ maxWidth: "900px", margin: "0 auto" }}>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: "16px",
							}}
						>
							<h3
								style={{
									fontSize: "14px",
									fontWeight: "600",
									color: "#374151",
								}}
							>
								Advanced Filters
							</h3>
							<button
								onClick={clearFilters}
								style={{
									fontSize: "13px",
									color: "#6366f1",
									background: "none",
									border: "none",
									cursor: "pointer",
								}}
							>
								Clear all
							</button>
						</div>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "repeat(4, 1fr)",
								gap: "16px",
							}}
						>
							<div>
								<label
									style={{
										fontSize: "12px",
										color: "#6b7280",
										display: "block",
										marginBottom: "4px",
									}}
								>
									Date From
								</label>
								<input
									type="date"
									value={filters.dateFrom}
									onChange={(e) =>
										setFilters({ ...filters, dateFrom: e.target.value })
									}
									style={{
										width: "100%",
										padding: "10px",
										border: "1px solid #e5e7eb",
										borderRadius: "8px",
										fontSize: "14px",
									}}
								/>
							</div>
							<div>
								<label
									style={{
										fontSize: "12px",
										color: "#6b7280",
										display: "block",
										marginBottom: "4px",
									}}
								>
									Date To
								</label>
								<input
									type="date"
									value={filters.dateTo}
									onChange={(e) =>
										setFilters({ ...filters, dateTo: e.target.value })
									}
									style={{
										width: "100%",
										padding: "10px",
										border: "1px solid #e5e7eb",
										borderRadius: "8px",
										fontSize: "14px",
									}}
								/>
							</div>
							<div>
								<label
									style={{
										fontSize: "12px",
										color: "#6b7280",
										display: "block",
										marginBottom: "4px",
									}}
								>
									Speaker
								</label>
								<input
									type="text"
									value={filters.speaker}
									onChange={(e) =>
										setFilters({ ...filters, speaker: e.target.value })
									}
									placeholder="Any speaker"
									style={{
										width: "100%",
										padding: "10px",
										border: "1px solid #e5e7eb",
										borderRadius: "8px",
										fontSize: "14px",
									}}
								/>
							</div>
							<div>
								<label
									style={{
										fontSize: "12px",
										color: "#6b7280",
										display: "block",
										marginBottom: "4px",
									}}
								>
									Sort By
								</label>
								<select
									value={filters.sortBy}
									onChange={(e) =>
										setFilters({ ...filters, sortBy: e.target.value as any })
									}
									style={{
										width: "100%",
										padding: "10px",
										border: "1px solid #e5e7eb",
										borderRadius: "8px",
										fontSize: "14px",
										background: "white",
									}}
								>
									<option value="relevance">Relevance</option>
									<option value="date">Date (newest)</option>
									<option value="title">Title</option>
								</select>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Results */}
			<div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
				{hasSearched && (
					<>
						{/* Results Header */}
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: "20px",
							}}
						>
							<div style={{ fontSize: "14px", color: "#6b7280" }}>
								{results.length} results for "<strong>{searchQuery}</strong>"
							</div>
						</div>

						{/* Results List */}
						{results.length > 0 ? (
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: "16px",
								}}
							>
								{results.map((result) => (
									<div
										key={result.id}
										style={{
											background: "white",
											borderRadius: "12px",
											padding: "20px",
											boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
											cursor: "pointer",
											transition: "box-shadow 0.2s",
										}}
									>
										<div
											style={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "flex-start",
												marginBottom: "12px",
											}}
										>
											<div>
												<h3
													style={{
														fontSize: "16px",
														fontWeight: "600",
														color: "#1f2937",
														marginBottom: "4px",
													}}
												>
													{result.title}
												</h3>
												<div
													style={{
														display: "flex",
														gap: "12px",
														fontSize: "12px",
														color: "#6b7280",
													}}
												>
													<span
														style={{
															display: "flex",
															alignItems: "center",
															gap: "4px",
														}}
													>
														<Calendar size={12} /> {result.date}
													</span>
													<span
														style={{
															display: "flex",
															alignItems: "center",
															gap: "4px",
														}}
													>
														<Clock size={12} /> {result.timestamp}
													</span>
													{result.speaker && (
														<span
															style={{
																display: "flex",
																alignItems: "center",
																gap: "4px",
															}}
														>
															<User size={12} /> {result.speaker}
														</span>
													)}
												</div>
											</div>
											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: "8px",
												}}
											>
												<span
													style={{
														padding: "4px 8px",
														background: "#dcfce7",
														borderRadius: "4px",
														fontSize: "11px",
														fontWeight: "600",
														color: "#166534",
													}}
												>
													{result.relevance}% match
												</span>
											</div>
										</div>

										<p
											style={{
												fontSize: "14px",
												color: "#4b5563",
												lineHeight: "1.6",
												marginBottom: "12px",
											}}
											dangerouslySetInnerHTML={{
												__html: DOMPurify.sanitize(
													highlightMatch(result.excerpt) as string,
												),
											}}
										/>

										<div
											style={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
											}}
										>
											<div style={{ display: "flex", gap: "6px" }}>
												{result.tags.map((tag) => (
													<span
														key={tag}
														style={{
															padding: "4px 8px",
															background: "#f3f4f6",
															borderRadius: "4px",
															fontSize: "11px",
															color: "#6b7280",
														}}
													>
														{tag}
													</span>
												))}
											</div>
											<div style={{ display: "flex", gap: "8px" }}>
												<button
													style={{
														display: "flex",
														alignItems: "center",
														gap: "4px",
														padding: "6px 12px",
														background: "#f3f4f6",
														border: "none",
														borderRadius: "6px",
														fontSize: "12px",
														color: "#374151",
														cursor: "pointer",
													}}
												>
													<Play size={14} /> Play
												</button>
												<button
													style={{
														display: "flex",
														alignItems: "center",
														gap: "4px",
														padding: "6px 12px",
														background: "#4f46e5",
														color: "white",
														border: "none",
														borderRadius: "6px",
														fontSize: "12px",
														cursor: "pointer",
													}}
												>
													<ExternalLink size={14} /> Open
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
						) : (
							<div
								style={{
									background: "white",
									borderRadius: "12px",
									padding: "60px",
									textAlign: "center",
									boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
								}}
							>
								<Search
									size={48}
									color="#d1d5db"
									style={{ marginBottom: "16px" }}
								/>
								<h3
									style={{
										fontSize: "18px",
										fontWeight: "500",
										color: "#6b7280",
										marginBottom: "8px",
									}}
								>
									No results found
								</h3>
								<p style={{ fontSize: "14px", color: "#9ca3af" }}>
									Try different keywords or adjust your filters
								</p>
							</div>
						)}
					</>
				)}

				{!hasSearched && (
					<div
						style={{
							background: "white",
							borderRadius: "12px",
							padding: "60px",
							textAlign: "center",
							boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
						}}
					>
						<FileText
							size={48}
							color="#d1d5db"
							style={{ marginBottom: "16px" }}
						/>
						<h3
							style={{
								fontSize: "18px",
								fontWeight: "500",
								color: "#6b7280",
								marginBottom: "8px",
							}}
						>
							Start searching
						</h3>
						<p style={{ fontSize: "14px", color: "#9ca3af" }}>
							Enter keywords to search across all your transcriptions
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default TranscriptSearchPage;
