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
import dayRouter from './routes/day.routes.js'
import activityRouter from './routes/activity.routes'
import minigameRouter from './routes/minigame.routes'
import './config/passport.js'   // chạy file config để đăng ký strategy
import errorHandlingMiddleware from './middlewares/errorHandling.middleware'
import { limiter } from './middlewares/ratelimit.middleware'

import { swaggerUi, swaggerSpec } from "./config/swagger";
import { setupSocket } from './socket';
import chatRouter from "./routes/chat.router.js";

const app = express();
app.use(cookieParser());

app.use(express.json());

app.use(passport.initialize()); 

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(limiter);

// Khởi tạo socket
const server = http.createServer(app);
setupSocket(server);

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
app.use("/api/chat", chatRouter);



// swagger endpoint
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandlingMiddleware);


// Kết nối và sync TypeORM
const PORT = 5000;
AppDataSource.initialize().then(() => {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('TypeORM connected & synced');
    console.log(`📑 Swagger docs: http://localhost:${PORT}/api-docs`);
  });
}).catch((err: Error) => {
  console.error('TypeORM connection failed:', err);
});