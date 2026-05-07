import React, { useCallback, useEffect, useMemo, useState } from "react";
import AiPromptService from "../services/aiPromptService";
import { useToast } from "../../context/ToastContext";

/* =========================================================
   Prompt Management — generic prompt registry for any AI feature
   ========================================================= */

const TABS = [
  { id: "prompts", label: "Prompt Templates", icon: "bi-braces" },
  { id: "guidance", label: "Scenario Guidance", icon: "bi-person-badge" },
];

const emptyPrompt = {
  feature: "ai_chat",
  key: "",
  name: "",
  description: "",
  template: "",
  variables: "",
  provider: "gemini",
  model: "",
  temperature: "",
  topP: "",
  maxOutputTokens: "",
  isActive: true,
};

const emptyGuidance = {
  scenarioKey: "",
  name: "",
  description: "",
  keywords: "",
  persona: "",
  tone: "",
  focus: "",
  opening: "",
  progression: "",
  closing: "",
  maxUserTurns: 6,
  fallbackOpening: "",
  fallbackFollowUps: "",
  isDefault: false,
};

const parseListInput = (raw) =>
  (raw ?? "")
    .split(/[,\n]/g)
    .map((s) => s.trim())
    .filter(Boolean);

const formatListInput = (value) => {
  if (!value) return "";
  if (Array.isArray(value)) return value.join(", ");
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.join(", ") : String(value);
  } catch {
    return String(value);
  }
};

