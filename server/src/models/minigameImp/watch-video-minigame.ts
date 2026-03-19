import { MiniGame } from "../minigame";
import { Activity } from "../activity";
import MiniGameType from "../../enums/minigameType.enum";
import { WatchVideoResources } from "../../dto/request/MinigameResourceDTO/WatchVideoResource";
import { ChildEntity } from "typeorm";

@ChildEntity(MiniGameType.WATCH_VIDEO)
export class WatchVideoMiniGame extends MiniGame {
  resources!: WatchVideoResources;

  constructor(
    prompt?: string,
    resources?: WatchVideoResources,
    activity?: Activity,
    type?: MiniGameType
  ) {
    super(prompt, resources, activity, MiniGameType.WATCH_VIDEO);
  }
}
