const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

export async function getCroppedImage(imageSrc, pixelCrop, fileName, mimeType = "image/jpeg") {
  if (!pixelCrop) {
    throw new Error("Thiếu thông tin vùng cắt ảnh");
  }

  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const width = Math.round(pixelCrop.width);
  const height = Math.round(pixelCrop.height);

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Không thể xử lý ảnh để cắt");
  }

  context.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    width,
    height
  );

  const targetType = mimeType || "image/jpeg";

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Không thể tạo ảnh sau khi cắt"));
          return;
        }

        const finalFileName = fileName || "avatar.jpg";
        const finalFile = new File([blob], finalFileName, { type: targetType });
        const previewUrl = URL.createObjectURL(blob);

        resolve({ file: finalFile, url: previewUrl });
      },
      targetType,
      0.95
    );
  });
}
