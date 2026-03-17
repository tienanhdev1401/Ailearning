import { IsString, IsOptional, MaxLength } from "class-validator";

export class CreateVocabNoteDto {
  @IsString()
  @MaxLength(255)
  term!: string;

  @IsString()
  definition!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  source?: string;
}
