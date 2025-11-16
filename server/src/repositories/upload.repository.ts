import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from "cloudinary";

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
}

export const uploadRepository = new UploadRepository();
