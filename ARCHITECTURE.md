# Kiến trúc hệ thống AILearning

## 1. Tổng quan 3 lớp
- **Trình duyệt web**: người dùng truy cập giao diện React, gửi yêu cầu HTTP/HTTPS và kết nối WebSocket tới máy chủ web.
- **Máy chủ web (Backend API & Realtime)**: dịch vụ Node.js/Express (TypeScript) xử lý nghiệp vụ, xác thực, điều phối đến dịch vụ AI Python, lưu trữ file lên Cloudinary và đọc/ghi MySQL qua TypeORM. Cung cấp cả REST và Socket.IO.
- **Máy chủ cơ sở dữ liệu**: MySQL lưu trữ dữ liệu tài khoản, lộ trình học, bài học, hội thoại AI/support, tiến độ, v.v.

```
[Browser/React] --HTTP/WS--> [Node.js API + Socket.IO] --SQL--> [MySQL]
                                       |--HTTP--> [Grammar Checker Flask 5002]
                                       |--HTTP--> [Pronunciation FastAPI 5005]
                                       |--HTTP--> [TextGen Flask 5001]
                                       |--HTTPS--> [Cloudinary]
```

## 2. Thành phần chi tiết
### Frontend ReactJS (CRA)
- Khởi tạo bằng Create React App, chạy dev port 3000.
- Điều hướng client-side với `react-router-dom@7`, các trang chính: đăng nhập/khôi phục, trang học (roadmap, bài học, video/speaking), trải nghiệm AI chat, grammar checker, hồ sơ; khu vực admin (dashboard, người dùng, nhân sự, báo cáo, lịch, bài học, roadmaps, hoạt động, chat hỗ trợ).
- Quản lý trạng thái: Redux Toolkit cho store global, Context API cho Auth/Theme/Highlight, bảo vệ tuyến bằng `ProtectedRoute` và phân quyền (role admin/staff/user).
- Giao tiếp backend qua `axios` và `socket.io-client` (namespaces `/ai-chat` và `/support-chat`).
- Thành phần hỗ trợ: upload/crop ảnh (`react-easy-crop`), WYSIWYG (`@tinymce/tinymce-react`), biểu đồ (Chart.js, ApexCharts), ghi âm (`recordrtc`).

### Backend Node.js / Express (TypeScript)
- Chạy trên Express 5, khởi tạo tại `server/src/app.ts`, port 5000 (dev). Sử dụng `dotenv`, `cors`, `cookie-parser`, `passport` (Google OAuth), JWT, rate limiting, Swagger (`/api-docs`).
- ORM & DB: TypeORM kết nối MySQL (`AppDataSource`), `synchronize=true` cho phát triển, entities tại `server/src/models/**`.
- API chính (prefix `/api`):
  - `auth`, `oauth`, `users`, `confirm` (xác nhận tài khoản) – đăng nhập, đăng ký, đổi mật khẩu, Google OAuth, phân quyền.
  - `lessons`, `pronunciation`, `roadmaps`, `days`, `activities`, `minigames`, `roadmap_enrollments` – quản lý nội dung học và tiến độ.
  - `ai-chat`, `support-chat`, `dashboard` – hội thoại AI/support, thống kê.
  - `grammar` – proxy tới dịch vụ grammar checker.
  - `uploads` – upload qua `multer`, lưu Cloudinary/đĩa tùy cấu hình.
- Realtime: Socket.IO server với namespaces `/ai-chat` và `/support-chat`, phòng theo `conversationId`, phát sự kiện qua helpers `emitAiChatEvent`/`emitSupportChatEvent`.
- Lập lịch: `node-cron` qua `startAllSchedulers()`; seeding kịch bản AI chat `seedAiScenarios()`; chuẩn bị thư mục âm thanh `ensureAiChatFolders()`.

### Dịch vụ AI/ML rời (Python)
- **Grammar Checker (port 5002)**: Flask + Gramformer, endpoint `POST /check-grammar` nhận `text`, trả về `correction`; có `GET /health`.
- **Pronunciation Scoring (port 5005)**: FastAPI, endpoint `POST /score` nhận form-data `text` + file `audio` (.wav); chuẩn hóa 16k mono; tính điểm bằng `PronunciationScorer` (GOP); trả JSON chi tiết.
- **Text Generation (port 5001)**: Flask, model T5 tại `f5-model-server/my_model`, endpoint `POST /generate` nhận `text`, trả `result` sinh mới.

