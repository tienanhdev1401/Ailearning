# AI Learning Application

Ứng dụng học AI với React frontend và Node.js backend.

## Cách chạy ứng dụng

### Phương pháp 1: Chạy từ thư mục root (Khuyến nghị)

```bash
# Cài đặt tất cả dependencies
npm run install-all

# Chạy cả client và server cùng lúc
npm start
# hoặc
npm run dev
```

### Phương pháp 2: Chạy từ thư mục server

```bash
# Di chuyển vào thư mục server
cd server

# Chạy cả client và server từ server
npm run dev
```

### Phương pháp 3: Sử dụng file batch (Windows)

Double-click vào file `start-app.bat` để chạy ứng dụng.

### Phương pháp 4: Chạy riêng lẻ

**Terminal 1 - Server:**
```bash
cd server
npm start
```

**Terminal 2 - Client:**
```bash
cd client
npm start
```

## Ports

- **Client (React)**: http://localhost:3000
- **Server (Node.js)**: http://localhost:5000 (hoặc port được cấu hình)

## Cấu trúc thư mục

```
Ailearning/
├── client/          # React frontend
├── server/          # Node.js backend  
├── f5-model-server/ # Python AI model server
├── package.json     # Root package.json để quản lý toàn bộ project
└── start-app.bat    # Script Windows để khởi động nhanh
```

## Lưu ý

- Đảm bảo đã cài đặt Node.js và npm
- Kiểm tra ports 3000 và 5000 không bị chiếm dụng
- Cấu hình database và environment variables trước khi chạy
