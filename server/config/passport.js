const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');
const AuthService = require('../services/auth.service');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const { email, name } = profile._json;

        let user = await User.findOne({ where: { email } });
        if (!user) {
          user = await User.create({
            name,
            email,
            password: null,
            role: 'user',
            authProvider: 'google',
          });
        }

        return done(null, user);
      } catch (error) {
        console.error("🔥 Error in GoogleStrategy:", error);
        return done(error);
      }
    }
  )
);



// Serialize user để lưu vào session (nếu dùng session)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findByPk(id);
  done(null, user);
});