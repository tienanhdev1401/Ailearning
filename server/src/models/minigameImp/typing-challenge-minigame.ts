import { ChildEntity, Column } from "typeorm";
import { MiniGame } from "../minigame";
import MiniGameType from "../../enums/minigameType.enum";
import { TypingChallengeResources } from "../../dto/request/MinigameResourceDTO/TypingChallengeResource";
import { Activity } from "../activity";

@ChildEntity(MiniGameType.TYPING_CHALLENGE)
export class TypingChallengeMiniGame extends MiniGame {
  @Column({ type: "json" })
  resources!: TypingChallengeResources;

  constructor(prompt?: string, resources?: TypingChallengeResources, activity?: Activity) {
    super(prompt, resources, activity, MiniGameType.TYPING_CHALLENGE);
  }
}
