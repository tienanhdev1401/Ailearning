const express = require("express");
const router = express.Router();
const UserController = require("../controllers/user.controller");

router.get("/", UserController.getAllUsers);
router.get("/:id", UserController.getUserById);
router.post("/", UserController.createUser);
router.put("/:id", UserController.updateUser);
router.delete("/:id", UserController.deleteUser);


// Route gửi mã OTP
router.post('/send-verification-code', UserController.sendVerificationCode);

// Route quên mật khẩu (reset password bằng OTP)
router.post('/reset-password', UserController.resetPassword);


module.exports = router;