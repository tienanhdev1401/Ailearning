import express, { Application, Request, Response, NextFunction } from 'express';
import "reflect-metadata"; 
import dotenv from 'dotenv'
import mysql from 'mysql2'
import cookieParser from 'cookie-parser'
import passport from 'passport'
import cors from 'cors'
import http from "http";

dotenv.config(); // load env

// Configs & routes
import { AppDataSource } from "./config/database";
import userRouter from './routes/user.routes'
import authRouter from './routes/auth.routes'
import oauthRoutes from './routes/oauth.routes'
import grammarCheckerRouter from './routes/grammarChecker.routes'
import lessonRouter from './routes/lesson.routes'
import pronunciationRouter from './routes/pronunciation.routes'
import roadmapRouter from './routes/roadmap.routes'
import dayRouter from './routes/day.routes'
import activityRouter from './routes/activity.routes'
import minigameRouter from './routes/minigame.routes'
import userconfirmRouter from './routes/userconfirm.routes'
import './config/passport'   // chạy file config để đăng ký strategy
import errorHandlingMiddleware from './middlewares/errorHandling.middleware'
import { limiter } from './middlewares/ratelimit.middleware'
import uploadRouter from './routes/upload.routes'

import { swaggerUi, swaggerSpec } from "./config/swagger";
import { setupSocket } from './socket';
import aiChatRouter from "./routes/aiChat.routes";
import { ensureAiChatFolders } from "./services/ai-chat/audioStorage.service";
import { seedAiScenarios } from "./seeds/aiScenarios.seed";
import supportChatRouter from "./routes/supportChat.routes";
import dashboardRouter from "./routes/dashboard.routes";
import gopRouter from "./routes/gop.routes";

import roadmapEnrollementRoutes from './routes/roamapEnrollement.routes'

import { startAllSchedulers } from './schedulers/index';



const app = express();
app.use(cookieParser());

app.use(express.json());

app.use(passport.initialize()); 

const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(limiter);

// Khởi tạo socket
const server = http.createServer(app);
setupSocket(server);
ensureAiChatFolders().catch((error) =>
  console.error("Failed to prepare AI chat folders", error)
);

app.use('/api/auth', authRouter);
app.use("/api/auth", oauthRoutes);
app.use('/api/users', userRouter);

app.use('/api',grammarCheckerRouter);
app.use('/api/lessons',lessonRouter);
app.use('/api/pronunciation', pronunciationRouter);
app.use('/api/roadmaps', roadmapRouter);
app.use('/api/days', dayRouter);
app.use('/api/activities', activityRouter);
app.use('/api/minigames', minigameRouter);
app.use("/api/ai-chat", aiChatRouter);
app.use("/api/support-chat", supportChatRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/gop", gopRouter);
app.use('/api/confirm', userconfirmRouter);
app.use('/api/uploads', uploadRouter);
app.use('/api/roadmap_enrollments',roadmapEnrollementRoutes)



// swagger endpoint
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandlingMiddleware);


// Kết nối và sync TypeORM
const PORT = Number(process.env.PORT) || 5000;
AppDataSource.initialize().then(() => {
  seedAiScenarios().catch((error) =>
    console.error("Failed to seed AI chat scenarios", error)
  );

  // Khởi động tất cả schedulers
  startAllSchedulers();
  
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('TypeORM connected & synced');
    console.log(`📑 Swagger docs: http://localhost:${PORT}/api-docs`);
  });
}).catch((err: Error) => {
  console.error('TypeORM connection failed:', err);
});