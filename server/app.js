const express = require('express');
const mysql = require('mysql2');
const app = express();
const userRouter = require('./routes/user.routes');
const sequelize = require('./config/database');

const cookieParser = require('cookie-parser');
const authRouter = require('./routes/auth.routes');

app.use(cookieParser());

app.use(express.json());



const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use('/api/auth', authRouter);
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