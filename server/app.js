import express from 'express'
import dotenv from 'dotenv'
import mysql from 'mysql2'
import cookieParser from 'cookie-parser'
import passport from 'passport'
import cors from 'cors'

// Configs & routes
import sequelize from './config/database.js'
import userRouter from './routes/user.routes.js'
import authRouter from './routes/auth.routes.js'
import oauthRoutes from './routes/oauth.routes.js'
import './config/passport.js'   // chạy file config để đăng ký strategy
import errorHandlingMiddleware from './middlewares/errorHandling.middleware.js'

const app = express();
app.use(cookieParser());

app.use(express.json());

app.use(passport.initialize()); 



app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use('/api/auth', authRouter);
app.use("/api/auth", oauthRoutes);
app.use('/api/users', userRouter);

app.use(errorHandlingMiddleware);

// Kết nối và sync Sequelize
const PORT = 5000;
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Sequelize connected & synced');
  });
}).catch((err) => {
  console.error('Sequelize connection failed:', err);
});