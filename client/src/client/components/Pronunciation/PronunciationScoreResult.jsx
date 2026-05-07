import React, { useMemo, useState } from "react";
import styles from "../../styles/PronunciationScoreResult.module.css";

/**
 * Pronunciation scoring result panel.
 *
 * Props:
 * - result: API response object (v2) – see gop.controller.ts ScoreResponseV2
 * - onPlayRecording: () => void
 * - onRecord: () => void
 * - hasRecording: boolean
 * - isRecording: boolean
 * - sending: boolean
 */

// Color palette for score bands.
const BAND_COLORS = {
  good: { bg: "rgba(25,135,84,0.12)", border: "#198754", text: "#198754", solid: "#198754" },
  medium: { bg: "rgba(255,193,7,0.15)", border: "#f0a800", text: "#a87600", solid: "#f0a800" },
  weak: { bg: "rgba(220,53,69,0.12)", border: "#dc3545", text: "#dc3545", solid: "#dc3545" },
};

const overallTone = (score100) => {
  if (score100 >= 90) return { label: "Excellent", ...BAND_COLORS.good };
  if (score100 >= 75) return { label: "Good", bg: "rgba(13,110,253,0.12)", border: "#0d6efd", text: "#0d6efd", solid: "#0d6efd" };
  if (score100 >= 55) return { label: "Fair", ...BAND_COLORS.medium };
  return { label: "Needs work", ...BAND_COLORS.weak };
};

const bandColor = (band) => BAND_COLORS[band] || BAND_COLORS.medium;

// Convert clipped 0-2 score to 0-100 percent.
const norm0_2_to_100 = (v) => {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return Math.max(0, Math.min(100, (v / 2) * 100));
};

const formatDuration = (sec) => {
  if (typeof sec !== "number" || !Number.isFinite(sec)) return "—";
  return `${sec.toFixed(2)}s`;
};

