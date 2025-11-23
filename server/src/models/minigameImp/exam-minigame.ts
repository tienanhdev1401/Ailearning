import { ChildEntity, Column } from "typeorm";
import { MiniGame } from "../minigame";
import { Activity } from "../activity";
import MiniGameType from "../../enums/minigameType.enum";

interface ExamQuestion {
  question: string;
  options: string[];
  correctIndex: number; // 0–3
}

interface ExamResources {
  questions: ExamQuestion[];
}

@ChildEntity(MiniGameType.EXAM)
export class ExamMiniGame extends MiniGame {
  @Column({ type: "json" })
  resources!: ExamResources;

  constructor( prompt?: string, resources?: ExamResources, activity?: Activity, type?: MiniGameType) {
    super(prompt, resources, activity, MiniGameType.EXAM);
  }
}
