import React, { useCallback, useEffect, useState, useRef, useMemo, useContext } from "react";
import { createPortal } from "react-dom";
import api from "../../../api/api";
import MatchImageWordMiniGame from "./MatchImageWordMiniGame";
import LessonMiniGame from "./LessonMiniGame";
import SentenceBuilderMiniGame from "./SentenceBuilderMiniGame";
import ListenSelectMiniGame from "./ListenSelectMiniGame";
import ExamMiniGame from "./ExamMiniGame";
import TrueFalseMiniGame from "./TrueFalseMiniGame";
import TypingChallengeMiniGame from "./TypingChallengeMiniGame";
import LoadingSpinner from "../../../component/LoadingSpinner";
import FlipCardMiniGame from "./FlipCardMiniGame";
import WatchVideoMiniGame from "./WatchVideoMiniGame";
import { useToast } from "../../../context/ToastContext";
import { ThemeContext } from "../../../context/ThemeContext";

import { Editor } from "@tinymce/tinymce-react";
import HLSPlayer from "../../../component/HLSPlayer";

const splitBulkLines = (text) =>
	(text || "")
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);

const splitBulkColumns = (line) =>
	line
		.split(/\t|\s*\|\s*|\s*,\s*/)
		.map((item) => item.trim());

const makeId = (index = 0) => Date.now() + index;

const isValidQuickUrl = (value) => {
	try {
		const url = new URL((value || "").trim());
		return ["http:", "https:"].includes(url.protocol);
	} catch {
		return false;
	}
};

const normalizeTrueFalseAnswer = (value) => {
	const answer = (value || "")
		.replace(/^phương\s*án\s*đúng\s*:/i, "")
		.replace(/^phuong\s*an\s*dung\s*:/i, "")
		.trim()
		.toLowerCase();
	if (answer === "a" || answer === "đúng" || answer === "dung" || answer === "true") return "A";
	if (answer === "b" || answer === "sai" || answer === "false") return "B";
	return "";
};

const sampleDownloadButtonStyle = {
	display: "inline-flex",
	alignItems: "center",
	gap: 8,
	border: "1px solid rgba(13, 110, 253, 0.22)",
	background: "linear-gradient(135deg, #eef5ff 0%, #ffffff 100%)",
	color: "#0d6efd",
	borderRadius: 8,
	fontWeight: 600,
	boxShadow: "0 6px 16px rgba(13, 110, 253, 0.08)",
};

const getQuickInputPanelStyle = (isDarkMode) => ({
	border: `1px solid ${isDarkMode ? "rgba(148, 163, 184, 0.28)" : "rgba(15, 23, 42, 0.1)"}`,
	background: isDarkMode ? "rgba(15, 23, 42, 0.32)" : "#f8fafc",
	color: isDarkMode ? "#e5e7eb" : "#212529",
	borderRadius: 8,
	padding: 16,
});

const getQuickInputTextareaStyle = (isDarkMode) => ({
	background: isDarkMode ? "#1f2429" : "#ffffff",
	color: isDarkMode ? "#e5e7eb" : "#212529",
	borderColor: isDarkMode ? "rgba(148, 163, 184, 0.35)" : "#dee2e6",
});

const getSampleDownloadButtonStyle = (isDarkMode) => ({
	...sampleDownloadButtonStyle,
	border: `1px solid ${isDarkMode ? "rgba(96, 165, 250, 0.35)" : "rgba(13, 110, 253, 0.22)"}`,
	background: isDarkMode
		? "linear-gradient(135deg, rgba(30, 64, 175, 0.28) 0%, rgba(15, 23, 42, 0.82) 100%)"
		: "linear-gradient(135deg, #eef5ff 0%, #ffffff 100%)",
	color: isDarkMode ? "#93c5fd" : "#0d6efd",
	boxShadow: isDarkMode ? "0 6px 16px rgba(0, 0, 0, 0.22)" : sampleDownloadButtonStyle.boxShadow,
});

