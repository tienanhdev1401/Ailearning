import React from "react";
import MiniGameMatchImageWord from "../MiniGame/MiniGameMatchImageWord";
import MiniGameSentenceBuilder from "../MiniGame/MiniGameSentenceBuilder";

const MiniGameRenderer = ({ game, onNext }) => {
  switch (game.type) {
    case "match_image_word":
      return <MiniGameMatchImageWord data={game} onNext={onNext} />;
    case "sentence_builder":
      return <MiniGameSentenceBuilder data={game} onNext={onNext} />;
    default:
      return <div className="text-center mt-5">❌ Chưa hỗ trợ loại minigame: {game.type}</div>;
  }
};

export default MiniGameRenderer;
