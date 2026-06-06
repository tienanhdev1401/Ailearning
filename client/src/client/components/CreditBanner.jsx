import React, { useState } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/CreditBanner.module.css";
import { BsRobot } from "react-icons/bs";
import { FiEdit3 } from "react-icons/fi";

/**
 * Compact credit pill that sits in the top-right corner.
 * Collapsible via an arrow toggle.
 *
 * @param {"AI_CONVERSATION" | "GRAMMAR_CHECKER"} props.type
 * @param {object|null} props.credits - Credit data from GET /users/me/credits
 * @param {boolean} [props.isDarkMode] - Explicit dark mode flag
 */
const CreditBanner = ({ type, credits, isDarkMode = false }) => {
  const [collapsed, setCollapsed] = useState(false);

  if (!credits) return null;

  const isAi = type === "AI_CONVERSATION";

  const remaining = isAi
    ? credits.aiConversationCredits ?? 0
    : credits.grammarCheckerCredits ?? 0;

  const total = isAi
    ? credits.totalAiConversationCredits ?? 0
    : credits.totalGrammarCheckerCredits ?? 0;

  const safeTotal = Math.max(total, 1);
  const percent = Math.min(100, (remaining / safeTotal) * 100);

  const isExhausted = remaining <= 0;

  const icon = isAi ? <BsRobot /> : <FiEdit3 />;

  const wrapperClass = [
    styles.wrapper,
    collapsed ? styles.collapsed : "",
    isDarkMode ? styles.dark : "",
  ]
    .filter(Boolean)
    .join(" ");

  const pillClass = [
    styles.pill,
    isExhausted ? styles.pillExhausted : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClass}>
      <button
        className={styles.toggleBtn}
        onClick={() => setCollapsed((prev) => !prev)}
        title={collapsed ? "Hiện credit" : "Ẩn credit"}
        aria-label={collapsed ? "Hiện credit" : "Ẩn credit"}
      >
        {collapsed ? "◀" : "▶"}
      </button>

      <div className={pillClass}>
        <span className={styles.pillIcon}>{icon}</span>

        <span className={styles.pillLabel}>Credits</span>

        <span className={styles.pillCount}>
          <strong>{remaining}</strong>
          <span className={styles.pillTotal}> / {total} lượt</span>
        </span>

        {isExhausted && (
          <Link to="/pricing" className={styles.upgradeChip}>
            Nâng cấp
          </Link>
        )}
      </div>
    </div>
  );
};

export default CreditBanner;
