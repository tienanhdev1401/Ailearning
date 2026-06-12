import express, { Application, Request, Response, NextFunction } from 'express';
import "reflect-metadata";
import dotenv from 'dotenv'
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
import translationRouter from './routes/translation.routes'
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
import aiPromptRouter from "./routes/aiPrompt.routes";
import { seedAiScenarios } from "./seeds/aiScenarios.seed";
import { seedAiPromptsAndGuidance, EVALUATION_TEMPLATE } from "./seeds/aiPrompts.seed";
import supportChatRouter from "./routes/supportChat.routes";
import dashboardRouter from "./routes/dashboard.routes";
import gopRouter from "./routes/gop.routes";

import roadmapEnrollementRoutes from './routes/roamapEnrollement.routes'
import paymentRouter from './routes/payment.routes'
import packageRouter from './routes/package.routes'
import subscriptionRouter from './routes/subscription.routes'
import vocabNoteRouter from './routes/vocabNote.routes'
import notebookRouter from './routes/notebook.routes'
import dailyChallengeRouter from './routes/dailyChallenge.routes'
import ttsRouter from './routes/tts.routes';
import roadmapRecommendationRouter from './routes/roadmapRecommendation.routes';

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

app.use('/api/auth', authRouter);
app.use("/api/auth", oauthRoutes);
app.use('/api/users', userRouter);

app.use('/api', grammarCheckerRouter);
app.use('/api/translation', translationRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/pronunciation', pronunciationRouter);
app.use('/api/roadmaps', roadmapRouter);
app.use('/api/days', dayRouter);
app.use('/api/activities', activityRouter);
app.use('/api/minigames', minigameRouter);
app.use("/api/ai-chat", aiChatRouter);
app.use("/api/admin/ai", aiPromptRouter);
app.use("/api/support-chat", supportChatRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/gop", gopRouter);
app.use('/api/confirm', userconfirmRouter);
app.use('/api/uploads', uploadRouter);
app.use('/api/roadmap_enrollments', roadmapEnrollementRoutes)
app.use('/api/payments', paymentRouter);
app.use('/api/packages', packageRouter);
app.use('/api/subscriptions', subscriptionRouter);
app.use('/api/vocab-notes', vocabNoteRouter);
app.use('/api/notebooks', notebookRouter);
app.use('/api/daily-challenge', dailyChallengeRouter);
app.use('/api/tts', ttsRouter);
app.use('/api/roadmap-recommendation', roadmapRecommendationRouter);



// swagger endpoint
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandlingMiddleware);


// Kết nối và sync TypeORM
const PORT = Number(process.env.PORT) || 5000;
async function ensureAiChatSchema() {
  try {
    const dbName = AppDataSource.options.database as string | undefined;
    if (!dbName) return;
    const rows: Array<{ count: number }> = await AppDataSource.query(
      `SELECT COUNT(*) AS count FROM information_schema.columns
       WHERE table_schema = ? AND table_name = 'ai_messages' AND column_name = 'pronunciationScore'`,
      [dbName]
    );
    const exists = Number(rows?.[0]?.count ?? 0) > 0;
    if (!exists) {
      console.log("[Schema] Adding missing column ai_messages.pronunciationScore");
      await AppDataSource.query(
        "ALTER TABLE `ai_messages` ADD COLUMN `pronunciationScore` LONGTEXT NULL"
      );
    }

    const evalRows: Array<{ count: number }> = await AppDataSource.query(
      `SELECT COUNT(*) AS count FROM information_schema.columns
       WHERE table_schema = ? AND table_name = 'ai_evaluations' AND column_name = 'pronunciationReport'`,
      [dbName]
    );
    if (Number(evalRows?.[0]?.count ?? 0) === 0) {
      console.log("[Schema] Adding missing column ai_evaluations.pronunciationReport");
      await AppDataSource.query(
        "ALTER TABLE `ai_evaluations` ADD COLUMN `pronunciationReport` LONGTEXT NULL"
      );
    }

    // Bump legacy maxOutputTokens values that are too low for Gemini 2.5
    // thinking models. Idempotent: only raises if the stored value is below
    // the new floor.
    const promptFloors: Array<{ key: string; floor: number }> = [
      { key: "opening", floor: 600 },
      { key: "followUp", floor: 700 },
      { key: "evaluation", floor: 1500 },
    ];
    for (const { key, floor } of promptFloors) {
      const result: any = await AppDataSource.query(
        "UPDATE `ai_prompts` SET `maxOutputTokens` = ? WHERE `feature` = 'ai_chat' AND `key` = ? AND (`maxOutputTokens` IS NULL OR `maxOutputTokens` < ?)",
        [floor, key, floor]
      );
      const affected = Number(result?.affectedRows ?? 0);
      if (affected > 0) {
        console.log(`[Schema] Raised ai_prompts.${key}.maxOutputTokens to ${floor}`);
      }
    }

    // Upgrade the legacy evaluation prompt so it consumes the W2V_GOP
    // pronunciation evidence variable. Detect by missing placeholder; replace
    // the whole template + variables list in one shot.
    const evalPromptRows: Array<{ id: number; template: string; variables: string | null }> =
      await AppDataSource.query(
        "SELECT id, template, variables FROM `ai_prompts` WHERE `feature` = 'ai_chat' AND `key` = 'evaluation' LIMIT 1"
      );
    const existing = evalPromptRows?.[0];
    if (existing && !/\{\{\s*pronunciationEvidence\s*\}\}/i.test(existing.template ?? "")) {
      await AppDataSource.query(
        "UPDATE `ai_prompts` SET `template` = ?, `variables` = ? WHERE id = ?",
        [EVALUATION_TEMPLATE, JSON.stringify(["transcript", "pronunciationEvidence"]), existing.id]
      );
      console.log("[Schema] Upgraded ai_prompts.evaluation template to include pronunciationEvidence");
    }
  } catch (error) {
    console.error("[Schema] ensureAiChatSchema failed:", error);
  }
}

AppDataSource.initialize().then(async () => {
  await ensureAiChatSchema();
  seedAiPromptsAndGuidance()
    .then(() =>
      seedAiScenarios().catch((error) =>
        console.error("Failed to seed AI chat scenarios", error)
      )
    )
    .catch((error) =>
      console.error("Failed to seed AI prompts/guidance", error)
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