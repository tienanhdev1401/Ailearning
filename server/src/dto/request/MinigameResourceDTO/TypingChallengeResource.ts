import { ArrayMaxSize, IsArray, IsBoolean, IsInt, IsOptional, IsPositive, IsString, MaxLength, ValidateIf } from "class-validator";

export class TypingChallengeResources {
  @IsString()
  @MaxLength(500)
  targetText!: string;

  @IsOptional()
  @IsBoolean()
  caseSensitive?: boolean;

  @IsOptional()
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== "")
  @IsInt()
  @IsPositive()
  timeLimitSeconds?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  hints?: string[];
}
