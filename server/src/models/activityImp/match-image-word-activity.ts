import { ChildEntity, Column } from "typeorm";
import { Activity } from "../activity";
import ActivityType from "../../enums/activityType.enum";

@ChildEntity(ActivityType.MATCH_IMAGE_WORD)
export class MatchImageWordActivity extends Activity {
  @Column({ type: "json" })
  resources!: {
    images: {
      id: number;
      imageUrl: string;
      correctWord: string;
    }[];
  };
}
