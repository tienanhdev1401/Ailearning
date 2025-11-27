import { ChildEntity, Column } from "typeorm";
import { MiniGame } from "../minigame";
import MiniGameType from "../../enums/minigameType.enum";
import { TrueFalseResources } from "../../dto/request/MinigameResourceDTO/TrueFalseResource";
import { Activity } from "../activity";

@ChildEntity(MiniGameType.TRUE_FALSE)
export class TrueFalseMiniGame extends MiniGame {
  @Column({ type: "json" })
  resources!: TrueFalseResources;

  constructor(prompt?: string, resources?: TrueFalseResources, activity?: Activity) {
    super(prompt, resources, activity, MiniGameType.TRUE_FALSE);
  }
}
