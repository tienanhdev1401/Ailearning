import { ChildEntity, Column } from "typeorm";
import { MiniGame } from "../minigame";
import { Activity } from "../activity";
import MiniGameType from "../../enums/minigameType.enum";

interface ListenOption {
  id?: string | number;
  imageUrl?: string;
  text?: string;
}

interface ListenSelectResources {
  audioUrl: string; // audio to play for this question
  options: ListenOption[]; // 4 options
  correctIndex: number; // index of correct option
}

@ChildEntity(MiniGameType.LISTEN_SELECT)
export class ListenSelectMiniGame extends MiniGame {
  @Column({ type: "json" })
  resources!: ListenSelectResources;

  constructor(prompt?: string, resources?: ListenSelectResources, activity?: Activity, type?: MiniGameType) {
    super(prompt, resources, activity, MiniGameType.LISTEN_SELECT);
  }
}
