import { ChildEntity, Column } from "typeorm";
import { MiniGame } from "../minigame";
import MiniGameType from "../../enums/minigameType.enum";

@ChildEntity(MiniGameType.MATCH_IMAGE_WORD)
export class MatchImageWordMiniGame extends MiniGame {
  @Column({ type: "json" })
  resources!: {
    images: {
      id: number;
      imageUrl: string;
      correctWord: string;
    }[];
  };
}