export default function PronunciationScoreResult({
  result,
  onPlayRecording,
  onRecord,
  hasRecording,
  isRecording,
  sending,
}) {
  const [activeWordIdx, setActiveWordIdx] = useState(0);
  const [activePhoneIdx, setActivePhoneIdx] = useState(null);

  const summary = result?.summary;
  const words = useMemo(() => (Array.isArray(result?.words) ? result.words : []), [result]);
  const phones = useMemo(() => (Array.isArray(result?.phones) ? result.phones : []), [result]);
  const metricsNorm = result?.metrics?.scores_normalized || {};

  const overallScore = Math.round(summary?.overall_score_0_100 ?? 0);
  const tone = overallTone(overallScore);

  // Metric breakdown (utt_* values are on 0-2 scale, convert to 0-100).
  const metricItems = [
    { key: "utt_accuracy", label: "Accuracy", desc: "Phát âm chính xác" },
    { key: "utt_fluency", label: "Fluency", desc: "Trôi chảy" },
    { key: "utt_prosodic", label: "Prosody", desc: "Ngữ điệu / nhấn nhá" },
    { key: "utt_completeness", label: "Completeness", desc: "Đọc đầy đủ" },
  ].map((m) => ({
    ...m,
    value: norm0_2_to_100(metricsNorm[m.key]),
  }));

  const activeWord = words[activeWordIdx];

  // Phone timeline data (from top-level phones, has timing info).
  const totalDuration = phones.reduce((s, p) => s + (p.duration_ms || 0), 0);

  // Weak phones across the utterance.
  const weakPhones = phones.filter((p) => p.band === "weak" && p.phone);

  if (!result) return null;

  return (
    <div className={styles.wrapper}>
      {/* HEADER: big score + label + sentence */}
      <div className={styles.headerRow}>
        <div className={styles.scoreCircleWrap}>
          <svg viewBox="0 0 120 120" className={styles.scoreSvg}>
            <circle cx="60" cy="60" r="52" className={styles.scoreTrack} />
            <circle
              cx="60"
              cy="60"
              r="52"
              className={styles.scoreProgress}
              stroke={tone.solid}
              strokeDasharray={2 * Math.PI * 52}
              strokeDashoffset={2 * Math.PI * 52 * (1 - overallScore / 100)}
            />
          </svg>
          <div className={styles.scoreCenter}>
            <div className={styles.scoreNumber} style={{ color: tone.text }}>
              {overallScore}
            </div>
            <div className={styles.scoreOutOf}>/ 100</div>
          </div>
        </div>

        <div className={styles.headerText}>
          <div
            className={styles.labelBadge}
            style={{ backgroundColor: tone.bg, color: tone.text, border: `1px solid ${tone.border}` }}
          >
            <i className="bi bi-stars"></i>
            {tone.label}
            {summary?.all_words_good && (
              <span className="ms-1">· Tất cả từ phát âm tốt 🎉</span>
            )}
          </div>

          <div className={styles.sentenceText}>
            {words.map((w, i) => {
              const c = bandColor(w.band);
              return (
                <span
                  key={i}
                  className={`${styles.word} ${i === activeWordIdx ? styles.wordActive : ""}`}
                  style={{ color: c.text }}
                  onClick={() => setActiveWordIdx(i)}
                >
                  {w.word}
                </span>
              );
            })}
          </div>

          <div className={styles.statsRow}>
            <span>
              <strong>{summary?.word_count ?? words.length}</strong> từ
            </span>
            <span>
              <strong>{summary?.phone_count ?? phones.length}</strong> âm
            </span>
            <span>
              Thời lượng <strong>{formatDuration(result?.metrics?.audio_duration_sec)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* METRICS BREAKDOWN */}
      <div className={styles.metricsGrid}>
        {metricItems.map((m) => {
          const pct = m.value === null ? 0 : Math.round(m.value);
          const mTone = overallTone(pct);
          return (
            <div key={m.key} className={styles.metricRow}>
              <div className={styles.metricHead}>
                <span>
                  <strong>{m.label}</strong>{" "}
                  <span className="text-muted" style={{ fontSize: "0.72rem" }}>
                    {m.desc}
                  </span>
                </span>
                <span style={{ color: mTone.text, fontWeight: 700 }}>
                  {m.value === null ? "—" : `${pct}`}
                </span>
              </div>
              <div className={styles.metricBar}>
                <div
                  className={styles.metricFill}
                  style={{ width: `${pct}%`, background: mTone.solid }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* WORD CHIPS */}
      {words.length > 0 && (
        <>
          <div className={styles.sectionTitle}>
            <i className="bi bi-grid-3x3-gap"></i> Theo từng từ
          </div>
          <div className={styles.wordChips}>
            {words.map((w, i) => {
              const c = bandColor(w.band);
              return (
                <button
                  key={i}
                  type="button"
                  className={`${styles.wordChip} ${i === activeWordIdx ? styles.wordChipActive : ""}`}
                  style={{ borderColor: c.border, color: c.text, background: c.bg }}
                  onClick={() => {
                    setActiveWordIdx(i);
                    setActivePhoneIdx(null);
                  }}
                >
                  <span>{w.word}</span>
                  <span className={styles.wordChipScore} style={{ color: c.text }}>
                    {Math.round(w.score_0_100)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected word detail */}
          {activeWord && (
            <div className={styles.wordDetail}>
              <div className={styles.ipaRow}>
                <span className={styles.ipaLabel}>
                  <i className="bi bi-bullseye me-1"></i>Mục tiêu
                </span>
                <span className={styles.ipaValue}>
                  /{activeWord.target_ipa || "—"}/
                </span>
              </div>
              <div className={styles.ipaRow}>
                <span className={styles.ipaLabel}>
                  <i className="bi bi-mic me-1"></i>Của bạn
                </span>
                {activeWord.predicted_ipa ? (
                  <span className={styles.ipaValue} style={{ color: bandColor(activeWord.band).text }}>
                    /{activeWord.predicted_ipa}/
                  </span>
                ) : (
                  <span className={`${styles.ipaValue} ${styles.ipaValueMuted}`}>
                    Khớp với mục tiêu
                  </span>
                )}
              </div>

              {activeWord.phones?.length > 0 && (
                <>
                  <div style={{ fontSize: "0.78rem", color: "var(--bs-secondary-color)", marginTop: 8, marginBottom: 4 }}>
                    Từng âm:
                  </div>
                  <div className={styles.phoneTimeline}>
                    {activeWord.phones.map((p, pi) => {
                      const c = bandColor(p.band);
                      const w = activeWord.phones.length > 0
                        ? Math.max(8, (p.duration_ms || 50))
                        : 50;
                      return (
                        <div
                          key={pi}
                          className={styles.phoneCell}
                          style={{
                            flex: `${w} 0 0`,
                            background: c.solid,
                          }}
                          title={`${p.phone} · ${p.duration_ms}ms · ${Math.round(p.score_0_100 ?? 0)}/100`}
                        >
                          {p.phone}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* FULL PHONE TIMELINE */}
      {phones.length > 0 && totalDuration > 0 && (
        <>
          <div className={styles.sectionTitle}>
            <i className="bi bi-soundwave"></i> Dòng thời gian âm vị
          </div>
          <div className={styles.phoneTimeline}>
            {phones.map((p, i) => {
              const c = bandColor(p.band);
              return (
                <div
                  key={i}
                  className={`${styles.phoneCell} ${i === activePhoneIdx ? styles.phoneCellActive : ""}`}
                  style={{
                    flex: `${Math.max(p.duration_ms || 1, 1)} 0 0`,
                    background: c.solid,
                  }}
                  onClick={() => setActivePhoneIdx(i === activePhoneIdx ? null : i)}
                  title={`${p.phone} · ${p.duration_ms}ms · ${Math.round(p.score_0_100 ?? 0)}/100`}
                >
                  {p.phone}
                </div>
              );
            })}
          </div>
          <div className={styles.legend}>
            <span>
              <span className={styles.legendDot} style={{ background: BAND_COLORS.good.solid }} />
              Tốt (≥ 80)
            </span>
            <span>
              <span className={styles.legendDot} style={{ background: BAND_COLORS.medium.solid }} />
              Trung bình
            </span>
            <span>
              <span className={styles.legendDot} style={{ background: BAND_COLORS.weak.solid }} />
              Yếu (&lt; 50)
            </span>
          </div>
          {activePhoneIdx !== null && phones[activePhoneIdx] && (
            <div className={styles.phoneTooltip}>
              <strong>/{phones[activePhoneIdx].phone}/</strong>
              {" · "}
              {phones[activePhoneIdx].start_ms}ms → {phones[activePhoneIdx].end_ms}ms
              {" · điểm "}
              <strong style={{ color: bandColor(phones[activePhoneIdx].band).text }}>
                {Math.round(phones[activePhoneIdx].score_0_100 ?? 0)}/100
              </strong>
            </div>
          )}

          {weakPhones.length > 0 && (
            <>
              <div className={styles.sectionTitle}>
                <i className="bi bi-lightbulb"></i> Cần luyện thêm
              </div>
              <div className={styles.weakPhones}>
                {weakPhones.map((p, i) => (
                  <span key={i} className={styles.weakPhoneTag}>
                    /{p.phone}/ · {Math.round(p.score_0_100 ?? 0)}
                  </span>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ACTIONS */}
      <div className={styles.actionsRow}>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={onPlayRecording}
          disabled={!hasRecording}
        >
          <i className="bi bi-play-circle me-2"></i>
          Phát lại ghi âm
        </button>
        <button
          type="button"
          className={`btn ${isRecording ? "btn-danger" : "btn-primary"} btn-sm`}
          onClick={onRecord}
          disabled={sending}
        >
          <i className={`bi ${isRecording ? "bi-stop-fill" : "bi-mic-fill"} me-2`}></i>
          {sending ? "Đang chấm..." : isRecording ? "Dừng & Gửi" : "Ghi âm lại"}
        </button>
      </div>
    </div>
  );
}
