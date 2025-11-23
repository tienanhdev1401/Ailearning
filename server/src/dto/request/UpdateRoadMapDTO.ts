import { IsString, IsOptional } from "class-validator";

/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateRoadmapDto:
 *       type: object
 *       properties:
 *         levelName:
 *           type: string
 *           example: "Toeic Advanced 800"
 *           description: Tên cấp độ hoặc tên roadmap cần cập nhật
 *         description:
 *           type: string
 *           example: "Lộ trình học tiếng Anh nâng cao cho người đã có kiến thức cơ bản"
 *           description: Mô tả chi tiết về roadmap
 */
export class UpdateRoadmapDto {
  @IsOptional()
  @IsString({ message: "Tên cấp độ phải là chuỗi ký tự" })
  levelName?: string;

  @IsOptional()
  @IsString({ message: "Mô tả phải là chuỗi ký tự" })
  description?: string;

  @IsOptional()
  @IsString({ message: "Overview phải là chuỗi ký tự" })
  overview?: string;
}
