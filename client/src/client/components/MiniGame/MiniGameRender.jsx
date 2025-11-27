import React from "react";
import MiniGameMatchImageWord from "../MiniGame/MiniGameMatchImageWord";
import MiniGameSentenceBuilder from "../MiniGame/MiniGameSentenceBuilder";
import MiniGameLesson from "../MiniGame/MiniGameLesson";
import MiniGameExam from "../MiniGame/MiniGameExam";
import MiniGameListenSelect from "../MiniGame/MiniGameListenSelect";
import MiniGameTrueFalse from "../MiniGame/MiniGameTrueFalse";
import MiniGameTypingChallenge from "../MiniGame/MiniGameTypingChallenge";

const MiniGameRenderer = ({ game, onNext }) => {
  switch (game.type) {
    case "match_image_word":
      return <MiniGameMatchImageWord data={game} onNext={onNext} />;
    case "sentence_builder":
      return <MiniGameSentenceBuilder data={game} onNext={onNext} />;
    case "lesson":
      return <MiniGameLesson data={game} onNext={onNext} />;
    case "exam":
      return <MiniGameExam data={game} onNext={onNext} />;
    case "listen_select":
      return <MiniGameListenSelect data={game} onNext={onNext} />;
    case "true_false":
      return <MiniGameTrueFalse data={game} onNext={onNext} />;
    case "typing_challenge":
      return <MiniGameTypingChallenge data={game} onNext={onNext} />;
    default:
      return <div className="text-center mt-5">❌ Chưa hỗ trợ loại minigame: {game.type}</div>;
  }
};

export default MiniGameRenderer;