### Lưu trữ & tích hợp
- **MySQL**: thông số `.env` (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).
- **Cloudinary**: lưu trữ ảnh/tài liệu người dùng và hệ thống.
- **Filesystem**: thư mục `uploads/`, `uploads/ai-chat/...` cho media tạm thời/ghi âm.

## 3. Luồng dữ liệu mẫu
1. Người dùng đăng nhập trên React, `axios` gửi `/api/auth/login`, nhận JWT + cookies; Redux/Context lưu trạng thái, `ProtectedRoute` kiểm soát truy cập.
2. Khi mở ai-chat hoặc support-chat, frontend tạo `socket.io-client` tới `/ai-chat` hoặc `/support-chat`, join phòng theo `conversationId`; backend broadcast sự kiện chat/AI/điều hành qua socket.
3. Bài học/video/speaking: frontend gọi REST (lesson/day/activity/pronunciation). Với chấm điểm phát âm, file âm thanh gửi `POST /score` (FastAPI 5005); backend có thể chuyển tiếp/kết hợp kết quả.
4. Grammar checker: frontend gửi text tới backend (route grammar) hoặc trực tiếp Flask 5002, nhận câu đã sửa.
5. Upload tài liệu/ảnh: gửi multipart tới `/api/uploads`; backend lưu Cloudinary và trả URL; metadata lưu MySQL.
6. Admin thao tác nội dung/roadmap => CRUD qua REST; dashboard nhận số liệu tổng hợp.

## 4. Triển khai gợi ý
- **Frontend**: build CRA và deploy Vercel; cấu hình biến môi trường API_BASE_URL trỏ tới backend; bật HTTPS & CORS cho domain Vercel.
- **Backend Node**: deploy AWS (EC2/Elastic Beanstalk/Container App); bật HTTPS, cấu hình biến môi trường DB & Cloudinary, reverse proxy WebSocket; có thể container hóa để scale.
- **Dịch vụ AI Python**: đóng gói Docker, deploy cùng VPC (EC2/ECS) hoặc nội bộ k8s; expose các port 5001/5002/5005 nội bộ, gateway API đảm bảo chỉ backend truy cập.
- **Cơ sở dữ liệu**: MySQL trên AWS RDS; bật backup, security group hạn chế truy cập; cân nhắc tách writer/reader nếu tải cao.
- **Tĩnh/Media**: ưu tiên Cloudinary; nếu cần lưu tạm trên máy chủ, gắn EFS/volume.

## 5. Bảo mật & vận hành
- Bắt buộc HTTPS giữa trình duyệt ↔ backend ↔ dịch vụ AI; cấu hình CORS chỉ cho domain tin cậy.
- JWT + passport Google OAuth cho xác thực; rate limit `limiter` chống brute-force; validate đầu vào với `joi`/`class-validator`.
- Giám sát: bật log cho Express, Socket.IO; expose Swagger `/api-docs`; healthcheck cho Python services (5001/5002/5005) và Node.
- CI/CD: chạy `npm run build` cho frontend, `npm run build` cho backend, build images Python services; tự động deploy khi merge main.

## 6. Cấu hình cổng & endpoint chính (mặc định dev)
- Frontend: http://localhost:3000
- Backend API & Socket.IO: http://localhost:5000
- Swagger: http://localhost:5000/api-docs
- Grammar checker Flask: http://localhost:5002
- Text generation T5 Flask: http://localhost:5001
- Pronunciation scoring FastAPI: http://localhost:5005

## 7. Tóm tắt vai trò thành phần
- **Trình duyệt (React)**: hiển thị UI, quản lý trạng thái, gọi REST & WebSocket.
- **Máy chủ web (Node/Express)**: xử lý nghiệp vụ TOEIC/AI learning, điều phối AI services, lưu trữ dữ liệu, quản lý tệp, phát realtime.
- **Máy chủ CSDL (MySQL)**: lưu người dùng, bài học, roadmap, hội thoại, điểm số, cấu hình hệ thống.
