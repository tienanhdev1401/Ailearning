import { Request, Response, NextFunction } from "express";
import { HttpStatusCode } from "axios";
import { uploadRepository } from "../repositories/upload.repository";

class UploadController {
  static async uploadAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      const file = req.file as Express.Multer.File | undefined;
      if (!file) {
        res
          .status(HttpStatusCode.BadRequest)
          .json({ message: "Vui lòng chọn một file ảnh hợp lệ" });
        return;
      }

      const folder = (req.query.folder as string) || "avatars";
      const imageUrl = await uploadRepository.uploadImage(file.buffer, file.originalname, folder);

      res.status(HttpStatusCode.Ok).json({ url: imageUrl });
    } catch (error) {
      next(error);
    }
  }

  static async uploadVideo(req: Request, res: Response, next: NextFunction) {
    try {
      const file = req.file as Express.Multer.File;

      if (!file || !file.buffer) {
        return res.status(HttpStatusCode.BadRequest).json({
          message: "Vui lòng chọn video hợp lệ",
        });
      }

      const folder = (req.query.folder as string) || "videos";

      const result = await uploadRepository.uploadVideo(
        file.buffer,
        file.originalname,
        folder
      );

      return res.status(HttpStatusCode.Ok).json({
        publicId: result.publicId,
        hlsUrl: result.hlsUrl,
        fallbackUrl: result.fallbackUrl,
      });
    } catch (error) {
      next(error);
    }
  }
};


export default UploadController;
