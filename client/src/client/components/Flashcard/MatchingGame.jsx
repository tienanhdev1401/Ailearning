import React, { useState, useEffect, useCallback, useContext } from "react";
import { ThemeContext } from "../../../context/ThemeContext";
import { PlayFill, ArrowCounterclockwise } from "react-bootstrap-icons";
import styles from "../../styles/MatchingGame.module.css";

const MatchingGame = ({ cards }) => {
  const { isDarkMode } = useContext(ThemeContext);
  
  const [gameCards, setGameCards] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [matchedIds, setMatchedIds] = useState(new Set());
  const [wrongId, setWrongId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [time, setTime] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const initGame = useCallback(() => {
    // Select up to 6 random cards for the game
    const selection = [...cards].sort(() => 0.5 - Math.random()).slice(0, 6);
    
    const terms = selection.map(c => ({ id: c.term, content: c.term, type: 'term', matchId: c.definition }));
    const definitions = selection.map(c => ({ id: c.definition, content: c.definition, type: 'definition', matchId: c.term }));
    
    const all = [...terms, ...definitions].sort(() => 0.5 - Math.random());
    
    setGameCards(all);
    setMatchedIds(new Set());
    setSelectedId(null);
    setWrongId(null);
    setStartTime(Date.now());
    setTime(0);
    setIsFinished(false);
    setGameStarted(true);
  }, [cards]);

  useEffect(() => {
    let timer;
    if (gameStarted && !isFinished) {
      timer = setInterval(() => {
        setTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStarted, isFinished, startTime]);

  const handleCardClick = (card) => {
    if (matchedIds.has(card.id) || isFinished) return;
    
    if (!selectedId) {
      setSelectedId(card.id);
      return;
    }
    
    if (selectedId === card.id) {
      setSelectedId(null);
      return;
    }
    
    const firstCard = gameCards.find(c => c.id === selectedId);
    
    if (firstCard.matchId === card.id) {
      // Match!
      const newMatched = new Set(matchedIds);
      newMatched.add(firstCard.id);
      newMatched.add(card.id);
      setMatchedIds(newMatched);
      setSelectedId(null);
      
      if (newMatched.size === gameCards.length) {
        setIsFinished(true);
      }
    } else {
      // Wrong
      setWrongId(card.id);
      setTimeout(() => {
        setWrongId(null);
        setSelectedId(null);
      }, 500);
    }
  };

  if (!gameStarted) {
    return (
      <div className={styles.startScreen}>
        <h2 className={styles.gameTitle}>Sẵn sàng chưa?</h2>
        <p className={styles.gameDesc}>Hãy ghép tất cả các thuật ngữ với định nghĩa đúng của chúng nhanh nhất có thể.</p>
        <button className={styles.startBtn} onClick={initGame}>
          <PlayFill size={24} /> Bắt đầu trò chơi
        </button>
      </div>
    );
  }

  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameHeader}>
        <div className={styles.timer}>Thời gian: {time} giây</div>
        {isFinished && (
          <button className={styles.retryBtn} onClick={initGame}>
            <ArrowCounterclockwise /> Chơi lại
          </button>
        )}
      </div>

      {isFinished ? (
        <div className={styles.finishScreen}>
          <div className={styles.trophy}>🏆</div>
          <h2 className={styles.finishTitle}>Tuyệt vời!</h2>
          <p className={styles.finishText}>Bạn đã hoàn thành trong <strong>{time} giây</strong>.</p>
          <button className={styles.startBtn} onClick={initGame}>
            Chơi lại lần nữa
          </button>
        </div>
      ) : (
        <div className={styles.cardsGrid}>
          {gameCards.map((card) => (
            <div
              key={card.id}
              className={`
                ${styles.matchCard} 
                ${selectedId === card.id ? styles.selected : ""} 
                ${matchedIds.has(card.id) ? styles.matched : ""} 
                ${wrongId === card.id ? styles.wrong : ""}
              `}
              onClick={() => handleCardClick(card)}
            >
              {card.content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchingGame;
