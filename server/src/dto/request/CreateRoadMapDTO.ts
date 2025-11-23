import { IsString, IsNotEmpty, IsOptional } from "class-validator";

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateRoadmapDto:
 *       type: object
 *       required:
 *         - levelName
 *       properties:
 *         levelName:
 *           type: string
 *           example: "Toeic Beginner 300"
 *           description: Tên cấp độ hoặc tên roadmap
 *         description:
 *           type: string
 *           example: "Lộ trình học tiếng Anh cơ bản cho người mới bắt đầu"
 *           description: Mô tả chi tiết về roadmap
 */
export class CreateRoadmapDto {
  @IsString({ message: "Tên cấp độ phải là chuỗi ký tự" })
  @IsNotEmpty({ message: "Tên cấp độ không được để trống" })
  levelName!: string;

  @IsOptional()
  @IsString({ message: "Mô tả phải là chuỗi ký tự" })
  description?: string;

    @IsOptional()
    @IsString({ message: "Overview phải là chuỗi ký tự" })
    overview?: string;
}
