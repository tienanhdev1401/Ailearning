import { ChildEntity, Column } from "typeorm";
import { MiniGame } from "../minigame";
import { Activity } from "../activity";
import MiniGameType from "../../enums/minigameType.enum";

interface FlipCardResources {
  cards: {
    term: string;
    definition: string;
  }[];
}

@ChildEntity(MiniGameType.FLIP_CARD)
export class FlipCardMiniGame extends MiniGame {
  @Column({ type: "json" })
  resources!: FlipCardResources;

  constructor(prompt?: string, resources?: FlipCardResources, activity?: Activity, type?: MiniGameType) {
    super(prompt, resources, activity, MiniGameType.FLIP_CARD);
  }
}
