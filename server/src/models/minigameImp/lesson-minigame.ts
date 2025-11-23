import { ChildEntity, Column } from "typeorm";
import { MiniGame } from "../minigame";
import { Activity } from "../activity";
import MiniGameType from "../../enums/minigameType.enum";

interface LessonResources {
  content: string; // HTML content
}

@ChildEntity(MiniGameType.LESSON)
export class LessonMiniGame extends MiniGame {
  @Column({ type: "json", nullable: false })
  resources!: LessonResources;

  constructor(prompt?: string, resources?: LessonResources, activity?: Activity, type?: MiniGameType) {
    super(prompt, resources, activity, MiniGameType.LESSON);
  }
}
