const express = require('express');
require("dotenv").config();
const mysql = require('mysql2');
const app = express();
const userRouter = require('./routes/user.routes');
const sequelize = require('./config/database');

const cookieParser = require('cookie-parser');
const authRouter = require('./routes/auth.routes');
const oauthRoutes = require("./routes/oauth.routes");
const passport = require('passport'); // ✅ import thư viện passport
require('./config/passport'); // ✅ chạy file config để đăng ký strategy

app.use(cookieParser());

app.use(express.json());

app.use(passport.initialize()); 



const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use('/api/auth', authRouter);
app.use("/api/auth", oauthRoutes);
app.use('/api/users', userRouter);



// Kết nối và sync Sequelize
const PORT = 5000;
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('✅ Sequelize connected & synced');
  });
}).catch((err) => {
  console.error('❌ Sequelize connection failed:', err);
});