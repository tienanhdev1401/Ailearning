import React from "react";
import MiniGameMatchImageWord from "../MiniGame/MiniGameMatchImageWord";
import MiniGameSentenceBuilder from "../MiniGame/MiniGameSentenceBuilder";
import MiniGameLesson from "../MiniGame/MiniGameLesson";
import MiniGameExam from "../MiniGame/MiniGameExam";
import MiniGameListenSelect from "../MiniGame/MiniGameListenSelect";
import MiniGameTrueFalse from "../MiniGame/MiniGameTrueFalse";
import MiniGameTypingChallenge from "../MiniGame/MiniGameTypingChallenge";
import MiniGameFlipCard from "../MiniGame/MiniGameFlipCard";
import MiniGameWatchVideo from "../MiniGame/MiniGameWatchVideo";

const MiniGameRenderer = ({ game, onNext, onFail }) => {
  const gameKey = game.id || game.lessonId || JSON.stringify(game.prompt);

  switch (game.type) {
    case "match_image_word":
      return <MiniGameMatchImageWord key={gameKey} data={game} onNext={onNext} onFail={onFail} />;
    case "sentence_builder":
      return <MiniGameSentenceBuilder key={gameKey} data={game} onNext={onNext} onFail={onFail} />;
    case "lesson":
      return <MiniGameLesson key={gameKey} data={game} onNext={onNext} />;
    case "exam":
      return <MiniGameExam key={gameKey} data={game} onNext={onNext} />;
    case "listen_select":
      return <MiniGameListenSelect key={gameKey} data={game} onNext={onNext} onFail={onFail} />;
    case "true_false":
      return <MiniGameTrueFalse key={gameKey} data={game} onNext={onNext} onFail={onFail} />;
    case "typing_challenge":
      return <MiniGameTypingChallenge key={gameKey} data={game} onNext={onNext} onFail={onFail} />;
    case "flip_card":
      return <MiniGameFlipCard key={gameKey} data={game} onNext={onNext} />;
    case "watch_video":
      return <MiniGameWatchVideo key={gameKey} data={game} onNext={onNext} />;
    default:
      return <div className="text-center mt-5">❌ Chưa hỗ trợ loại minigame: {game.type}</div>;
  }
};

export default MiniGameRenderer;
