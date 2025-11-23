import { IsString } from "class-validator";

export class LessonResources {
  @IsString({ message: "content phải là chuỗi HTML" })
  content!: string;
}