const MiniGameList = ({ activityId, onRefresh }) => {
	const toast = useToast();
	const [minigames, setMinigames] = useState([]);
	const [loading, setLoading] = useState(false);
	const [selected, setSelected] = useState(null);
	const [detailLoading, setDetailLoading] = useState(false);

	// new: show add panel and selected type for dynamic form
	const [showAddPanel, setShowAddPanel] = useState(false);
	const [addType, setAddType] = useState("match_image_word");

	// Embedded dynamic add form component
	const AddMiniGameForm = useMemo(() => function Form({ activityId, type, onCancel, onAdded }) {
		const toast = useToast();
		const themeContext = useContext(ThemeContext);
		const isDarkMode = themeContext?.isDarkMode ?? false;
		const [prompt, setPrompt] = useState("");
		const [saving, setSaving] = useState(false);
		const [showQuickInput, setShowQuickInput] = useState(false);
		const [quickInput, setQuickInput] = useState("");

		useEffect(() => {
			const defaultPrompts = {
				match_image_word: "Nối từ với hình ảnh tương ứng",
				lesson: "Đọc bài học sau đây",
				sentence_builder: "Sắp xếp các từ để tạo thành câu hoàn chỉnh",
				listen_select: "Nghe và chọn đáp án đúng",
				exam: "Trả lời các câu hỏi sau",
				true_false: "Chọn Đúng hoặc Sai cho các phát biểu sau",
				typing_challenge: "Gõ lại câu sau đây",
				flip_card: "Học từ vựng qua flashcard",
				watch_video: "Xem video và học"
			};
			setPrompt(defaultPrompts[type] || "");
		}, [type]);

		// Helper to upload image
		const handleUploadImage = async (file, callback) => {
			if (!file) return;
			const formData = new FormData();
			formData.append("avatar", file);
			try {
				toast.info("Đang tải ảnh lên...");
				const res = await api.post("/uploads/avatar?folder=minigames", formData, {
					headers: { "Content-Type": "multipart/form-data" },
				});
				callback(res.data.url);
				toast.success("Tải ảnh thành công");
			} catch (err) {
				toast.error("Upload ảnh thất bại");
			}
		};

		// MATCH_IMAGE_WORD fields
		const [images, setImages] = useState([]);
		const addImage = () => setImages((s) => [...s, { id: Date.now(), imageUrl: "", correctWord: "" }]);
		const updateImage = (idx, field, val) => {
			const copy = [...images]; copy[idx] = { ...copy[idx], [field]: val }; setImages(copy);
		};
		const removeImage = (idx) => setImages((s) => s.filter((_, i) => i !== idx));

		// SENTENCE_BUILDER fields
		const [tokens, setTokens] = useState([]);
		const [tokenInput, setTokenInput] = useState("");
		const addToken = () => { const t = tokenInput.trim(); if (!t) return; setTokens((s) => [...s, { id: Date.now(), text: t }]); setTokenInput(""); };
		const updateToken = (i, text) => { const c = [...tokens]; c[i] = { ...c[i], text }; setTokens(c); };
		const removeToken = (i) => setTokens((s) => s.filter((_, idx) => idx !== i));

		// TRUE_FALSE fields
		const [tfStatement, setTfStatement] = useState("");
		const [tfOptions, setTfOptions] = useState([
			{ key: "A", label: "Đúng" },
			{ key: "B", label: "Sai" },
		]);
		const [tfCorrect, setTfCorrect] = useState("A");
		const [tfExplanation, setTfExplanation] = useState("");
		const updateTfOption = (key, value) => {
			setTfOptions((prev) => prev.map((opt) => (opt.key === key ? { ...opt, label: value } : opt)));
		};

		// TYPING_CHALLENGE fields
		const [typingTarget, setTypingTarget] = useState("");
		const [typingCaseSensitive, setTypingCaseSensitive] = useState(false);
		const [typingTimeLimit, setTypingTimeLimit] = useState("");
		const [typingHints, setTypingHints] = useState([]);
		const [typingHintInput, setTypingHintInput] = useState("");
		const addTypingHint = () => {
			const next = (typingHintInput || "").trim();
			if (!next) return;
			if (typingHints.length >= 5) {
				toast.warning("Tối đa 5 gợi ý");
				return;
			}
			setTypingHints((prev) => [...prev, next]);
			setTypingHintInput("");
		};
		const updateTypingHint = (index, value) => {
			setTypingHints((prev) => prev.map((hint, idx) => (idx === index ? value : hint)));
		};
		const removeTypingHint = (index) => {
			setTypingHints((prev) => prev.filter((_, idx) => idx !== index));
		};

		// FLIP_CARD fields
		const [flipCards, setFlipCards] = useState([]);
		const addFlipCard = () => setFlipCards([...flipCards, { term: "", definition: "", phonetic: "", partOfSpeech: "" }]);
		const updateFlipCard = (idx, field, val) => {
			const copy = [...flipCards]; copy[idx] = { ...copy[idx], [field]: val }; setFlipCards(copy);
		};
		const removeFlipCard = (idx) => setFlipCards(flipCards.filter((_, i) => i !== idx));
		const fetchFlipCardInfo = async (idx, term) => {
			const word = (term || "").trim();
			if (word.length < 2) return;

			try {
				const [dictRes, transRes] = await Promise.all([
					fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`),
					fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(word)}`),
				]);

				let phonetic = "";
				let partOfSpeech = "";
				let definition = "";

				if (dictRes.ok) {
					const dictData = await dictRes.json();
					const entry = Array.isArray(dictData) ? dictData[0] : null;
					phonetic = entry?.phonetic || entry?.phonetics?.find((item) => item.text)?.text || "";
					partOfSpeech = entry?.meanings?.[0]?.partOfSpeech || "";
				}

				if (transRes.ok) {
					const transData = await transRes.json();
					definition = Array.isArray(transData) ? transData?.[0]?.[0]?.[0] || "" : "";
				}

				if (!phonetic && !partOfSpeech && !definition) return;

				setFlipCards((prev) => prev.map((card, cardIndex) => {
					if (cardIndex !== idx) return card;
					return {
						...card,
						definition: definition || card.definition,
						phonetic: phonetic || card.phonetic || "",
						partOfSpeech: partOfSpeech || card.partOfSpeech || "",
					};
				}));
			} catch (err) {
				console.error("Auto-fill flashcard failed", err);
			}
		};

		// WATCH_VIDEO fields
		const [watchVideoHls, setWatchVideoHls] = useState("");
		const [watchVideoMp4, setWatchVideoMp4] = useState("");
		const [watchVideoTitle, setWatchVideoTitle] = useState("");
		const watchVideoFileInputRef = useRef(null);
		const [watchVideoUploading, setWatchVideoUploading] = useState(false);

		// LESSON fields
		const [content, setContent] = useState("");
		const [showPreview, setShowPreview] = useState(false);

		// Exam fields
		const [questions, setQuestions] = useState([]);
		const addQuestion = () => { setQuestions([...questions, { question: "", options: ["", "", "", ""], correctIndex: 0 }]); };
		const updateQuestion = (idx, field, value) => { setQuestions(prev => { const copy = [...prev]; copy[idx][field] = value; return copy; }); };
		const updateOption = (qIdx, optIdx, value) => { setQuestions(prev => { const copy = [...prev]; copy[qIdx].options[optIdx] = value; return copy; }); };
		const removeQuestion = (idx) => { setQuestions(prev => prev.filter((_, i) => i !== idx)); };

		// Listen Select fields
		const [audioUrl, setAudioUrl] = useState("");
		const [listenOptions, setListenOptions] = useState([]);
		const [correctIndex, setCorrectIndex] = useState(0);
		const addListenOption = () => { setListenOptions([...listenOptions, { id: Date.now(), text: "", imageUrl: "" }]); };
		const updateListenOption = (idx, field, value) => { setListenOptions(prev => { const copy = [...prev]; copy[idx][field] = value; return copy; }); };
		const removeListenOption = (idx) => { setListenOptions(prev => prev.filter((_, i) => i !== idx)); };

		const getQuickInputHint = () => {
			const hints = {
				match_image_word: "Mỗi dòng: từ | imageUrl",
				sentence_builder: "Dán 1 câu để tự tách thành token, hoặc mỗi dòng 1 token",
				listen_select: "Mỗi dòng: text | imageUrl. Dòng đầu tiên sẽ là đáp án đúng",
				exam: "Mỗi dòng: câu hỏi | đáp án A | đáp án B | đáp án C | đáp án D | đáp án đúng 1-4",
				true_false: "4 dòng: statement, đáp án A, đáp án B, phương án đúng: A hoặc B",
				typing_challenge: "Dòng 1: target text. Các dòng sau: gợi ý",
				flip_card: "Mỗi dòng: term | definition",
			};
			return hints[type] || "Dán dữ liệu hàng loạt";
		};

		const getQuickInputSample = () => {
			const samples = {
				match_image_word: [
					"apple | https://example.com/apple.jpg",
					"book | https://example.com/book.jpg",
					"school | https://example.com/school.jpg",
				],
				sentence_builder: [
					"I usually study English in the evening.",
				],
				listen_select: [
					"apple | https://example.com/apple.jpg",
					"banana | https://example.com/banana.jpg",
					"orange | https://example.com/orange.jpg",
				],
				exam: [
					"What does apple mean? | Quả táo | Quyển sách | Trường học | Cây bút | 1",
					"Which sentence is correct? | I am a student. | I is a student. | I are a student. | I be a student. | 1",
				],
				true_false: [
					"Quả táo tiếng anh là gì?",
					"Apple",
					"Pineapple",
					"Phương án đúng: A",
				],
				typing_challenge: [
					"I practice English every day.",
					"Gợi ý: câu nói về thói quen hằng ngày",
					"Gợi ý: bắt đầu bằng I practice...",
				],
				flip_card: [
					"apple | quả táo",
					"book | quyển sách",
					"teacher | giáo viên",
				],
			};
			return samples[type] || ["Dán dữ liệu theo mẫu của loại minigame đang chọn."];
		};

		const downloadQuickInputSample = () => {
			const sampleText = getQuickInputSample().join("\n");
			const html = `
				<html>
					<head>
						<meta charset="utf-8" />
						<title>Mẫu nhập nhanh minigame</title>
						<style>
							body { font-family: Arial, sans-serif; line-height: 1.5; }
							pre { border: 1px solid #ddd; padding: 12px; white-space: pre-wrap; }
						</style>
					</head>
					<body>
						<h2>Mẫu nhập nhanh minigame</h2>
						<p><strong>Loại:</strong> ${type}</p>
						<p><strong>Cách dùng:</strong> Sửa nội dung bên dưới trong Word, sau đó copy toàn bộ phần trong khung và dán vào ô Nhập nhanh.</p>
						<p><strong>Định dạng:</strong> ${getQuickInputHint()}</p>
						<pre>${sampleText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
					</body>
				</html>
			`;
			const blob = new Blob(["\ufeff", html], { type: "application/msword;charset=utf-8" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `mau-nhap-nhanh-${type}.doc`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		};

		const applyQuickInput = () => {
			const lines = splitBulkLines(quickInput);
			if (!lines.length) return toast.warning("Vui lòng dán dữ liệu trước");

			if (type === "match_image_word") {
				for (let index = 0; index < lines.length; index += 1) {
					const [correctWord, imageUrl] = splitBulkColumns(lines[index]);
					if (!correctWord || !imageUrl) {
						return toast.warning(`Dòng ${index + 1} cần đủ: từ | imageUrl`);
					}
					if (!isValidQuickUrl(imageUrl)) {
						return toast.warning(`Dòng ${index + 1}: imageUrl không hợp lệ`);
					}
				}
				const nextImages = lines
					.map((line, index) => {
						const [correctWord, imageUrl] = splitBulkColumns(line);
						return { id: makeId(index), correctWord: correctWord || "", imageUrl: imageUrl || "" };
					})
					.filter((item) => item.correctWord || item.imageUrl);
				if (!nextImages.length) return toast.warning("Không đọc được dữ liệu ảnh");
				setImages(nextImages);
				return toast.success("Đã nhập nhanh danh sách ảnh");
			}

			if (type === "sentence_builder") {
				const rawTokens = lines.length === 1 ? lines[0].split(/\s+/) : lines;
				const nextTokens = rawTokens
					.map((text, index) => ({ id: index + 1, text: text.trim() }))
					.filter((item) => item.text);
				if (nextTokens.length < 3) return toast.warning("Cần ít nhất 3 token");
				setTokens(nextTokens);
				return toast.success("Đã nhập nhanh token");
			}

			if (type === "listen_select") {
				for (let index = 0; index < lines.length; index += 1) {
					const [text, imageUrl] = splitBulkColumns(lines[index]);
					if (!text || !imageUrl) {
						return toast.warning(`Dòng ${index + 1} cần đủ: text | imageUrl`);
					}
					if (!isValidQuickUrl(imageUrl)) {
						return toast.warning(`Dòng ${index + 1}: imageUrl không hợp lệ`);
					}
				}
				const nextOptions = lines
					.map((line, index) => {
						const [text, imageUrl] = splitBulkColumns(line);
						return { id: makeId(index), text: text || "", imageUrl: imageUrl || "" };
					})
					.filter((item) => item.text || item.imageUrl);
				if (nextOptions.length < 2) return toast.warning("Cần ít nhất 2 lựa chọn");
				setListenOptions(nextOptions);
				setCorrectIndex(0);
				return toast.success("Đã nhập nhanh options");
			}

			if (type === "exam") {
				for (let index = 0; index < lines.length; index += 1) {
					const columns = splitBulkColumns(lines[index]);
					if (columns.length < 6) {
						return toast.warning(`Dòng ${index + 1} cần đủ: câu hỏi | A | B | C | D | đáp án đúng 1-4`);
					}
					if (columns.slice(0, 5).some((item) => !item)) {
						return toast.warning(`Dòng ${index + 1} không được để trống câu hỏi hoặc đáp án`);
					}
					const correct = Number(columns[5]);
					if (!Number.isInteger(correct) || correct < 1 || correct > 4) {
						return toast.warning(`Dòng ${index + 1}: đáp án đúng phải là số từ 1 đến 4`);
					}
				}
				const nextQuestions = lines
					.map((line) => {
						const [question, ...rest] = splitBulkColumns(line);
						const options = rest.slice(0, 4);
						const correctRaw = rest[4];
						while (options.length < 4) options.push("");
						const parsedCorrect = Number(correctRaw);
						const correctIndex = Number.isFinite(parsedCorrect) && parsedCorrect >= 1 && parsedCorrect <= 4 ? parsedCorrect - 1 : 0;
						return { question: question || "", options, correctIndex };
					})
					.filter((item) => item.question || item.options.some(Boolean));
				if (!nextQuestions.length) return toast.warning("Không đọc được câu hỏi");
				setQuestions(nextQuestions);
				return toast.success("Đã nhập nhanh câu hỏi");
			}

			if (type === "true_false") {
				if (lines.length < 4) {
					return toast.warning("True/False cần 4 dòng: statement, đáp án A, đáp án B, phương án đúng");
				}
				if (!lines[0] || !lines[1] || !lines[2]) {
					return toast.warning("Statement, đáp án A và đáp án B không được để trống");
				}
				const nextCorrect = normalizeTrueFalseAnswer(lines[3]);
				if (!nextCorrect) {
					return toast.warning("Phương án đúng phải là A hoặc B");
				}
				setTfStatement(lines[0] || "");
				setTfOptions([
					{ key: "A", label: lines[1] || "Đúng" },
					{ key: "B", label: lines[2] || "Sai" },
				]);
				setTfCorrect(nextCorrect);
				return toast.success("Đã nhập nhanh True/False");
			}

			if (type === "typing_challenge") {
				if (!lines[0] || lines[0].length < 5) {
					return toast.warning("Target text cần ít nhất 5 ký tự");
				}
				setTypingTarget(lines[0] || "");
				setTypingHints(lines.slice(1, 6));
				return toast.success("Đã nhập nhanh typing challenge");
			}

			if (type === "flip_card") {
				for (let index = 0; index < lines.length; index += 1) {
					const [term, definition] = splitBulkColumns(lines[index]);
					if (!term || !definition) {
						return toast.warning(`Dòng ${index + 1} cần đủ: term | definition`);
					}
				}
				const nextCards = lines
					.map((line) => {
						const [term, definition] = splitBulkColumns(line);
						return { term: term || "", definition: definition || "" };
					})
					.filter((item) => item.term || item.definition);
				if (!nextCards.length) return toast.warning("Không đọc được flashcard");
				setFlipCards(nextCards);
				return toast.success("Đã nhập nhanh flashcard");
			}

			return toast.info("Loại này không cần nhập nhanh");
		};

		const handleSubmit = async () => {
			// basic validation
			if (!prompt.trim()) return toast.warning("Prompt không được rỗng");
			let resources = {};
			if (type === "match_image_word") {
				if (images.length < 2) return toast.warning("Cần ít nhất 2 ảnh");
				resources = { images: images.map(img => ({ id: img.id, imageUrl: img.imageUrl, correctWord: img.correctWord })) };
			}
			else if (type === "lesson") {
				if (!content.trim()) return toast.warning("Content HTML không được rỗng");
				resources = { content };
			}
			else if (type === "sentence_builder") {
				if (tokens.length < 3) return toast.warning("Cần ít nhất 3 từ");
				resources = { tokens: tokens.map(t => ({ id: t.id, text: t.text })) };
			}
			else if (type === "listen_select") {
				if (!audioUrl.trim()) return toast.warning("audioUrl không được rỗng");
				if (listenOptions.length < 2) return toast.warning("Phải có tối thiểu 2 lựa chọn");
				if (listenOptions.some(o => !o.text || !o.imageUrl))
					return toast.warning("Mỗi option phải có text + imageUrl");
				if (correctIndex < 0 || correctIndex > 3)
					return toast.warning("correctIndex phải từ 0 → 3");
				resources = { audioUrl, options: listenOptions.map(o => ({ id: o.id, text: o.text, imageUrl: o.imageUrl })), correctIndex };
			}
			else if (type === "exam") {
				if (questions.length === 0)
					return toast.warning("Cần ít nhất 1 câu hỏi");
				for (const q of questions) {
					if (!q.question.trim()) return toast.warning("Câu hỏi không được rỗng");
					if (q.options.length !== 4) return toast.warning("Mỗi câu phải có đúng 4 đáp án");
					if (q.options.some(o => !o.trim())) return toast.warning("Đáp án không được rỗng");
					if (q.correctIndex < 0 || q.correctIndex > 3)
						return toast.warning("correctIndex phải từ 0 → 3");
				}
				resources = { questions: questions.map(q => ({ question: q.question, options: q.options, correctIndex: q.correctIndex })) };
			}

			else if (type === "true_false") {
				if (!tfStatement.trim()) return toast.warning("Statement không được rỗng");
				if (!tfOptions.every((opt) => opt.label.trim())) return toast.warning("Vui lòng nhập đủ nội dung cho các lựa chọn");
				resources = {
					statement: tfStatement.trim(),
					options: tfOptions.map((opt) => ({ key: opt.key, label: opt.label.trim() })),
					correctOption: tfCorrect,
					explanation: tfExplanation.trim() || undefined,
				};
			} else if (type === "typing_challenge") {
				if (!typingTarget.trim()) return toast.warning("Target text không được rỗng");
				const numericLimit = Number(typingTimeLimit);
				if (typingTimeLimit !== "" && (!Number.isFinite(numericLimit) || numericLimit <= 0)) {
					return toast.warning("Thời gian phải là số dương");
				}
				resources = {
					targetText: typingTarget.trim(),
					caseSensitive: Boolean(typingCaseSensitive),
					hints: typingHints.map((hint) => hint.trim()).filter(Boolean),
					...(typingTimeLimit === "" ? {} : { timeLimitSeconds: Math.floor(numericLimit) }),
				};
			} else if (type === "flip_card") {
				if (flipCards.length === 0) return toast.warning("Cần ít nhất 1 thẻ");
				if (flipCards.some(c => !c.term.trim() || !c.definition.trim()))
					return toast.warning("Vui lòng điền đủ Thuật ngữ và Định nghĩa");
				resources = {
					cards: flipCards.map(c => ({
						term: c.term.trim(),
						definition: c.definition.trim(),
						phonetic: c.phonetic?.trim() || "",
						partOfSpeech: c.partOfSpeech?.trim() || "",
					}))
				};
			} else if (type === "watch_video") {
				if (!watchVideoHls && !watchVideoMp4) {
					return toast.warning("Video không được rỗng");
				}

				resources = {
					hlsUrl: watchVideoHls || undefined,
					fallbackUrl: watchVideoMp4 || undefined,
					title: watchVideoTitle.trim() || undefined,
				};
			}

			try {
				setSaving(true);
				await api.post("/minigames", { type, prompt: prompt.trim(), resources, activityId });
				onAdded && onAdded();
				onCancel && onCancel();
			} catch (err) {
				console.error(err);
				toast.error("Tạo minigame thất bại");
			} finally {
				setSaving(false);
			}
		};

		return (
			<div className="card mb-3">
				<div className="card-body">
					{/* Common: prompt */}
					<div className="mb-3">
						<label className="form-label">Prompt</label>
						<input className="form-control" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
					</div>

					{type !== "lesson" && type !== "watch_video" && (
						<div className="mb-3">
							<button
								type="button"
								className="btn btn-sm btn-outline-success"
								onClick={() => setShowQuickInput((prev) => !prev)}
							>
								{showQuickInput ? "Ẩn nhập nhanh" : "Nhập nhanh"}
							</button>

							{showQuickInput && (
								<div className="mt-2" style={getQuickInputPanelStyle(isDarkMode)}>
									<div className="d-flex justify-content-between align-items-center gap-2 mb-2">
										<label className={`form-label small mb-0 ${isDarkMode ? "text-light" : "text-muted"}`}>
											{getQuickInputHint()}
										</label>
										<button
											type="button"
											className="btn btn-sm"
											style={getSampleDownloadButtonStyle(isDarkMode)}
											onClick={downloadQuickInputSample}
										>
											<i className="bi bi-file-earmark-word" aria-hidden="true" />
											File mẫu
										</button>
									</div>
									<textarea
										className="form-control"
										rows={4}
										value={quickInput}
										onChange={(e) => setQuickInput(e.target.value)}
										placeholder={getQuickInputHint()}
										style={getQuickInputTextareaStyle(isDarkMode)}
									/>
									<div className="d-flex justify-content-end gap-2 mt-2">
										<button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setQuickInput("")}>
											Xóa
										</button>
										<button type="button" className="btn btn-sm btn-success" onClick={applyQuickInput}>
											Áp dụng
										</button>
									</div>
								</div>
							)}
						</div>
					)}

					{/* Dynamic fields */}
					{type === "match_image_word" && (
						<div>
							<div className="d-flex justify-content-between align-items-center mb-2">
								<h6>Images</h6>
								<button className="btn btn-sm btn-outline-primary" onClick={addImage}>Thêm ảnh</button>
							</div>
							{images.map((img, idx) => (
								<div key={img.id} className="card mb-2">
									<div className="card-header d-flex justify-content-between align-items-center">
										<strong>Ảnh {idx + 1}</strong>

										{/* Nút X ở cùng hàng với Thêm ảnh */}
										<button
											className="btn btn-sm btn-outline-danger"
											onClick={() => removeImage(idx)}
										>
											X
										</button>
									</div>

									<div className="card-body">
										<div className="row g-2">
											<div className="col-md-7">
												<label className="form-label small text-muted mb-1">Hình ảnh (URL hoặc Tải lên)</label>
												<input
													className="form-control form-control-sm mb-2"
													placeholder="Nhập URL"
													value={img.imageUrl}
													onChange={(e) => updateImage(idx, "imageUrl", e.target.value)}
												/>
												<input
													type="file"
													className="form-control form-control-sm"
													accept="image/*"
													onChange={(e) => handleUploadImage(e.target.files[0], (url) => updateImage(idx, "imageUrl", url))}
												/>

												{img.imageUrl && (
													<img
														src={img.imageUrl}
														alt=""
														style={{
															width: "100%",
															maxHeight: 200,
															objectFit: "contain",
															borderRadius: 6,
															marginTop: 8,
														}}
														onError={(e) => (e.target.style.display = "none")}
													/>
												)}
											</div>

											<div className="col-md-5">
												<label className="form-label small text-muted mb-1">Từ tương ứng</label>
												<input
													className="form-control form-control-sm"
													placeholder="Ví dụ: Apple"
													value={img.correctWord}
													onChange={(e) => updateImage(idx, "correctWord", e.target.value)}
												/>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					)}

					{type === "lesson" && (
						<div>
							<div className="d-flex justify-content-between align-items-center mb-2">
								<label className="form-label mb-0">Content</label>

								<button
									type="button"
									className={`btn btn-sm ${showPreview ? "btn-primary" : "btn-outline-secondary"}`}
									onClick={() => setShowPreview(!showPreview)}
								>
									{showPreview ? "Chỉnh sửa" : "Xem trước"}
								</button>
							</div>

							{/* EDITOR */}
							{!showPreview ? (
								<Editor
									apiKey="5h1mny4wdy7lwto04bpgonbbj9ymfa8bmjxmmjiee045hxq7"
									value={content}
									init={{
										height: 350,
										menubar: false,
										plugins: "lists table paste link image code",
										toolbar:
											"undo redo | bold italic underline | bullist numlist | table | link image | alignleft aligncenter alignright | code",

										// Auto clean Word formatting
										paste_data_images: false,
										paste_as_text: false,
										paste_webkit_styles: "bold italic underline",
										paste_merge_formats: true,
										paste_convert_word_fake_lists: true,
										paste_retain_style_properties: "color font-size",

										content_style:
											"body { font-family: Arial, sans-serif; font-size: 14px; background: transparent; }",
									}}
									onEditorChange={(val) => setContent(val)}
								/>
							) : (
								<div
									className="p-3 border rounded"
									style={{ background: "#f8f9fa", minHeight: 120 }}
									dangerouslySetInnerHTML={{ __html: content }}
								/>
							)}
						</div>
					)}

					{type === "sentence_builder" && (
						<div>
							<div className="d-flex gap-2 mb-2">
								<input className="form-control" placeholder="New token" style={{ maxWidth: 300 }} value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addToken(); }} />
								<button className="btn btn-sm btn-outline-primary" onClick={addToken}>Thêm</button>
							</div>
							{tokens.map((t, i) => (
								<div key={t.id} className="input-group mb-2">
									<input className="form-control" value={t.text} onChange={(e) => updateToken(i, e.target.value)} />
									<button className="btn btn-outline-secondary" onClick={() => moveTokenLocal(i, -1)} disabled={i === 0}>↑</button>
									<button className="btn btn-outline-secondary" onClick={() => moveTokenLocal(i, 1)} disabled={i === tokens.length - 1}>↓</button>
									<button className="btn btn-outline-danger" onClick={() => removeToken(i)}>Xóa</button>
								</div>
							))}
						</div>
					)}
					{type === "exam" && (
						<div>
							<div className="d-flex justify-content-between align-items-center mb-2">
								<h6>Các câu hỏi</h6>
								<button className="btn btn-sm btn-outline-primary" onClick={addQuestion}>
									Thêm câu hỏi
								</button>
							</div>

							{questions.map((q, qIdx) => (
								<div key={qIdx} className="card mb-3">
									<div className="card-header d-flex justify-content-between align-items-center">
										<strong>Câu {qIdx + 1}</strong>
										<button className="btn btn-sm btn-outline-danger" onClick={() => removeQuestion(qIdx)}>X</button>
									</div>

									<div className="card-body">
										<label className="form-label">Câu hỏi</label>
										<input
											className="form-control mb-3"
											value={q.question}
											onChange={(e) => updateQuestion(qIdx, "question", e.target.value)}
										/>

										<label className="form-label">Đáp án</label>
										{q.options.map((opt, optIdx) => (
											<div key={optIdx} className="input-group mb-2">
												<span className="input-group-text">{String.fromCharCode(65 + optIdx)}</span>
												<input
													className="form-control"
													value={opt}
													onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
												/>
												<div className="input-group-text">
													<input
														type="radio"
														checked={q.correctIndex === optIdx}
														onChange={() => updateQuestion(qIdx, "correctIndex", optIdx)}
													/>
												</div>
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					)}
					{type === "listen_select" && (
						<div>
							<label className="form-label">Audio URL</label>
							<input
								className="form-control mb-3"
								value={audioUrl}
								onChange={(e) => setAudioUrl(e.target.value)}
							/>

							{audioUrl && (
								<audio controls className="mb-3" style={{ width: "100%" }}>
									<source src={audioUrl} />
								</audio>
							)}

							<div className="d-flex justify-content-between align-items-center mb-2">
								<h6>Options</h6>
								<button className="btn btn-sm btn-outline-primary" onClick={addListenOption}>
									Thêm option
								</button>
							</div>

							{listenOptions.map((opt, idx) => (
								<div key={opt.id} className="card mb-2">
									<div className="card-header d-flex justify-content-between align-items-center">
										{/* Left section: Option title + Radio */}
										<div className="d-flex align-items-center gap-3">
											<strong>Option {idx + 1}</strong>

											<div className="input-group-text">
												<input
													type="radio"
													checked={correctIndex === idx}
													onChange={() => setCorrectIndex(idx)}
												/>
											</div>
										</div>

										{/* Right section: delete button */}
										<button
											className="btn btn-sm btn-outline-danger"
											onClick={() => removeListenOption(idx)}
										>
											X
										</button>
									</div>

									<div className="card-body">
										<div className="mb-2">
											<label className="form-label">Text</label>
											<input
												className="form-control"
												value={opt.text}
												onChange={(e) => updateListenOption(idx, "text", e.target.value)}
											/>
										</div>

										<div>
											<label className="form-label">Hình ảnh minh họa (URL hoặc Tải lên)</label>
											<input
												className="form-control form-control-sm mb-2"
												placeholder="Nhập URL ảnh"
												value={opt.imageUrl}
												onChange={(e) => updateListenOption(idx, "imageUrl", e.target.value)}
											/>
											<input
												type="file"
												className="form-control form-control-sm mb-2"
												accept="image/*"
												onChange={(e) => handleUploadImage(e.target.files[0], (url) => updateListenOption(idx, "imageUrl", url))}
											/>

											{opt.imageUrl && (
												<img
													src={opt.imageUrl}
													alt=""
													style={{
														width: "100%",
														maxHeight: 200,
														objectFit: "contain",
														borderRadius: 6,
														marginTop: 8
													}}
													onError={(e) => (e.target.style.display = "none")}
												/>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					)}
					{type === "true_false" && (
						<div>
							<div className="mb-3">
								<label className="form-label">Statement</label>
								<textarea className="form-control" rows={3} value={tfStatement} onChange={(e) => setTfStatement(e.target.value)} />
							</div>

							<div className="mb-3">
								<h6 className="mb-2">Lựa chọn</h6>
								{tfOptions.map((opt) => (
									<div key={opt.key} className="mb-2">
										<label className="form-label">Phương án {opt.key}</label>
										<input className="form-control" value={opt.label} onChange={(e) => updateTfOption(opt.key, e.target.value)} />
									</div>
								))}
							</div>

							<div className="mb-3">
								<label className="form-label">Đáp án đúng</label>
								<select className="form-select" value={tfCorrect} onChange={(e) => setTfCorrect(e.target.value)}>
									<option value="A">A</option>
									<option value="B">B</option>
								</select>
							</div>

							<div className="mb-3">
								<label className="form-label">Giải thích (tùy chọn)</label>
								<textarea className="form-control" rows={3} value={tfExplanation} onChange={(e) => setTfExplanation(e.target.value)} />
							</div>
						</div>
					)}

					{type === "typing_challenge" && (
						<div>
							<div className="mb-3">
								<label className="form-label">Target text</label>
								<textarea className="form-control" rows={3} value={typingTarget} onChange={(e) => setTypingTarget(e.target.value)} />
							</div>

							<div className="form-check form-switch mb-3">
								<input className="form-check-input" type="checkbox" id="typingCaseSensitiveToggle" checked={typingCaseSensitive} onChange={(e) => setTypingCaseSensitive(e.target.checked)} />
								<label className="form-check-label" htmlFor="typingCaseSensitiveToggle">Phân biệt chữ hoa chữ thường</label>
							</div>

							<div className="mb-3">
								<label className="form-label">Thời gian (giây, tùy chọn)</label>
								<input className="form-control" type="number" min="0" value={typingTimeLimit} onChange={(e) => setTypingTimeLimit(e.target.value === "" ? "" : Number(e.target.value))} />
							</div>

							<div className="mb-3">
								<div className="d-flex justify-content-between align-items-center mb-2">
									<label className="form-label mb-0">Gợi ý (tối đa 5)</label>
									<div className="d-flex gap-2">
										<input className="form-control form-control-sm" style={{ width: 240 }} placeholder="Thêm gợi ý" value={typingHintInput} onChange={(e) => setTypingHintInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTypingHint(); } }} />
										<button className="btn btn-sm btn-outline-primary" onClick={addTypingHint}>Thêm</button>
									</div>
								</div>
								{typingHints.length === 0 && <div className="text-muted">Chưa có gợi ý</div>}
								{typingHints.map((hint, idx) => (
									<div key={idx} className="input-group mb-2">
										<span className="input-group-text">{idx + 1}</span>
										<input className="form-control" value={hint} onChange={(e) => updateTypingHint(idx, e.target.value)} />
										<button className="btn btn-outline-danger" onClick={() => removeTypingHint(idx)}>Xóa</button>
									</div>
								))}
							</div>
						</div>
					)}

					{type === "watch_video" && (
						<div>
							<div className="mb-3">
								<label className="form-label">Video (Nhập URL hoặc Tải lên) (*)</label>

								<div className="input-group mb-2">
									<input
										type="text"
										className="form-control"
										placeholder="Nhập URL video"
										value={watchVideoHls || watchVideoMp4}
										onChange={(e) => {
											const value = e.target.value;

											if (value.includes(".m3u8")) {
												setWatchVideoHls(value);
												setWatchVideoMp4("");
											} else {
												setWatchVideoMp4(value);
												setWatchVideoHls("");
											}
										}}
									/>

									<button
										type="button"
										className="btn btn-outline-secondary"
										onClick={() => watchVideoFileInputRef.current?.click()}
										disabled={watchVideoUploading}
									>
										{watchVideoUploading ? "Đang tải..." : "Tải lên"}
									</button>

									<input
										type="file"
										accept="video/*"
										className="d-none"
										ref={watchVideoFileInputRef}
										onChange={async (e) => {
											const file = e.target.files?.[0];
											if (!file) return;

											if (!file.type.startsWith("video/")) {
												toast.warning("Chọn file video hợp lệ");
												return;
											}

											const formData = new FormData();
											formData.append("video", file);

											try {
												setWatchVideoUploading(true);

												const res = await api.post("/uploads/video", formData, {
													headers: { "Content-Type": "multipart/form-data" },
												});

												if (res.data) {
													setWatchVideoHls(res.data.hlsUrl.replace("http://", "https://"));
													setWatchVideoMp4(res.data.fallbackUrl);
												}
											} catch (err) {
												console.error(err);
												toast.error("Upload video thất bại");
											} finally {
												setWatchVideoUploading(false);
												if (watchVideoFileInputRef.current)
													watchVideoFileInputRef.current.value = "";
											}
										}}
									/>
								</div>

								{(watchVideoHls || watchVideoMp4) && (
									<div className="mt-2">
										<HLSPlayer
											hlsUrl={watchVideoHls}
											fallbackUrl={watchVideoMp4}
										/>
									</div>
								)}
							</div>

							<div className="mb-3">
								<label className="form-label">Tiêu đề video (Tùy chọn)</label>
								<input
									type="text"
									className="form-control"
									value={watchVideoTitle}
									onChange={(e) => setWatchVideoTitle(e.target.value)}
								/>
							</div>
						</div>
					)}

					{type === "flip_card" && (
						<div>
							<div className="d-flex justify-content-between align-items-center mb-2">
								<h6>Thẻ ghi nhớ (Cards)</h6>
								<button className="btn btn-sm btn-outline-primary" onClick={addFlipCard}>Thêm thẻ</button>
							</div>
							{flipCards.map((card, idx) => (
								<div key={idx} className="card mb-2 bg-light">
									<div className="card-body">
										<div className="row g-2 align-items-center">
											<div className="col-md-5">
												<input
													className="form-control"
													placeholder="Thuật ngữ"
													value={card.term}
													onChange={(e) => updateFlipCard(idx, "term", e.target.value)}
													onBlur={(e) => fetchFlipCardInfo(idx, e.target.value)}
												/>
											</div>
											<div className="col-md-5">
												<input className="form-control" placeholder="Định nghĩa" value={card.definition} onChange={(e) => updateFlipCard(idx, "definition", e.target.value)} />
											</div>
											<div className="col-md-2 d-flex justify-content-end">
												<button className="btn btn-sm btn-outline-danger" onClick={() => removeFlipCard(idx)}>X</button>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					)}

					<div className="d-flex align-items-center mb-3">
						<div className="ms-auto">
							<button className="btn btn-sm btn-outline-secondary me-2" onClick={onCancel}>Hủy</button>
							<button className="btn btn-sm btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? "Đang tạo..." : "Tạo"}</button>
						</div>
					</div>
				</div>

			</div>
		);

		// helper for moving tokens in local state
		function moveTokenLocal(index, dir) {
			const copy = [...tokens];
			const to = index + dir;
			if (to < 0 || to >= copy.length) return;
			const tmp = copy[to]; copy[to] = copy[index]; copy[index] = tmp;
			setTokens(copy);
		}
	}, []);

	const load = useCallback(async () => {
		if (!activityId) {
			setMinigames([]);
			return;
		}
		setLoading(true);
		try {
			const resp = await api.get(`/activities/${activityId}/minigames`);
			setMinigames(resp.data ?? []);
		} catch (err) {
			console.error(err);
			setMinigames([]);
		} finally {
			setLoading(false);
		}
	}, [activityId]);

	useEffect(() => {
		load();
	}, [load]);

	const openDetail = async (id) => {
		setDetailLoading(true);
		try {
			const resp = await api.get(`/minigames/${id}`);
			setSelected(resp.data);
		} catch (err) {
			console.error("Load minigame detail failed", err);
			toast.error("Không thể tải chi tiết minigame");
		} finally {
			setDetailLoading(false);
		}
	};

	const closeDetail = () => setSelected(null);

	// save từ modal -> gọi API PUT, reload list và cập nhật selected
	const handleSaveDetail = async (id, payload) => {
		try {
			const resp = await api.put(`/minigames/${id}`, payload);
			// cập nhật selected với dữ liệu trả về (nếu server trả)
			setSelected(resp.data ?? { ...selected, ...payload });
			await load();
			onRefresh && onRefresh();
			toast.success("Lưu minigame thành công");
		} catch (err) {
			console.error("Save minigame failed", err);
			toast.error("Lưu minigame thất bại");
		}
	};

	// xóa từ modal
	const handleDeleteDetail = async (id) => {
		const confirmed = await toast.confirm("Xác nhận xóa minigame?", { type: 'danger', confirmText: 'Xóa', cancelText: 'Hủy' });
		if (!confirmed) return;
		try {
			await api.delete(`/minigames/${id}`);
			closeDetail();
			await load();
			onRefresh && onRefresh();
			toast.success("Xóa thành công");
		} catch (err) {
			console.error("Delete minigame failed", err);
			toast.error("Xóa thất bại");
		}
	};

	// xóa trực tiếp từ danh sách (wrapper) — tránh lỗi khi gọi handleDelete trong rendering
	const handleDelete = async (id) => {
		const confirmed = await toast.confirm("Xác nhận xóa minigame?", { type: 'danger', confirmText: 'Xóa', cancelText: 'Hủy' });
		if (!confirmed) return;
		try {
			await api.delete(`/minigames/${id}`);
			await load();
			onRefresh && onRefresh();
			toast.success("Xóa thành công");
		} catch (err) {
			console.error("Delete minigame failed", err);
			toast.error("Xóa thất bại");
		}
	};

	// prevent body scroll when modal open
	useEffect(() => {
		if (selected) {
			const prev = document.body.style.overflow;
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = prev || "";
			};
		}
		return;
	}, [selected]);

	return (
		<div>
			<div className="d-flex justify-content-between align-items-center mb-2">
				<h6 className="mb-0">Minigames ({minigames.length})</h6>
				<div className="d-flex gap-2">
					<button className="btn btn-sm btn-primary" onClick={() => { setShowAddPanel(s => !s); setAddType("match_image_word"); }}>
						Thêm minigame
					</button>
					<button className="btn btn-sm btn-outline-secondary" onClick={load} disabled={loading}>Tải lại</button>
				</div>
			</div>

			{showAddPanel && (
				<div className="mb-3">
					<div className="d-flex gap-2 mb-2 align-items-center">
						<label className="me-2 mb-0">Kiểu:</label>
						<select className="form-select" style={{ width: 250 }} value={addType} onChange={(e) => setAddType(e.target.value)}>
							<option value="match_image_word">match_image_word</option>
							<option value="lesson">lesson</option>
							<option value="sentence_builder">sentence_builder</option>
							<option value="listen_select">listen_select</option>
							<option value="exam">exam</option>
							<option value="true_false">true_false</option>
							<option value="typing_challenge">typing_challenge</option>
							<option value="flip_card">flip_card</option>
							<option value="watch_video">watch_video</option>
						</select>
					</div>
					{/* render form for selected addType */}
					<AddMiniGameForm
						key={addType}
						activityId={activityId}
						type={addType}
						onCancel={() => setShowAddPanel(false)}
						onAdded={async () => { await load(); onRefresh && onRefresh(); }}
					/>
				</div>
			)}

			<ul className="list-group">
				{minigames.map((m) => (
					<li key={m.id} className="list-group-item d-flex justify-content-between align-items-center">
						<div style={{ cursor: "pointer" }} onClick={() => openDetail(m.id)}>
							<strong>Thể loại:</strong> {m.constructorName ?? m.type ?? "Minigame"}
							<div className="small text-muted">{m.prompt}</div>
						</div>
						<div className="d-flex gap-2">
							<button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(m.id)}>Xóa</button>
						</div>
					</li>
				))}
			</ul>

			{/* Render modal into document.body via portal to avoid stacking-context issues */}
			{selected && createPortal(
				<div
					role="dialog"
					aria-modal="true"
					onClick={closeDetail}
					style={{
						position: "fixed",
						inset: 0,
						background: "rgba(0,0,0,0.5)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 2147483647, // very high to ensure on top
						padding: 16,
						pointerEvents: "auto",
					}}
				>
					<div
						onClick={(e) => e.stopPropagation()}
						style={{
							width: "90%",
							maxWidth: 900,
							maxHeight: "80vh",
							overflowY: "auto",
							background: "#fff",
							borderRadius: 8,
							boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
							padding: 12,
						}}
					>
						{detailLoading ? (
							<div className="card p-3"><LoadingSpinner inline size="sm" variant="dots" /></div>
						) : (
							(selected.type === "match_image_word") ? (
								<MatchImageWordMiniGame
									minigame={selected}
									onClose={closeDetail}
									onSave={(payload) => handleSaveDetail(selected.id, payload)}
									onDelete={() => handleDeleteDetail(selected.id)}
								/>
							) : (selected.type === "lesson") ? (
								<LessonMiniGame
									minigame={selected}
									onClose={closeDetail}
									onSave={(payload) => handleSaveDetail(selected.id, payload)}
									onDelete={() => handleDeleteDetail(selected.id)}
								/>
							) : (selected.type === "sentence_builder") ? (
								<SentenceBuilderMiniGame
									minigame={selected}
									onClose={closeDetail}
									onSave={(payload) => handleSaveDetail(selected.id, payload)}
									onDelete={() => handleDeleteDetail(selected.id)}
								/>
							) : (selected.type === "listen_select") ? (
								<ListenSelectMiniGame
									minigame={selected}
									onClose={closeDetail}
									onSave={(payload) => handleSaveDetail(selected.id, payload)}
									onDelete={() => handleDeleteDetail(selected.id)}
								/>
							) : (selected.type === "exam") ? (
								<ExamMiniGame
									minigame={selected}
									onClose={closeDetail}
									onSave={(payload) => handleSaveDetail(selected.id, payload)}
									onDelete={() => handleDeleteDetail(selected.id)}
								/>
							) : (selected.type === "true_false") ? (
								<TrueFalseMiniGame
									minigame={selected}
									onClose={closeDetail}
									onSave={(payload) => handleSaveDetail(selected.id, payload)}
									onDelete={() => handleDeleteDetail(selected.id)}
								/>
							) : (selected.type === "typing_challenge") ? (
								<TypingChallengeMiniGame
									minigame={selected}
									onClose={closeDetail}
									onSave={(payload) => handleSaveDetail(selected.id, payload)}
									onDelete={() => handleDeleteDetail(selected.id)}
								/>
							) : (selected.type === "flip_card") ? (
								<FlipCardMiniGame
									minigame={selected}
									onClose={closeDetail}
									onSave={(payload) => handleSaveDetail(selected.id, payload)}
									onDelete={() => handleDeleteDetail(selected.id)}
								/>
							) : (selected.type === "watch_video") ? (
								<WatchVideoMiniGame
									minigame={selected}
									onClose={closeDetail}
									onSave={(payload) => handleSaveDetail(selected.id, payload)}
									onDelete={() => handleDeleteDetail(selected.id)}
								/>
							) : (
								<div className="card p-3">
									<div className="d-flex justify-content-between">
										<h5>Minigame: {selected.type}</h5>
										<div>
											<button className="btn btn-sm btn-danger me-2" onClick={() => handleDeleteDetail(selected.id)}>Xóa</button>
											<button className="btn btn-sm btn-outline-secondary" onClick={closeDetail}>Đóng</button>
										</div>
									</div>
									<pre style={{ maxHeight: 400, overflow: "auto" }}>{JSON.stringify(selected, null, 2)}</pre>
								</div>
							)
						)}
					</div>
				</div>,
				document.body
			)}
		</div>
	);
};

export default MiniGameList;
