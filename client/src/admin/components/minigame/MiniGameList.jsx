import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../../api/api";
import MatchImageWordMiniGame from "./MatchImageWordMiniGame";
import LessonMiniGame from "./LessonMiniGame";
import SentenceBuilderMiniGame from "./SentenceBuilderMiniGame";
import ListenSelectMiniGame from "./ListenSelectMiniGame";
import ExamMiniGame from "./ExamMiniGame";
import TrueFalseMiniGame from "./TrueFalseMiniGame";
import TypingChallengeMiniGame from "./TypingChallengeMiniGame";
import { useToast } from "../../../context/ToastContext";

import { Editor } from "@tinymce/tinymce-react";

const MiniGameList = ({ activityId, onRefresh }) => {
	const toast = useToast();
	const [minigames, setMinigames] = useState([]);
	const [loading, setLoading] = useState(false);
	const [selected, setSelected] = useState(null);
	const [detailLoading, setDetailLoading] = useState(false);

	// new: show add panel and selected type for dynamic form
	const [showAddPanel, setShowAddPanel] = useState(false);
	const [addType, setAddType] = useState("match_image_word");

	// Embedded dynamic add form component (keeps file count minimal)
	const AddMiniGameForm = ({ activityId, type, onCancel, onAdded }) => {
		const toast = useToast();
		const [prompt, setPrompt] = useState("");
		const [saving, setSaving] = useState(false);

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

		// LESSON fields
		const [content, setContent] = useState("");
    const [showPreview, setShowPreview] = useState(false);

		// Exam fields
		const [questions, setQuestions] = useState([]);
		const addQuestion = () => { setQuestions([...questions, { question: "", options: ["","","",""], correctIndex: 0 }]);};
		const updateQuestion = (idx, field, value) => {setQuestions(prev => { const copy = [...prev]; copy[idx][field] = value; return copy;});};
		const updateOption = (qIdx, optIdx, value) => {setQuestions(prev => { const copy = [...prev]; copy[qIdx].options[optIdx] = value; return copy;});};
		const removeQuestion = (idx) => { setQuestions(prev => prev.filter((_, i) => i !== idx));};

		// Listen Select fields
		const [audioUrl, setAudioUrl] = useState("");
		const [listenOptions, setListenOptions] = useState([]);
		const [correctIndex, setCorrectIndex] = useState(0);
		const addListenOption = () => {setListenOptions([...listenOptions, { id: Date.now(), text: "", imageUrl: "" }]);};
		const updateListenOption = (idx, field, value) => { setListenOptions(prev => { const copy = [...prev]; copy[idx][field] = value; return copy;});};
		const removeListenOption = (idx) => { setListenOptions(prev => prev.filter((_, i) => i !== idx));};

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
				if (listenOptions.length  <2) return toast.warning("Phải có tối thiểu 2 lựa chọn");
				if (listenOptions.some(o => !o.text || !o.imageUrl))
					return toast.warning("Mỗi option phải có text + imageUrl");
				if (correctIndex < 0 || correctIndex > 3)
					return toast.warning("correctIndex phải từ 0 → 3");
				resources = { audioUrl, options: listenOptions.map(o => ({ id: o.id, text: o.text,imageUrl: o.imageUrl})),correctIndex};
			}
			else if (type === "exam"){
				if (questions.length === 0)
					return toast.warning("Cần ít nhất 1 câu hỏi");
				for (const q of questions) {
					if (!q.question.trim()) return toast.warning("Câu hỏi không được rỗng");
					if (q.options.length !== 4) return toast.warning("Mỗi câu phải có đúng 4 đáp án");
					if (q.options.some(o => !o.trim())) return toast.warning("Đáp án không được rỗng");
					if (q.correctIndex < 0 || q.correctIndex > 3)
						return toast.warning("correctIndex phải từ 0 → 3");
				}
				resources = { questions: questions.map(q => ({ question: q.question, options: q.options, correctIndex: q.correctIndex}))};
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
                        <input
                          className="form-control"
                          placeholder="Image URL"
                          value={img.imageUrl}
                          onChange={(e) => updateImage(idx, "imageUrl", e.target.value)}
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
                        <input
                          className="form-control"
                          placeholder="Correct word"
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
									<button className="btn btn-outline-secondary" onClick={() => moveTokenLocal(i, -1)} disabled={i===0}>↑</button>
									<button className="btn btn-outline-secondary" onClick={() => moveTokenLocal(i, 1)} disabled={i===tokens.length-1}>↓</button>
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
									<label className="form-label">Image URL</label>
									<input
										className="form-control"
										value={opt.imageUrl}
										onChange={(e) => updateListenOption(idx, "imageUrl", e.target.value)}
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
	};

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
			console.log("Saving minigame", id, payload);
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
							<div className="card p-3">Loading...</div>
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
							): (selected.type === "exam") ? (
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