const numericOrNull = (v) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const PromptManagementPage = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("prompts");

  // ---------------- Prompts state ----------------
  const [prompts, setPrompts] = useState([]);
  const [features, setFeatures] = useState([]);
  const [promptFilter, setPromptFilter] = useState({ feature: "", search: "" });
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptModal, setPromptModal] = useState({ open: false, mode: "add", id: null });
  const [promptForm, setPromptForm] = useState(emptyPrompt);
  const [previewVars, setPreviewVars] = useState("");
  const [previewOutput, setPreviewOutput] = useState("");

  // ---------------- Guidance state ----------------
  const [guidance, setGuidance] = useState([]);
  const [guidanceLoading, setGuidanceLoading] = useState(false);
  const [guidanceModal, setGuidanceModal] = useState({ open: false, mode: "add", id: null });
  const [guidanceForm, setGuidanceForm] = useState(emptyGuidance);

  // ---------------- Loaders ----------------
  const loadPrompts = useCallback(async () => {
    setPromptLoading(true);
    try {
      const params = {};
      if (promptFilter.feature) params.feature = promptFilter.feature;
      if (promptFilter.search) params.search = promptFilter.search;
      const [list, feats] = await Promise.all([
        AiPromptService.listPrompts(params),
        AiPromptService.listFeatures(),
      ]);
      setPrompts(list);
      setFeatures(feats);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không tải được danh sách prompt");
    } finally {
      setPromptLoading(false);
    }
  }, [promptFilter.feature, promptFilter.search, toast]);

  const loadGuidance = useCallback(async () => {
    setGuidanceLoading(true);
    try {
      const list = await AiPromptService.listGuidance();
      setGuidance(list);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không tải được scenario guidance");
    } finally {
      setGuidanceLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (activeTab === "prompts") loadPrompts();
    if (activeTab === "guidance") loadGuidance();
  }, [activeTab, loadPrompts, loadGuidance]);

  // ---------------- Prompt handlers ----------------
  const openAddPrompt = () => {
    setPromptForm(emptyPrompt);
    setPreviewVars("");
    setPreviewOutput("");
    setPromptModal({ open: true, mode: "add", id: null });
  };

  const openEditPrompt = async (item) => {
    try {
      const full = await AiPromptService.getPrompt(item.id);
      setPromptForm({
        feature: full.feature ?? "",
        key: full.key ?? "",
        name: full.name ?? "",
        description: full.description ?? "",
        template: full.template ?? "",
        variables: formatListInput(full.variables),
        provider: full.provider ?? "",
        model: full.model ?? "",
        temperature: full.temperature ?? "",
        topP: full.topP ?? "",
        maxOutputTokens: full.maxOutputTokens ?? "",
        isActive: !!full.isActive,
      });
      setPreviewVars("");
      setPreviewOutput("");
      setPromptModal({ open: true, mode: "edit", id: full.id });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không mở được prompt");
    }
  };

  const closePromptModal = () => setPromptModal({ open: false, mode: "add", id: null });

  const savePrompt = async () => {
    const payload = {
      feature: promptForm.feature.trim(),
      key: promptForm.key.trim(),
      name: promptForm.name.trim(),
      description: promptForm.description?.trim() || null,
      template: promptForm.template,
      variables: JSON.stringify(parseListInput(promptForm.variables)),
      provider: promptForm.provider?.trim() || null,
      model: promptForm.model?.trim() || null,
      temperature: numericOrNull(promptForm.temperature),
      topP: numericOrNull(promptForm.topP),
      maxOutputTokens: numericOrNull(promptForm.maxOutputTokens),
      isActive: !!promptForm.isActive,
    };
    if (!payload.feature || !payload.key || !payload.name || !payload.template) {
      toast.error("Vui lòng nhập đầy đủ feature, key, name và template");
      return;
    }
    try {
      if (promptModal.mode === "add") {
        await AiPromptService.createPrompt(payload);
        toast.success("Đã tạo prompt");
      } else {
        await AiPromptService.updatePrompt(promptModal.id, payload);
        toast.success("Đã cập nhật prompt");
      }
      closePromptModal();
      loadPrompts();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Lưu prompt thất bại");
    }
  };

  const deletePrompt = async (item) => {
    const ok = await toast.confirm(
      `Xoá prompt "${item.name}" (${item.feature}:${item.key})?`,
      { type: "danger", confirmText: "Xoá", cancelText: "Huỷ" }
    );
    if (!ok) return;
    try {
      await AiPromptService.deletePrompt(item.id);
      toast.success("Đã xoá prompt");
      loadPrompts();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Xoá thất bại");
    }
  };

  const runPreview = async () => {
    let vars = {};
    const raw = previewVars.trim();
    if (raw) {
      try {
        vars = JSON.parse(raw);
        if (typeof vars !== "object" || Array.isArray(vars)) {
          throw new Error("Variables must be a JSON object");
        }
      } catch (err) {
        toast.error("Variables phải là JSON object hợp lệ");
        return;
      }
    }
    try {
      const result = await AiPromptService.previewPrompt(promptForm.template, vars);
      setPreviewOutput(result.text);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Preview thất bại");
    }
  };

  const promptVariables = useMemo(() => parseListInput(promptForm.variables), [promptForm.variables]);

  // ---------------- Guidance handlers ----------------
  const openAddGuidance = () => {
    setGuidanceForm(emptyGuidance);
    setGuidanceModal({ open: true, mode: "add", id: null });
  };

  const openEditGuidance = (item) => {
    setGuidanceForm({
      scenarioKey: item.scenarioKey ?? "",
      name: item.name ?? "",
      description: item.description ?? "",
      keywords: (item.keywords ?? []).join(", "),
      persona: item.persona ?? "",
      tone: item.tone ?? "",
      focus: item.focus ?? "",
      opening: item.opening ?? "",
      progression: item.progression ?? "",
      closing: item.closing ?? "",
      maxUserTurns: item.maxUserTurns ?? 6,
      fallbackOpening: item.fallbackOpening ?? "",
      fallbackFollowUps: (item.fallbackFollowUps ?? []).join("\n"),
      isDefault: !!item.isDefault,
    });
    setGuidanceModal({ open: true, mode: "edit", id: item.id });
  };

  const closeGuidanceModal = () => setGuidanceModal({ open: false, mode: "add", id: null });

  const saveGuidance = async () => {
    const payload = {
      scenarioKey: guidanceForm.scenarioKey.trim(),
      name: guidanceForm.name.trim(),
      description: guidanceForm.description?.trim() || null,
      keywords: parseListInput(guidanceForm.keywords),
      persona: guidanceForm.persona,
      tone: guidanceForm.tone,
      focus: guidanceForm.focus,
      opening: guidanceForm.opening,
      progression: guidanceForm.progression,
      closing: guidanceForm.closing,
      maxUserTurns: Number(guidanceForm.maxUserTurns) || 6,
      fallbackOpening: guidanceForm.fallbackOpening?.trim() || null,
      fallbackFollowUps: parseListInput(guidanceForm.fallbackFollowUps),
      isDefault: !!guidanceForm.isDefault,
    };
    if (!payload.scenarioKey || !payload.name) {
      toast.error("Vui lòng nhập scenarioKey và name");
      return;
    }
    try {
      if (guidanceModal.mode === "add") {
        await AiPromptService.createGuidance(payload);
        toast.success("Đã tạo guidance");
      } else {
        await AiPromptService.updateGuidance(guidanceModal.id, payload);
        toast.success("Đã cập nhật guidance");
      }
      closeGuidanceModal();
      loadGuidance();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Lưu guidance thất bại");
    }
  };

  const deleteGuidance = async (item) => {
    if (item.isDefault) {
      toast.error("Không thể xoá guidance mặc định");
      return;
    }
    const ok = await toast.confirm(`Xoá scenario "${item.scenarioKey}"?`, {
      type: "danger",
      confirmText: "Xoá",
      cancelText: "Huỷ",
    });
    if (!ok) return;
    try {
      await AiPromptService.deleteGuidance(item.id);
      toast.success("Đã xoá");
      loadGuidance();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Xoá thất bại");
    }
  };

  // ---------------- Render ----------------
  return (
    <div className="prompt-management-page bg-body text-body min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="ms-5">
          <h4 className="mb-1">Quản lý Prompt AI</h4>
          <small className="text-muted">
            Quản lý prompt cho mọi tính năng AI sinh nội dung (Gemini, GPT, Claude, ...).
          </small>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs px-4 mb-3">
        {TABS.map((t) => (
          <li className="nav-item" key={t.id}>
            <button
              type="button"
              className={`nav-link ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              <i className={`bi ${t.icon} me-2`} />
              {t.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="px-4">
        {activeTab === "prompts" && (
          <PromptsTab
            prompts={prompts}
            features={features}
            loading={promptLoading}
            filter={promptFilter}
            setFilter={setPromptFilter}
            onAdd={openAddPrompt}
            onEdit={openEditPrompt}
            onDelete={deletePrompt}
            onRefresh={loadPrompts}
          />
        )}
        {activeTab === "guidance" && (
          <GuidanceTab
            items={guidance}
            loading={guidanceLoading}
            onAdd={openAddGuidance}
            onEdit={openEditGuidance}
            onDelete={deleteGuidance}
          />
        )}
      </div>

      {/* ---------------- Prompt Modal ---------------- */}
      {promptModal.open && (
        <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {promptModal.mode === "add" ? "Tạo Prompt" : "Cập nhật Prompt"}
                </h5>
                <button type="button" className="btn-close" onClick={closePromptModal} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Feature *</label>
                    <input
                      className="form-control"
                      placeholder="ai_chat, grammar_check, translator..."
                      value={promptForm.feature}
                      onChange={(e) => setPromptForm({ ...promptForm, feature: e.target.value })}
                      list="feature-suggestions"
                    />
                    <datalist id="feature-suggestions">
                      {features.map((f) => <option key={f} value={f} />)}
                    </datalist>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Key *</label>
                    <input
                      className="form-control"
                      placeholder="opening, followUp, evaluation, opening:job_interview..."
                      value={promptForm.key}
                      onChange={(e) => setPromptForm({ ...promptForm, key: e.target.value })}
                    />
                    <small className="text-muted">
                      Dùng <code>:scenarioKey</code> để override theo scenario, ví dụ <code>opening:job_interview</code>.
                    </small>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Tên hiển thị *</label>
                    <input
                      className="form-control"
                      value={promptForm.name}
                      onChange={(e) => setPromptForm({ ...promptForm, name: e.target.value })}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Mô tả</label>
                    <input
                      className="form-control"
                      value={promptForm.description}
                      onChange={(e) => setPromptForm({ ...promptForm, description: e.target.value })}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Template *</label>
                    <textarea
                      className="form-control font-monospace"
                      rows={10}
                      value={promptForm.template}
                      onChange={(e) => setPromptForm({ ...promptForm, template: e.target.value })}
                      placeholder="Hello {{name}}, please ..."
                    />
                    <small className="text-muted">
                      Sử dụng <code>{"{{variable}}"}</code> để chèn biến runtime.
                    </small>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Variables (cách nhau bởi dấu phẩy hoặc xuống dòng)</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={promptForm.variables}
                      onChange={(e) => setPromptForm({ ...promptForm, variables: e.target.value })}
                      placeholder="persona, tone, transcript"
                    />
                    {promptVariables.length > 0 && (
                      <div className="mt-2 d-flex flex-wrap gap-1">
                        {promptVariables.map((v) => (
                          <span key={v} className="badge bg-secondary">{v}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Provider</label>
                    <input
                      className="form-control"
                      list="provider-suggestions"
                      value={promptForm.provider}
                      onChange={(e) => setPromptForm({ ...promptForm, provider: e.target.value })}
                    />
                    <datalist id="provider-suggestions">
                      <option value="gemini" />
                      <option value="openai" />
                      <option value="claude" />
                    </datalist>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Model</label>
                    <input
                      className="form-control"
                      value={promptForm.model}
                      onChange={(e) => setPromptForm({ ...promptForm, model: e.target.value })}
                      placeholder="gemini-1.5-flash"
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Temperature</label>
                    <input
                      type="number"
                      step="0.05"
                      className="form-control"
                      value={promptForm.temperature ?? ""}
                      onChange={(e) => setPromptForm({ ...promptForm, temperature: e.target.value })}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">topP</label>
                    <input
                      type="number"
                      step="0.05"
                      className="form-control"
                      value={promptForm.topP ?? ""}
                      onChange={(e) => setPromptForm({ ...promptForm, topP: e.target.value })}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Max output tokens</label>
                    <input
                      type="number"
                      className="form-control"
                      value={promptForm.maxOutputTokens ?? ""}
                      onChange={(e) => setPromptForm({ ...promptForm, maxOutputTokens: e.target.value })}
                    />
                  </div>
                  <div className="col-md-3 d-flex align-items-end">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="prompt-active"
                        checked={promptForm.isActive}
                        onChange={(e) => setPromptForm({ ...promptForm, isActive: e.target.checked })}
                      />
                      <label className="form-check-label" htmlFor="prompt-active">Active</label>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="col-12">
                    <hr />
                    <h6 className="mb-2"><i className="bi bi-play-circle me-2" />Test render</h6>
                    <label className="form-label">Variables (JSON object)</label>
                    <textarea
                      className="form-control font-monospace"
                      rows={3}
                      value={previewVars}
                      onChange={(e) => setPreviewVars(e.target.value)}
                      placeholder='{"name": "Alice"}'
                    />
                    <button type="button" className="btn btn-sm btn-outline-primary mt-2" onClick={runPreview}>
                      Render preview
                    </button>
                    {previewOutput !== "" && (
                      <pre className="bg-body-secondary p-3 mt-2 rounded small" style={{ whiteSpace: "pre-wrap" }}>
                        {previewOutput}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closePromptModal}>Huỷ</button>
                <button className="btn btn-primary" onClick={savePrompt}>Lưu</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Guidance Modal ---------------- */}
      {guidanceModal.open && (
        <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {guidanceModal.mode === "add" ? "Tạo Scenario Guidance" : "Cập nhật Scenario Guidance"}
                </h5>
                <button type="button" className="btn-close" onClick={closeGuidanceModal} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Scenario key *</label>
                    <input
                      className="form-control"
                      value={guidanceForm.scenarioKey}
                      onChange={(e) => setGuidanceForm({ ...guidanceForm, scenarioKey: e.target.value })}
                      placeholder="job_interview, ask_directions..."
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Tên hiển thị *</label>
                    <input
                      className="form-control"
                      value={guidanceForm.name}
                      onChange={(e) => setGuidanceForm({ ...guidanceForm, name: e.target.value })}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Max user turns</label>
                    <input
                      type="number"
                      className="form-control"
                      value={guidanceForm.maxUserTurns}
                      onChange={(e) => setGuidanceForm({ ...guidanceForm, maxUserTurns: e.target.value })}
                    />
                  </div>
                  <div className="col-md-2 d-flex align-items-end">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="guidance-default"
                        checked={guidanceForm.isDefault}
                        onChange={(e) => setGuidanceForm({ ...guidanceForm, isDefault: e.target.checked })}
                      />
                      <label className="form-check-label" htmlFor="guidance-default">Default</label>
                    </div>
                  </div>

                  <div className="col-12">
                    <label className="form-label">Mô tả</label>
                    <input
                      className="form-control"
                      value={guidanceForm.description}
                      onChange={(e) => setGuidanceForm({ ...guidanceForm, description: e.target.value })}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Keywords (cách nhau bởi dấu phẩy)</label>
                    <input
                      className="form-control"
                      value={guidanceForm.keywords}
                      onChange={(e) => setGuidanceForm({ ...guidanceForm, keywords: e.target.value })}
                      placeholder="interview, hiring, recruiter"
                    />
                    <small className="text-muted">
                      Hệ thống sẽ tự suy ra scenarioKey từ tiêu đề/prompt nếu khớp keyword.
                    </small>
                  </div>

                  {[
                    ["persona", "Persona — vai trò AI"],
                    ["tone", "Tone — giọng điệu"],
                    ["focus", "Focus — trọng tâm hội thoại"],
                    ["opening", "Opening objective — mục tiêu mở màn"],
                    ["progression", "Progression — cách dẫn dắt giữa cuộc"],
                    ["closing", "Closing — cách đóng cuộc"],
                  ].map(([field, label]) => (
                    <div className="col-12" key={field}>
                      <label className="form-label">{label}</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={guidanceForm[field]}
                        onChange={(e) => setGuidanceForm({ ...guidanceForm, [field]: e.target.value })}
                      />
                    </div>
                  ))}

                  <div className="col-12">
                    <label className="form-label">Fallback opening (khi Gemini lỗi)</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={guidanceForm.fallbackOpening}
                      onChange={(e) => setGuidanceForm({ ...guidanceForm, fallbackOpening: e.target.value })}
                      placeholder="Hỗ trợ {{contextSentence}} placeholder."
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Fallback follow-ups (mỗi dòng 1 câu)</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={guidanceForm.fallbackFollowUps}
                      onChange={(e) => setGuidanceForm({ ...guidanceForm, fallbackFollowUps: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeGuidanceModal}>Huỷ</button>
                <button className="btn btn-primary" onClick={saveGuidance}>Lưu</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------------- Sub-components ---------------- */

const PromptsTab = ({ prompts, features, loading, filter, setFilter, onAdd, onEdit, onDelete, onRefresh }) => (
  <>
    <div className="card mb-3 bg-body border-0 shadow-sm">
      <div className="card-body">
        <div className="row g-2 align-items-center">
          <div className="col-md-3">
            <select
              className="form-select"
              value={filter.feature}
              onChange={(e) => setFilter({ ...filter, feature: e.target.value })}
            >
              <option value="">Tất cả feature</option>
              {features.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div className="col-md-5">
            <input
              className="form-control"
              placeholder="Tìm theo key, tên hoặc mô tả"
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            />
          </div>
          <div className="col-md-4 d-flex justify-content-end gap-2">
            <button className="btn btn-outline-secondary" onClick={onRefresh}>
              <i className="bi bi-arrow-clockwise" />
            </button>
            <button className="btn btn-primary" onClick={onAdd}>
              <i className="bi bi-plus-lg me-1" /> Tạo prompt
            </button>
          </div>
        </div>
      </div>
    </div>

    <div className="card bg-body shadow-sm">
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle prompt-table">
            <thead className="table">
              <tr>
                <th style={{ width: 140 }}>Feature</th>
                <th style={{ width: 220 }}>Key</th>
                <th>Tên</th>
                <th style={{ width: 110 }}>Provider / Model</th>
                <th style={{ width: 90 }}>Active</th>
                <th style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="text-center py-4">Đang tải...</td></tr>
              )}
              {!loading && prompts.length === 0 && (
                <tr><td colSpan={6} className="text-center py-4 text-muted">Chưa có prompt</td></tr>
              )}
              {!loading && prompts.map((p) => (
                <tr key={p.id}>
                  <td><span className="badge bg-info-subtle text-info-emphasis">{p.feature}</span></td>
                  <td><code>{p.key}</code></td>
                  <td>
                    <div className="fw-semibold">{p.name}</div>
                    {p.description && <small className="text-muted">{p.description}</small>}
                  </td>
                  <td>
                    <small>{p.provider || "—"}</small>
                    {p.model && <div><small className="text-muted">{p.model}</small></div>}
                  </td>
                  <td>
                    {p.isActive
                      ? <span className="badge bg-success-subtle text-success-emphasis">Active</span>
                      : <span className="badge bg-secondary-subtle text-secondary-emphasis">Off</span>}
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => onEdit(p)}>
                      <i className="bi bi-pencil" />
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(p)}>
                      <i className="bi bi-trash" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </>
);

const GuidanceTab = ({ items, loading, onAdd, onEdit, onDelete }) => (
  <>
    <div className="d-flex justify-content-between align-items-center mb-3">
      <small className="text-muted">
        Cấu hình "vai diễn" của AI cho từng tình huống chat. Một bản ghi được đánh dấu <strong>Default</strong> sẽ là fallback chung.
      </small>
      <button className="btn btn-primary" onClick={onAdd}>
        <i className="bi bi-plus-lg me-1" /> Tạo scenario
      </button>
    </div>

    <div className="row g-3">
      {loading && (
        <div className="col-12 text-center text-muted py-4">Đang tải...</div>
      )}
      {!loading && items.length === 0 && (
        <div className="col-12 text-center text-muted py-4">Chưa có scenario guidance</div>
      )}
      {!loading && items.map((g) => (
        <div className="col-md-6 col-xl-4" key={g.id}>
          <div className="card h-100 shadow-sm">
            <div className="card-body d-flex flex-column">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h6 className="mb-1">{g.name}</h6>
                  <code className="small text-muted">{g.scenarioKey}</code>
                </div>
                {g.isDefault && (
                  <span className="badge bg-warning-subtle text-warning-emphasis">Default</span>
                )}
              </div>
              <small className="text-muted text-truncate-2 mb-2" style={{
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
                overflow: "hidden",
              }}>
                {g.persona}
              </small>
              {g.keywords?.length > 0 && (
                <div className="mb-2 d-flex flex-wrap gap-1">
                  {g.keywords.slice(0, 6).map((k) => (
                    <span key={k} className="badge bg-light text-dark border">{k}</span>
                  ))}
                </div>
              )}
              <div className="small text-muted mb-3">
                <i className="bi bi-arrow-repeat me-1" /> Max turns: {g.maxUserTurns}
              </div>
              <div className="mt-auto d-flex gap-2">
                <button className="btn btn-sm btn-outline-primary flex-fill" onClick={() => onEdit(g)}>
                  <i className="bi bi-pencil me-1" /> Sửa
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onDelete(g)}
                  disabled={g.isDefault}
                >
                  <i className="bi bi-trash" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </>
);

export default PromptManagementPage;
