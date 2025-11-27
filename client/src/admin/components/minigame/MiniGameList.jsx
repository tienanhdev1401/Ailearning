import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../../api/api";
import MatchImageWordMiniGame from "./MatchImageWordMiniGame";
import LessonMiniGame from "./LessonMiniGame";
import SentenceBuilderMiniGame from "./SentenceBuilderMiniGame";
import TrueFalseMiniGame from "./TrueFalseMiniGame";
import TypingChallengeMiniGame from "./TypingChallengeMiniGame";

const MiniGameList = ({ activityId, onRefresh }) => {
	const [minigames, setMinigames] = useState([]);
	const [loading, setLoading] = useState(false);
	const [selected, setSelected] = useState(null);
	const [detailLoading, setDetailLoading] = useState(false);

	// new: show add panel and selected type for dynamic form
	const [showAddPanel, setShowAddPanel] = useState(false);
	const [addType, setAddType] = useState("match_image_word");

	// Embedded dynamic add form component (keeps file count minimal)
	const AddMiniGameForm = ({ activityId, type, onCancel, onAdded }) => {
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
				alert("Tối đa 5 gợi ý");
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

		const handleSubmit = async () => {
			// basic validation
			if (!prompt.trim()) return alert("Prompt không được rỗng");
			let resources = {};
			if (type === "match_image_word") {
				if (images.length < 2) return alert("Cần ít nhất 2 ảnh");
				resources = { images: images.map(img => ({ id: img.id, imageUrl: img.imageUrl, correctWord: img.correctWord })) };
			} else if (type === "lesson") {
				if (!content.trim()) return alert("Content HTML không được rỗng");
				resources = { content };
			} else if (type === "sentence_builder") {
				if (tokens.length < 3) return alert("Cần ít nhất 3 từ");
				resources = { tokens: tokens.map(t => ({ id: t.id, text: t.text })) };
			} else if (type === "true_false") {
				if (!tfStatement.trim()) return alert("Statement không được rỗng");
				if (!tfOptions.every((opt) => opt.label.trim())) return alert("Vui lòng nhập đủ nội dung cho các lựa chọn");
				resources = {
					statement: tfStatement.trim(),
					options: tfOptions.map((opt) => ({ key: opt.key, label: opt.label.trim() })),
					correctOption: tfCorrect,
					explanation: tfExplanation.trim() || undefined,
				};
			} else if (type === "typing_challenge") {
				if (!typingTarget.trim()) return alert("Target text không được rỗng");
				const numericLimit = Number(typingTimeLimit);
				if (typingTimeLimit !== "" && (!Number.isFinite(numericLimit) || numericLimit <= 0)) {
					return alert("Thời gian phải là số dương");
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
				alert("Tạo minigame thất bại");
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
                <label className="form-label mb-0">Content (HTML)</label>

                {/* Nút chuyển chế độ */}
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? "Chỉnh sửa" : "Xem trước"}
                </button>
              </div>

              {/* Một vùng duy nhất, đổi giữa textarea và preview */}
              {!showPreview ? (
                <textarea
                  className="form-control"
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder=""
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

	const load = async () => {
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
	};

	useEffect(() => {
		if (!activityId) return;
		load();
	}, [activityId]);

	const openDetail = async (id) => {
		setDetailLoading(true);
		try {
			const resp = await api.get(`/minigames/${id}`);
			setSelected(resp.data);
		} catch (err) {
			console.error("Load minigame detail failed", err);
			alert("Không thể tải chi tiết minigame");
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
			alert("Lưu minigame thành công");
		} catch (err) {
			console.error("Save minigame failed", err);
			alert("Lưu minigame thất bại");
		}
	};

	// xóa từ modal
	const handleDeleteDetail = async (id) => {
		if (!window.confirm("Xác nhận xóa minigame?")) return;
		try {
			await api.delete(`/minigames/${id}`);
			closeDetail();
			await load();
			onRefresh && onRefresh();
			alert("Xóa thành công");
		} catch (err) {
			console.error("Delete minigame failed", err);
			alert("Xóa thất bại");
		}
	};

	// xóa trực tiếp từ danh sách (wrapper) — tránh lỗi khi gọi handleDelete trong rendering
	const handleDelete = async (id) => {
		if (!window.confirm("Xác nhận xóa minigame?")) return;
		try {
			await api.delete(`/minigames/${id}`);
			await load();
			onRefresh && onRefresh();
			alert("Xóa thành công");
		} catch (err) {
			console.error("Delete minigame failed", err);
			alert("Xóa thất bại");
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
