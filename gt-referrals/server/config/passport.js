import passport from 'passport';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import User from '../models/User.js';

// Called explicitly from index.js AFTER dotenv.config() runs.
// In ES modules, top-level import code executes before any dotenv.config() call,
// so we must defer strategy initialization to a function.
export function initPassport() {
  passport.use(
    new LinkedInStrategy(
      {
        clientID: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        callbackURL: process.env.LINKEDIN_CALLBACK_URL,
        scope: ['openid', 'profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ linkedinId: profile.id });

          if (user) {
            // Update LinkedIn profile data on each login
            user.linkedin.accessToken = accessToken;
            user.linkedin.displayName = profile.displayName;
            user.linkedin.photo = profile.photos?.[0]?.value || user.linkedin.photo;
            await user.save();
            return done(null, user);
          }

          // New user — create with LinkedIn data; role assigned after onboarding
          user = await User.create({
            linkedinId: profile.id,
            name: profile.displayName,
            linkedin: {
              accessToken,
              displayName: profile.displayName,
              photo: profile.photos?.[0]?.value,
              profileUrl: profile._json?.publicProfileUrl,
            },
          });

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
}

export default passport;
