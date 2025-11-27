import { ChildEntity, Column } from "typeorm";
import { MiniGame } from "../minigame";
import { Activity } from "../activity";
import MiniGameType from "../../enums/minigameType.enum";

interface SentenceBuilderResources {
  tokens: {
    id: number;
    text: string;
  }[];
}

@ChildEntity(MiniGameType.SENTENCE_BUILDER)
export class SentenceBuilderMiniGame extends MiniGame {
  @Column({ type: "json" })
  resources!: SentenceBuilderResources;

  constructor(prompt?: string, resources?: SentenceBuilderResources, activity?: Activity, type?: MiniGameType) {
    super(prompt, resources, activity, MiniGameType.SENTENCE_BUILDER);
  }
}
