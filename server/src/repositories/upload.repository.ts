import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from "cloudinary";

import { Readable } from "stream";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class UploadRepository {
  private readonly baseFolder = "ailearning";

  async uploadImage(buffer: Buffer, filename: string, folder = "avatars"): Promise<string> {
    const uploadFolder = `${this.baseFolder}/${folder}`;

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: uploadFolder,
          resource_type: "image",
          use_filename: true,
          unique_filename: true,
          filename_override: filename,
        },
        (error: UploadApiErrorResponse | undefined, result?: UploadApiResponse) => {
          if (error || !result) {
            reject(new Error(error?.message || "Không thể tải ảnh lên Cloudinary"));
            return;
          }
          resolve(result.secure_url);
        }
      );

      stream.end(buffer);
    });
  }

  async uploadVideo(
    buffer: Buffer,
    filename: string,
    folder = "videos"
  ): Promise<{ publicId: string; hlsUrl: string; fallbackUrl: string }> {

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: `ailearning/${folder}`,
          use_filename: true,
          unique_filename: true,
          eager: [
            {
              streaming_profile: "hd",
              format: "m3u8",
            },
          ],
          eager_async: true, // HLS sẽ generate sau
        },
        (error, result) => {
          if (error || !result) {
            return reject(error || new Error("Upload failed"));
          }

          // ✅ LUÔN build HLS URL (không phụ thuộc eager)
          const hlsUrl = cloudinary.url(result.public_id, {
            resource_type: "video",
            format: "m3u8",
            streaming_profile: "hd",
            secure: true,
          });

          resolve({
            publicId: result.public_id,
            hlsUrl, // có thể chưa ready ngay
            fallbackUrl: result.secure_url, // MP4 luôn dùng được
          });
        }
      );

      Readable.from(buffer).pipe(uploadStream);
    });
  }
}
export const uploadRepository = new UploadRepository();
