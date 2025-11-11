import express from "express";
import multer from "multer";
import UploadController from "../controllers/upload.controller";
import verifyTokenAndRole from "../middlewares/auth.middleware";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Định dạng file không được hỗ trợ"));
    }
  },
});

router.post(
  "/avatar",
  verifyTokenAndRole(),
  upload.single("avatar"),
  UploadController.uploadAvatar
);

export default router;
