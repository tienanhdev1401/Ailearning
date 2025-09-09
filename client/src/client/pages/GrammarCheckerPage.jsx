import React, { useState, useEffect } from 'react';
import { diffWords } from 'diff';
import styles from '../styles/GrammarCheckerPage.module.css';

const GrammarCheckerPage = () => {
  const [inputText, setInputText] = useState("");
  const [correctedText, setCorrectedText] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copyText, setCopyText] = useState("Copy");
  const [highlightedText, setHighlightedText] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  useEffect(() => {
    if (darkMode) document.body.style.backgroundColor = '#1a202c';
    else document.body.style.backgroundColor = '#f8f9fa';
    return () => { document.body.style.backgroundColor = ''; };
  }, [darkMode]);

  const updateCounts = () => {
    const charCount = inputText.length;
    const words = inputText.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    return { charCount, wordCount };
  };
  const { charCount, wordCount } = updateCounts();

  const highlightErrors = (original, corrected) => {
    const diffs = diffWords(original, corrected);
    return diffs.map((part) => {
      if (part.removed) {
        return `<span class="${styles["highlight-error"]}" style="text-decoration: line-through; color: ${darkMode ? '#ff7b7b' : 'red'};">${part.value}</span>`;
      } else if (!part.added) return part.value;
      return '';
    }).join('');
  };

  const highlightCorrections = (original, corrected) => {
    const diffs = diffWords(original, corrected);
    return diffs.map((part) => {
      if (part.added) {
        return `<span class="${styles["highlight-correction"]}" style="background-color: ${darkMode ? '#2d3748' : '#d4edda'}; color: ${darkMode ? '#a0aec0' : '#155724'}; padding: 2px 0; font-weight: bold;">${part.value}</span>`;
      } else if (!part.removed) return part.value;
      return '';
    }).join('');
  };

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5001/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText })
      });
      if (!response.ok) throw new Error('Failed to fetch from grammar correction API');
      const data = await response.json();
      const result = data.result;
      setCorrectedText(result);
      setHighlightedText(highlightErrors(inputText, result));
      setShowResults(true);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to check grammar. Please try again.');
    } finally { setIsLoading(false); }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(correctedText);
      setCopyText('Copied');
      setTimeout(() => setCopyText('Copy'), 2000);
    } catch (err) { console.error('Failed to copy:', err); }
  };

  const resetForm = () => {
    setInputText(''); setCorrectedText(''); setShowResults(false);
    setHighlightedText(''); setCopyText('Copy');
  };

  const countErrors = () => {
    const diffs = diffWords(inputText, correctedText);
    let errorCount = 0, inChange = false;
    diffs.forEach(part => {
      if (part.added || part.removed) {
        if (!inChange) { errorCount++; inChange = true; }
      } else { inChange = false; }
    });
    return errorCount;
  };
  const errorCount = showResults ? countErrors() : 0;

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      backgroundColor: darkMode ? '#1a202c' : '#f8f9fa',
      margin: 0,
      color: darkMode ? '#e2e8f0' : '#333',
      display: 'flex',
      justifyContent: 'center',
      padding: '40px 10px',
      minHeight: '100vh',
      flex: 1
    }}>
      <div className={`${styles["grammar-checker-container"]} ${darkMode ? styles.dark : ''}`} aria-label="Grammar Checker Application">
        <header className={styles["grammar-checker-header"]}>
          <h1 className={`${styles["grammar-checker-title"]} ${darkMode ? styles.dark : ''}`}>Grammar Checker</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={toggleDarkMode} aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`} className={`${styles["dark-mode-toggle-button"]} ${darkMode ? styles.dark : ''}`}>
              {darkMode ? <>☀️ Light</> : <>🌙 Dark</>}
            </button>
          </div>
        </header>

        <section aria-labelledby="check-grammar-title">
          <h2 id="check-grammar-title" className={`${styles["check-grammar-title"]} ${darkMode ? styles.dark : ''}`}>Check Your Grammar</h2>
          <p className={`${styles["check-grammar-description"]} ${darkMode ? styles.dark : ''}`}>
            Paste your text below and let our AI identify and correct grammar mistakes.
          </p>
          <div id="grammar-form" aria-describedby="helper-text">
            <label htmlFor="input-text" className={`${styles["check-grammar-input-label"]} ${darkMode ? styles.dark : ''}`}>
              Your Text<span style={{ color: '#d33', marginLeft: '4px' }} aria-hidden="true">*</span>
            </label>
            <textarea 
              id="input-text" 
              name="input-text" 
              aria-required="true" 
              aria-label="Input text that needs grammar checking"
              placeholder="Enter your text here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={showResults}
              className={`${styles["check-grammar-grammar-input"]} ${darkMode ? styles.dark : ''}`}
            />
            <p id="helper-text" style={{ fontSize: '0.8rem', color: darkMode ? '#a0aec0' : '#666', marginTop: '4px' }}>
              Character count: <span id="char-count">{charCount}</span> &nbsp; Words: <span id="word-count">{wordCount}</span>
            </p>
            <button 
              type="button" 
              onClick={handleSubmit}
              aria-label="Check Grammar"
              disabled={showResults || isLoading}
              className={`${styles["grammar-checker-submit-button"]} ${darkMode ? styles.dark : ''}`}
            >
              {isLoading ? 'Checking...' : 'Check Grammar'}
            </button>
          </div>
        </section>

        {showResults && (
          <>
            <section aria-live="polite" aria-atomic="true" aria-label="Corrected Text">
              <div className={`${styles["grammar-checker-corrected-text"]} ${darkMode ? styles.dark : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px'}}>
                  <button type="button" onClick={copyToClipboard} title="Copy corrected text to clipboard" className={`${styles["grammar-checker-copy-button"]} ${darkMode ? styles.dark : ''}`}>
                    {copyText}
                  </button>
                </div>
                <div dangerouslySetInnerHTML={{ __html: highlightCorrections(inputText, correctedText) }} />
              </div>
            </section>

            <section aria-label="Error Analysis">
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '35px'}}>
                <div className={`${styles["grammar-checker-error-analysis"]} ${darkMode ? styles.dark : ''}`}>
                  Total Errors: <span style={{ fontWeight: '700', fontSize: '1.4rem', color: darkMode ? '#d6bcfa' : '#78350f' }}>{errorCount}</span>
                </div>
              </div>
            </section>

            <section aria-label="Before and After Comparison">
              <div className={`${styles["grammar-checker-comparison-container"]} ${darkMode ? styles.dark : ''}`}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
                  <span style={{fontWeight: '700', fontSize: '1rem', userSelect: 'none', color: darkMode ? '#e2e8f0' : '#333'}}>Original Text</span>
                </div>
                <div className={`${styles["grammar-checker-original-text"]} ${darkMode ? styles.dark : ''}`} dangerouslySetInnerHTML={{ __html: highlightedText }} />
                <span style={{ display: 'block', fontWeight: '700', fontSize: '1rem', userSelect: 'none', paddingBottom: '15px', color: darkMode ? '#e2e8f0' : '#333'}}>Corrected Text</span>
                <div className={`${styles["grammar-checker-2-corrected-text"]} ${darkMode ? styles.dark : ''}`} dangerouslySetInnerHTML={{ __html: highlightCorrections(inputText, correctedText) }} />
              </div>
            </section>

            <button type="button" onClick={resetForm} className={`${styles["grammar-checker-reset-button"]} ${darkMode ? styles.dark : ''}`}>
              Check Another Text
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default GrammarCheckerPage;
