import { ChildEntity, Column } from "typeorm";
import { MiniGame } from "../minigame";
import { Activity } from "../activity";
import MiniGameType from "../../enums/minigameType.enum";

interface ListenSelectOption {
  id: number;
  text: string;
  imageUrl: string;
}

interface ListenSelectResources {
  options: ListenSelectOption[];
  audioUrl: string;
  correctIndex: number;
}

@ChildEntity(MiniGameType.LISTEN_SELECT)
export class ListenSelectMiniGame extends MiniGame {
  @Column({ type: "json" })
  resources!: ListenSelectResources;

  constructor(
    prompt?: string,
    resources?: ListenSelectResources,
    activity?: Activity,
    type?: MiniGameType
  ) {
    super(prompt, resources, activity, MiniGameType.LISTEN_SELECT);
  }
}
