import React, { useState, useEffect } from 'react';
import { diffWords } from 'diff';
import '../styles/GrammarCheckerPage.css';

const GrammarCheckerPage = () => {
  const [inputTexts, setInputTexts] = useState([""]);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(-1);
  const [darkMode, setDarkMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Load history from localStorage on component mount
  useEffect(() => {
    setHistory(loadHistoryFromStorage());
  }, []);

  // Save history to localStorage whenever history changes
  useEffect(() => {
    if (history.length > 0) {
      saveHistoryToStorage(history);
    }
  }, [history]);

  // Apply dark mode styles to the document body
  useEffect(() => {
    if (darkMode) {
      document.body.style.backgroundColor = '#1a202c';
    } else {
      document.body.style.backgroundColor = '#f8f9fa';
    }
    return () => {
      // Khi rời khỏi trang, reset lại màu nền về mặc định
      document.body.style.backgroundColor = '';
    };
  }, [darkMode]);

  const updateCounts = (text) => {
    const charCount = text.length;
    const words = text.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    return { charCount, wordCount };
  };

  const addNewInput = () => {
    setInputTexts(prev => [...prev, ""]);
  };

  const removeInput = (index) => {
    if (inputTexts.length > 1) {
      setInputTexts(prev => prev.filter((_, i) => i !== index));
      setResults(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateInputText = (index, value) => {
    setInputTexts(prev => {
      const newTexts = [...prev];
      newTexts[index] = value;
      return newTexts;
    });
  };

  const highlightErrors = (original, corrected) => {
    const diffs = diffWords(original, corrected);
    
    return diffs.map((part, index) => {
      if (part.removed) {
        return `<span class="highlight-error">${part.value}</span>`;
      } else if (!part.added) {
        return part.value;
      }
      return '';
    }).join('');
  };
  
  const highlightCorrections = (original, corrected) => {
    const diffs = diffWords(original, corrected);
    
    return diffs.map((part, index) => {
      if (part.added) {
        return `<span class="highlight-correction">${part.value}</span>`;
      } else if (!part.removed) {
        return part.value;
      }
      return '';
    }).join('');
  };

  const handleSubmit = async () => {
    const validTexts = inputTexts.filter(text => text.trim());
    if (validTexts.length === 0) return;

    setIsLoading(true);
    const newResults = [];
    
    try {
      for (let i = 0; i < inputTexts.length; i++) {
        const text = inputTexts[i];
        if (!text.trim()) {
          newResults.push(null);
          continue;
        }

        setLoadingIndex(i);
        
        const result = await checkGrammar(text);
        const resultData = createResultData(text, result);
        newResults.push(resultData);

        // Add to history
        const newHistoryItem = createHistoryItem(text, result, i);
        setHistory(prev => [newHistoryItem, ...prev.slice(0, 19)]);
      }

      setResults(newResults);
      setShowResults(true);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to check grammar. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingIndex(-1);
    }
  };

  const handleSingleSubmit = async (index) => {
    const text = inputTexts[index];
    if (!text.trim()) return;

    setLoadingIndex(index);
    
    try {
      const result = await checkGrammar(text);

      const resultData = {
        original: text,
        corrected: result,
        highlighted: highlightErrors(text, result),
        errorCount: countErrorsForTexts(text, result)
      };

      setResults(prev => {
        const newResults = [...prev];
        newResults[index] = resultData;
        return newResults;
      });

      if (!showResults) setShowResults(true);

      // Add to history
      const newHistoryItem = createHistoryItem(text, result);

      setHistory(prev => [newHistoryItem, ...prev.slice(0, 19)]);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to check grammar. Please try again.');
    } finally {
      setLoadingIndex(-1);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const resetForm = () => {
    setInputTexts([""]);
    setResults([]);
    setShowResults(false);
  };

  // API Request utility
  const checkGrammar = async (text) => {
    const response = await fetch('http://localhost:5001/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_message: `Please correct the following text for grammar and spelling errors: "${text}". Provide only the corrected text without any explanation.`,
        top_k: 40,
        top_p: 0.9,
        temperature: 0.1,
        repetition_penalty: 1.1,
      }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data.result;
  };

  // LocalStorage utilities
  const saveHistoryToStorage = (historyData) => {
    localStorage.setItem('grammarCheckerHistory', JSON.stringify(historyData));
  };

  const loadHistoryFromStorage = () => {
    const savedHistory = localStorage.getItem('grammarCheckerHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  };

  const clearHistoryFromStorage = () => {
    localStorage.removeItem('grammarCheckerHistory');
  };

  // Utility functions
  const createHistoryItem = (text, result, index = 0) => ({
    id: Date.now() + index,
    timestamp: new Date().toISOString(),
    originalText: text,
    correctedText: result,
    errorCount: countErrorsForTexts(text, result)
  });

  const createResultData = (text, result) => ({
    original: text,
    corrected: result,
    highlighted: highlightErrors(text, result),
    errorCount: countErrorsForTexts(text, result)
  });

  const countErrorsForTexts = (original, corrected) => {
    const diffs = diffWords(original, corrected);
    let errorCount = 0;
    let inChange = false;
  
    diffs.forEach(part => {
      if (part.added || part.removed) {
        if (!inChange) {
          errorCount++;
          inChange = true;
        }
      } else {
        inChange = false;
      }
    });
  
    return errorCount;
  };

  const loadFromHistory = (historyItem) => {
    setInputTexts([historyItem.originalText]);
    const resultData = createResultData(historyItem.originalText, historyItem.correctedText);
    setResults([resultData]);
    setShowResults(true);
    setShowHistory(false);
  };

  const clearHistory = () => {
    setHistory([]);
    clearHistoryFromStorage();
  };

  const deleteHistoryItem = (id) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };
  
  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      backgroundColor: darkMode ? '#1a202c' : '#f8f9fa',
      margin: 0,
      color: darkMode ? '#e2e8f0' : '#333',
      display: 'flex',
      justifyContent: 'center',
      padding: '20px 10px',
      minHeight: '100vh'
    }}>
      <div 
        className={`grammar-checker-container ${darkMode ? 'dark' : ''}`}
        aria-label="Grammar Checker Application"
      >
        <header className='grammar-checker-header'>
          <h1 className={`grammar-checker-title ${darkMode ? 'dark' : ''}`}>
             Grammar Checker AI
          </h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              aria-label="Toggle history"
              className={`btn-base history-toggle-button ${darkMode ? 'dark' : ''}`}
            >
              <span>📚</span> History
            </button>
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
              className={`btn-base dark-mode-toggle-button ${darkMode ? 'dark' : ''}`}
            >
              {darkMode ? (
                <>
                  <span>☀️</span> Light
                </>
              ) : (
                <>
                  <span>🌙</span> Dark
                </>
              )}
            </button>
          </div>
        </header>

        <section aria-labelledby="check-grammar-title">
          <h2 id="check-grammar-title"className={`check-grammar-title ${darkMode ? 'dark' : ''}`}>
             AI-Powered Grammar Correction
          </h2>
          <p className={`check-grammar-description ${darkMode ? 'dark' : ''}`}>
            Transform your writing with advanced AI technology. Simply paste your text and watch as our intelligent system identifies and corrects grammar mistakes in real-time.
          </p>
          
          <div className="multi-input-container">
            {inputTexts.map((text, index) => {
              const { charCount, wordCount } = updateCounts(text);
              const isProcessing = loadingIndex === index;
              
              return (
                <div key={index} className={`input-group ${darkMode ? 'dark' : ''}`}>
                  <div className="input-header">
                    <label className={`check-grammar-input-label ${darkMode ? 'dark' : ''}`}>
                      Text #{index + 1}
                      <span style={{ color: '#d33', marginLeft: '4px' }}>*</span>
                    </label>
                    <div className="input-actions">
                      {inputTexts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeInput(index)}
                          className={`btn-base remove-input-btn ${darkMode ? 'dark' : ''}`}
                          title="Remove this input"
                        >
                          🗑️
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSingleSubmit(index)}
                        disabled={!text.trim() || isProcessing}
                        className={`btn-base single-check-btn ${darkMode ? 'dark' : ''}`}
                        title="Check this text only"
                      >
                        {isProcessing ? (
                          <>
                            <div className="loading-spinner"></div>
                            Checking...
                          </>
                        ) : (
                          <>
                            ⚡ Quick Check
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <textarea 
                    name={`input-text-${index}`}
                    aria-required="true" 
                    aria-label={`Input text ${index + 1} that needs grammar checking`}
                    placeholder={`Enter your text here... (Text #${index + 1})`}
                    value={text}
                    onChange={(e) => updateInputText(index, e.target.value)}
                    disabled={isLoading}
                    className={`check-grammar-grammar-input ${darkMode ? 'dark' : ''}`}
                  />
                  
                  <div className="input-stats">
                    <span>Characters: {charCount}</span>
                    <span>Words: {wordCount}</span>
                    {results[index] && (
                      <span className={`error-count ${darkMode ? 'dark' : ''}`}>
                        Errors: {results[index].errorCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            
            <div className="bulk-actions">
              <button
                type="button"
                onClick={addNewInput}
                className={`btn-base add-input-btn ${darkMode ? 'dark' : ''}`}
                disabled={isLoading}
              >
                ➕ Add Another Text
              </button>
              
              <button 
                type="button" 
                onClick={handleSubmit}
                aria-label="Check All Grammar"
                disabled={isLoading || inputTexts.every(text => !text.trim())}
                className={`btn-base grammar-checker-submit-button ${darkMode ? 'dark' : ''}`}
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Analyzing All...
                  </>
                ) : (
                  <>
                    <span></span>
                    Check All Grammar
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {showResults && results.some(result => result) && (
          <>
            <section aria-live="polite" aria-atomic="true" aria-label="Results">
              <h3 className={`results-title ${darkMode ? 'dark' : ''}`}>
                 Grammar Check Results
              </h3>
              
              {results.map((result, index) => {
                if (!result) return null;
                
                return (
                  <div key={index} className={`result-item ${darkMode ? 'dark' : ''}`}>
                    <div className="result-header">
                      <h4>Result #{index + 1}</h4>
                      <div className="result-actions">
                        <span className={`error-badge ${darkMode ? 'dark' : ''}`}>
                          {result.errorCount} errors found
                        </span>
                        <button 
                          type="button" 
                          onClick={() => copyToClipboard(result.corrected)}
                          title="Copy corrected text to clipboard"
                          className={`grammar-checker-copy-button ${darkMode ? 'dark' : ''}`}>
                          📋 Copy
                        </button>
                      </div>
                    </div>
                    
                    <div className={`result-content ${darkMode ? 'dark' : ''}`}>
                      <div className={`corrected-text ${darkMode ? 'dark' : ''}`}>
                        <h5>Corrected Text:</h5>
                        <div 
                          className={darkMode ? 'dark' : ''}
                          dangerouslySetInnerHTML={{ __html: highlightCorrections(result.original, result.corrected) }} 
                        />
                      </div>
                      
                      <div className="comparison-section">
                        <div className="original-section">
                          <h5>Original:</h5>
                          <div 
                            className={`grammar-checker-original-text ${darkMode ? 'dark' : ''}`}
                            dangerouslySetInnerHTML={{ __html: result.highlighted }}
                          />
                        </div>
                        
                        <div className="corrected-section">
                          <h5>Corrected:</h5>
                          <div 
                            className={`grammar-checker-2-corrected-text ${darkMode ? 'dark' : ''}`}
                          >
                            <div 
                              className={darkMode ? 'dark' : ''}
                              dangerouslySetInnerHTML={{ __html: highlightCorrections(result.original, result.corrected) }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <div className="results-summary">
                <div className={`grammar-checker-error-analysis ${darkMode ? 'dark' : ''}`}>
                  Total Errors: <span style={{ fontWeight: '700', fontSize: '1.4rem', color: darkMode ? '#d6bcfa' : '#78350f' }}>
                    {results.reduce((total, result) => total + (result?.errorCount || 0), 0)}
                  </span>
                </div>
              </div>
            </section>

            <button 
              type="button" 
              onClick={resetForm}
              className={`btn-base grammar-checker-reset-button ${darkMode ? 'dark' : ''}`}
            >
               Start New Check
            </button>
          </>
        )}

        {/* History Sidebar */}
        {showHistory && (
          <div className={`history-sidebar ${darkMode ? 'dark' : ''}`}>
            <div className="history-header">
              <h3>📚 Check History</h3>
              <div className="history-actions">
                {history.length > 0 && (
                  <button 
                    onClick={clearHistory}
                    className={`clear-history-btn ${darkMode ? 'dark' : ''}`}
                    title="Clear all history"
                  >
                    🗑️ Clear All
                  </button>
                )}
                <button 
                  onClick={() => setShowHistory(false)}
                  className={`close-history-btn ${darkMode ? 'dark' : ''}`}
                  title="Close history"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="history-content">
              {history.length === 0 ? (
                <div className={`history-empty ${darkMode ? 'dark' : ''}`}>
                  <span>📝</span>
                  <p>No history yet</p>
                  <small>Your grammar checks will appear here</small>
                </div>
              ) : (
                <div className="history-list">
                  {history.map((item) => (
                    <div key={item.id} className={`history-item ${darkMode ? 'dark' : ''}`}>
                      <div className="history-item-header">
                        <span className="history-timestamp">
                          {new Date(item.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <div className="history-item-actions">
                          <span className={`error-badge ${darkMode ? 'dark' : ''}`}>
                            {item.errorCount} errors
                          </span>
                          <button
                            onClick={() => deleteHistoryItem(item.id)}
                            className={`delete-item-btn ${darkMode ? 'dark' : ''}`}
                            title="Delete this item"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div className="history-item-preview">
                        <p>{item.originalText.substring(0, 80)}...</p>
                      </div>
                      <button
                        onClick={() => loadFromHistory(item)}
                        className={`btn-base load-history-btn ${darkMode ? 'dark' : ''}`}
                      >
                        📄 Load This Check
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrammarCheckerPage;