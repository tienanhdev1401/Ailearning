import React, { useState } from "react";
import styles from "../../styles/MiniGameMatchImageWord.module.css";

const MiniGameMatchImageWord = ({ data, onNext }) => {
  const imageList = Array.isArray(data?.resources?.images) ? data.resources.images : [];
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedWord, setSelectedWord] = useState("");
  const [completedPairs, setCompletedPairs] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const handleSelectImage = (img) => {
    if (completedPairs.includes(img.id)) return;
    setSelectedImage(img);
    setFeedback(null);
  };

  const handleSelectWord = (word) => {
    if (!selectedImage || completedPairs.includes(selectedImage.id)) return;
    setSelectedWord(word);

    if (word === selectedImage.correctWord) {
      setCompletedPairs([...completedPairs, selectedImage.id]);
      setFeedback(true);
    } else {
      setFeedback(false);
    }

    setSelectedImage(null);
    setSelectedWord("");

    setTimeout(() => setFeedback(null), 1500);
  };

  const allCompleted = imageList.length === 0 || completedPairs.length === imageList.length;
  const progress = imageList.length
    ? Math.round((completedPairs.length / imageList.length) * 100)
    : 0;

  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameHeader}>
        <h2 className={styles.prompt}>{data.prompt}</h2>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
        </div>
        <span className={styles.progressText}>{completedPairs.length} / {imageList.length}</span>
      </div>

      {feedback !== null && (
        <div className={`${styles.feedbackOverlay} ${feedback ? styles.feedbackSuccess : styles.feedbackError}`}>
          <div className={styles.feedbackContent}>
            {feedback ? (
              <>
                <span className={styles.feedbackIcon}>🎉</span>
                <span className={styles.feedbackText}>Chính xác!</span>
              </>
            ) : (
              <>
                <span className={styles.feedbackIcon}>❌</span>
                <span className={styles.feedbackText}>Thử lại!</span>
              </>
            )}
          </div>
        </div>
      )}

      <div className={styles.imagesGrid}>
        {imageList.map((img) => (
          <div
            key={img.id}
            className={`${styles.imageCard} ${
              completedPairs.includes(img.id) ? styles.completed : ""
            } ${selectedImage?.id === img.id ? styles.selected : ""}`}
            onClick={() => handleSelectImage(img)}
          >
            <div className={styles.imageWrapper}>
              <img
                src={img.imageUrl}
                alt={img.correctWord}
                className={styles.image}
              />
              {completedPairs.includes(img.id) && (
                <div className={styles.completedBadge}>✔</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.wordsContainer}>
        <div className={styles.wordsGrid}>
          {imageList.map((img) => (
            <button
              key={img.correctWord}
              className={`${styles.wordButton} ${
                completedPairs.includes(img.id) ? styles.wordCompleted : ""
              } ${selectedWord === img.correctWord ? styles.wordSelected : ""}`}
              onClick={() => handleSelectWord(img.correctWord)}
              disabled={completedPairs.includes(img.id)}
            >
              {img.correctWord}
            </button>
          ))}
        </div>
      </div>

      {allCompleted && (
        <div className={styles.completionContainer}>
          <div className={styles.completionMessage}>
            <h3 className={styles.completionText}>Hoàn thành xuất sắc!</h3>
          </div>
          <button onClick={onNext} className={styles.nextButton}>
            Tiếp theo 🎯
          </button>
        </div>
      )}
    </div>
  );
};

export default MiniGameMatchImageWord;
