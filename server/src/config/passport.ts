import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { VerifyCallback } from "passport-oauth2";
import dotenv from "dotenv";
import { userRepository } from "../repositories/user.repository";
import USER_ROLE from "../enums/userRole.enum";
import AUTH_PROVIDER from "../enums/authProvider.enum";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ): Promise<void> => {
      try {
        const email = profile._json.email as string;
        const name = profile._json.name as string;

        let user = await userRepository.findOne({ where: { email } });

        if (!user) {
          user = userRepository.create({
            name,
            email,
            password: null,
            role: USER_ROLE.USER,               
            authProvider: AUTH_PROVIDER.GOOGLE, 
          });
          await userRepository.save(user);      
        }

        return done(null, user);
      } catch (error) {
        console.error("🔥 Error in GoogleStrategy:", error);
        return done(error as Error);
      }
    }
  )
);

// Serialize user để lưu vào session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await userRepository.findOne({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
