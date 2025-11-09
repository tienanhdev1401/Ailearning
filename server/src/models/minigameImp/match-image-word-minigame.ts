import { ChildEntity, Column } from "typeorm";
import { MiniGame } from "../minigame";
import { Activity } from "../activity";
import MiniGameType from "../../enums/minigameType.enum";

interface MatchImageWordResources {
  images: {
    id: number;
    imageUrl: string;
    correctWord: string;
  }[];
}

@ChildEntity(MiniGameType.MATCH_IMAGE_WORD)
export class MatchImageWordMiniGame extends MiniGame {
  @Column({ type: "json" })
  resources!: MatchImageWordResources;

  constructor(prompt?: string, resources?: MatchImageWordResources, activity?: Activity, type?: MiniGameType) {
    super(prompt, resources, activity, MiniGameType.MATCH_IMAGE_WORD);
  }
}
