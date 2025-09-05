import React, { useState, useEffect } from 'react';
import { diffWords } from 'diff';
import '../styles/GrammarCheckerPage.css';

const GrammarCheckerPage = () => {
  const [inputText, setInputText] = useState("");
  const [correctedText, setCorrectedText] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copyText, setCopyText] = useState("Copy");
  const [highlightedText, setHighlightedText] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

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

  const updateCounts = () => {
    const charCount = inputText.length;
    const words = inputText.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    return { charCount, wordCount };
  };

  const { charCount, wordCount } = updateCounts();

  const highlightErrors = (original, corrected) => {
    const diffs = diffWords(original, corrected);
    
    return diffs.map((part, index) => {
      if (part.removed) {
        return `<span class="highlight-error" style="text-decoration: line-through; color: ${darkMode ? '#ff7b7b' : 'red'};">${part.value}</span>`;
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
        return `<span class="highlight-correction" style="background-color: ${darkMode ? '#2d3748' : '#d4edda'}; color: ${darkMode ? '#a0aec0' : '#155724'}; padding: 2px 0; font-weight: bold;">${part.value}</span>`;
      } else if (!part.removed) {
        return part.value;
      }
      return '';
    }).join('');
  };

  const handleSubmit = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    
    try {
      // setCorrectedText("I went to the park yesterday with my friend. We played football for one about two hours.The weather was very nice and sunny. There were many people walking their dogs. I saw a man who was painting a beautiful landscape. Some children were running around and laughing. We brought some sandwiches and drinks with us. Unfortunately, I forgot to bring my hat and got sunburnt. It was a fun day, and we really enjoyed our time. I hope to go again next week if the weather is good.");
      
      // const highlighted = highlightErrors(inputText, "I went to the park yesterday with my friend. We played football for one about two hours.The weather was very nice and sunny. There were many people walking their dogs. I saw a man who was painting a beautiful landscape. Some children were running around and laughing. We brought some sandwiches and drinks with us. Unfortunately, I forgot to bring my hat and got sunburnt. It was a fun day, and we really enjoyed our time. I hope to go again next week if the weather is good.");
      // setHighlightedText(highlighted);
      
      // setShowResults(true);
        const response = await fetch('http://localhost:5001/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: inputText })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch from grammar correction API');
      }

      const data = await response.json();
      const result = data.result;

      setCorrectedText(result);
      const highlighted = highlightErrors(inputText, result);
      setHighlightedText(highlighted);
      setShowResults(true);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to check grammar. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(correctedText);
      setCopyText('Copied');
      setTimeout(() => setCopyText('Copy'), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const resetForm = () => {
    setInputText('');
    setCorrectedText('');
    setShowResults(false);
    setHighlightedText('');
    setCopyText('Copy');
  };

  const countErrors = () => {
    const diffs = diffWords(inputText, correctedText);
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
  
  const errorCount = showResults ? countErrors() : 0;
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
            Grammar Checker
          </h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
              className={`dark-mode-toggle-button ${darkMode ? 'dark' : ''}`}
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
            Check Your Grammar
          </h2>
          <p className={`check-grammar-description ${darkMode ? 'dark' : ''}`}>
            Paste your text below and let our AI identify and correct grammar mistakes.
          </p>
          
          <div id="grammar-form" aria-describedby="helper-text">
            <label htmlFor="input-text" className={`check-grammar-input-label ${darkMode ? 'dark' : ''}`}>
                Your Text
              <span style={{ color: '#d33', marginLeft: '4px' }} aria-hidden="true">*</span>
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
              className={`check-grammar-grammar-input ${darkMode ? 'dark' : ''}`}
            />
            <p id="helper-text" style={{
              fontSize: '0.8rem',
              color: darkMode ? '#a0aec0' : '#666',
              marginTop: '4px'
            }}>
              Character count: <span id="char-count">{charCount}</span> &nbsp; 
              Words: <span id="word-count">{wordCount}</span>
            </p>
            <button 
              type="button" 
              onClick={handleSubmit}
              aria-label="Check Grammar"
              disabled={showResults || isLoading}
              className={`grammar-checker-submit-button ${darkMode ? 'dark' : ''}`}
            >
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{
                width: '18px',
                height: '18px',
                fill: 'white'
              }}>
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.397h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.242 0a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" fill="currentColor"/>
              </svg>
              {isLoading ? 'Checking...' : 'Check Grammar'}
            </button>
          </div>
        </section>

        {showResults && (
          <>
            <section aria-live="polite" aria-atomic="true" aria-label="Corrected Text">
              <div className={`grammar-checker-corrected-text ${darkMode ? 'dark' : ''}`}>
                <div style={{
                  display: 'flex',justifyContent: 'flex-end',marginBottom: '10px'}}>
                  <button 
                    type="button" 
                    onClick={copyToClipboard}
                    title="Copy corrected text to clipboard"
                    className={`grammar-checker-copy-button ${darkMode ? 'dark' : ''}`}>
                    {copyText}
                  </button>
                </div>
                <div dangerouslySetInnerHTML={{ __html: highlightCorrections(inputText, correctedText) }} />
              </div>
            </section>

            <section aria-label="Error Analysis">
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '35px',
              }}>
                <div className={`grammar-checker-error-analysis ${darkMode ? 'dark' : ''}`}>
                  Total Errors: <span style={{ fontWeight: '700', fontSize: '1.4rem', color: darkMode ? '#d6bcfa' : '#78350f' }}>{errorCount}</span>
                </div>
              </div>
            </section>

            <section aria-label="Before and After Comparison">
              <div className={`grammar-checker-comparison-container ${darkMode ? 'dark' : ''}`}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
                  <span style={{fontWeight: '700', fontSize: '1rem', userSelect: 'none',color: darkMode ? '#e2e8f0' : '#333'}}>Original Text</span>
                </div>
                <div 
                  className={`grammar-checker-original-text ${darkMode ? 'dark' : ''}`}
                  dangerouslySetInnerHTML={{ __html: highlightedText }}
                />
                <span style={{ display: 'block',fontWeight: '700', fontSize: '1rem', userSelect: 'none', paddingBottom: '15px', color: darkMode ? '#e2e8f0' : '#333'}}>Corrected Text</span>
                <div 
                  className={`grammar-checker-2-corrected-text ${darkMode ? 'dark' : ''}`}
                  dangerouslySetInnerHTML={{ __html: highlightCorrections(inputText, correctedText) }}
                />
              </div>
            </section>

            <button 
              type="button" 
              onClick={resetForm}
              className={`grammar-checker-reset-button ${darkMode ? 'dark' : ''}`}
            >
              Check Another Text
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default GrammarCheckerPage;