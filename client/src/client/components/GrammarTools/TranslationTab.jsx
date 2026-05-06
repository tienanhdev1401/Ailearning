import React, { useState, useEffect, useContext } from 'react';
import api from '../../../api/api';
import { ThemeContext } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import styles from '../../styles/GrammarCheckerPage.module.css';

const LANGUAGES = [
  { code: 'eng_Latn', label: 'English' },
  { code: 'vie_Latn', label: 'Tiếng Việt' },
];

const HISTORY_KEY = 'translationHistory';
const MAX_HISTORY = 20;

const TranslationTab = ({ showHistory = false, onCloseHistory }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const toast = useToast();

  const [srcLang, setSrcLang] = useState('eng_Latn');
  const [tgtLang, setTgtLang] = useState('vie_Latn');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch { /* noop */ }
    }
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  }, [history]);

  const swapLanguages = () => {
    setSrcLang(tgtLang);
    setTgtLang(srcLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const handleTranslate = async () => {
    const text = sourceText.trim();
    if (!text) return;
    if (srcLang === tgtLang) {
      toast.error('Ngôn ngữ nguồn và đích đang giống nhau.');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.post('/translation/translate', {
        text,
        src_lang: srcLang,
        tgt_lang: tgtLang,
        num_beams: 5,
      });
      const result = data?.result ?? '';
      setTranslatedText(result);

      const newItem = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        srcLang,
        tgtLang,
        sourceText: text,
        translatedText: result,
      };
      setHistory(prev => [newItem, ...prev.slice(0, MAX_HISTORY - 1)]);
    } catch (err) {
      console.error('Translation error:', err);
      const status = err?.response?.status;
      if (status === 503) {
        toast.error('Dịch vụ dịch chưa sẵn sàng. Hãy đảm bảo translation service đang chạy.');
      } else {
        toast.error('Dịch thất bại. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success?.('Đã sao chép.');
    } catch (e) {
      console.error(e);
    }
  };

  const clearAll = () => {
    setSourceText('');
    setTranslatedText('');
  };

  const loadFromHistory = (item) => {
    setSrcLang(item.srcLang);
    setTgtLang(item.tgtLang);
    setSourceText(item.sourceText);
    setTranslatedText(item.translatedText);
    onCloseHistory?.();
  };

  const deleteHistoryItem = (id) => {
    setHistory(prev => {
      const next = prev.filter(x => x.id !== id);
      if (next.length === 0) localStorage.removeItem(HISTORY_KEY);
      return next;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  const sourceCount = sourceText.length;
  const sourceWords = sourceText.trim().split(/\s+/).filter(Boolean).length;

  return (
    <section aria-labelledby="translation-title">
      <h2
        id="translation-title"
        className={`${styles['check-grammar-title']} ${isDarkMode ? styles.dark : ''}`}
      >
        AI Translation
      </h2>
      {/* Language switch bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          margin: '16px 0 20px',
          flexWrap: 'wrap',
        }}
      >
        <select
          value={srcLang}
          onChange={(e) => setSrcLang(e.target.value)}
          disabled={isLoading}
          style={selectStyle(isDarkMode)}
        >
          {LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={swapLanguages}
          disabled={isLoading}
          title="Đảo ngôn ngữ"
          className={`${styles['btn-base']} ${styles['history-toggle-button']} ${isDarkMode ? styles.dark : ''}`}
          style={{ padding: '8px 14px' }}
        >
          ⇄
        </button>

        <select
          value={tgtLang}
          onChange={(e) => setTgtLang(e.target.value)}
          disabled={isLoading}
          style={selectStyle(isDarkMode)}
        >
          {LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
      </div>

      {/* Two columns */}
      <div className={styles['multi-input-container']}>
        <div className={`${styles['input-group']} ${isDarkMode ? styles.dark : ''}`}>
          <div className={styles['input-header']}>
            <label className={`${styles['check-grammar-input-label']} ${isDarkMode ? styles.dark : ''}`}>
              Nguồn ({LANGUAGES.find(l => l.code === srcLang)?.label})
            </label>
            <div className={styles['input-actions']}>
              {sourceText && (
                <button
                  type="button"
                  onClick={() => setSourceText('')}
                  className={`${styles['btn-base']} ${styles['remove-input-btn']} ${isDarkMode ? styles.dark : ''}`}
                  title="Xoá"
                >
                  🗑️
                </button>
              )}
              <button
                type="button"
                onClick={() => copyToClipboard(sourceText)}
                className={`${styles['grammar-checker-copy-button']} ${isDarkMode ? styles.dark : ''}`}
                title="Copy"
              >
                📋 Copy
              </button>
            </div>
          </div>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Nhập văn bản cần dịch..."
            disabled={isLoading}
            className={`${styles['check-grammar-grammar-input']} ${isDarkMode ? styles.dark : ''}`}
          />
          <div className={styles['input-stats']}>
            <span>Characters: {sourceCount}</span>
            <span>Words: {sourceWords}</span>
          </div>
        </div>

        <div className={`${styles['input-group']} ${isDarkMode ? styles.dark : ''}`}>
          <div className={styles['input-header']}>
            <label className={`${styles['check-grammar-input-label']} ${isDarkMode ? styles.dark : ''}`}>
              Đích ({LANGUAGES.find(l => l.code === tgtLang)?.label})
            </label>
            <div className={styles['input-actions']}>
              <button
                type="button"
                onClick={() => copyToClipboard(translatedText)}
                disabled={!translatedText}
                className={`${styles['grammar-checker-copy-button']} ${isDarkMode ? styles.dark : ''}`}
                title="Copy"
              >
                📋 Copy
              </button>
            </div>
          </div>
          <textarea
            value={translatedText}
            readOnly
            placeholder={isLoading ? 'Đang dịch...' : 'Bản dịch sẽ hiển thị ở đây.'}
            className={`${styles['check-grammar-grammar-input']} ${isDarkMode ? styles.dark : ''}`}
          />
          <div className={styles['input-stats']}>
            <span>Characters: {translatedText.length}</span>
            <span>Words: {translatedText.trim().split(/\s+/).filter(Boolean).length}</span>
          </div>
        </div>

        <div className={styles['bulk-actions']}>
          <button
            type="button"
            onClick={clearAll}
            disabled={isLoading || (!sourceText && !translatedText)}
            className={`${styles['btn-base']} ${styles['add-input-btn']} ${isDarkMode ? styles.dark : ''}`}
          >
            🧹 Xoá hết
          </button>
          <button
            type="button"
            onClick={handleTranslate}
            disabled={isLoading || !sourceText.trim()}
            className={`${styles['btn-base']} ${styles['grammar-checker-submit-button']} ${isDarkMode ? styles.dark : ''}`}
          >
            {isLoading ? (
              <>
                <div className={styles['loading-spinner']}></div>
                Đang dịch...
              </>
            ) : (
              <>🌐 Dịch</>
            )}
          </button>
        </div>
      </div>

      {showHistory && (
        <div className={`${styles['history-sidebar']} ${isDarkMode ? styles.dark : ''}`}>
          <div className={styles['history-header']}>
            <h3>📚 Translation History</h3>
            <div className={styles['history-actions']}>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className={`${styles['clear-history-btn']} ${isDarkMode ? styles.dark : ''}`}
                  title="Clear all history"
                >
                  🗑️ Clear All
                </button>
              )}
              <button
                onClick={() => onCloseHistory?.()}
                className={`${styles['close-history-btn']} ${isDarkMode ? styles.dark : ''}`}
                title="Close history"
              >
                ✕
              </button>
            </div>
          </div>
          <div className={styles['history-content']}>
            {history.length === 0 ? (
              <div className={`${styles['history-empty']} ${isDarkMode ? styles.dark : ''}`}>
                <span>📝</span>
                <p>Chưa có lịch sử</p>
                <small>Các bản dịch của bạn sẽ xuất hiện ở đây</small>
              </div>
            ) : (
              <div className={styles['history-list']}>
                {history.map(item => (
                  <div key={item.id} className={`${styles['history-item']} ${isDarkMode ? styles.dark : ''}`}>
                    <div className={styles['history-item-header']}>
                      <span className={styles['history-timestamp']}>
                        {new Date(item.timestamp).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                      <div className={styles['history-item-actions']}>
                        <span className={`${styles['error-badge']} ${isDarkMode ? styles.dark : ''}`}>
                          {LANGUAGES.find(l => l.code === item.srcLang)?.label}
                          {' → '}
                          {LANGUAGES.find(l => l.code === item.tgtLang)?.label}
                        </span>
                        <button
                          onClick={() => deleteHistoryItem(item.id)}
                          className={`${styles['delete-item-btn']} ${isDarkMode ? styles.dark : ''}`}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className={styles['history-item-preview']}>
                      <p>{item.sourceText.substring(0, 80)}{item.sourceText.length > 80 ? '...' : ''}</p>
                    </div>
                    <button
                      onClick={() => loadFromHistory(item)}
                      className={`${styles['btn-base']} ${styles['load-history-btn']} ${isDarkMode ? styles.dark : ''}`}
                    >
                      📄 Mở lại bản dịch
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

const selectStyle = (isDarkMode) => ({
  padding: '10px 16px',
  borderRadius: 12,
  border: isDarkMode ? '1px solid #4a5568' : '1px solid #cbd5e0',
  background: isDarkMode ? '#2d3748' : '#fff',
  color: isDarkMode ? '#e2e8f0' : '#1a202c',
  fontWeight: 600,
  fontSize: '0.95rem',
  cursor: 'pointer',
  minWidth: 160,
  outline: 'none',
});

export default TranslationTab;
