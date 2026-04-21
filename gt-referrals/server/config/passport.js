import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import User from '../models/User.js';
import Jobseeker from '../models/Jobseeker.js'; // Import discriminator

export function initPassport() {
  const strategy = new OAuth2Strategy(
    {
      authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: process.env.LINKEDIN_CALLBACK_URL,
      scope: ['openid', 'profile', 'email'],
    },
    async (accessToken, refreshToken, profile_unused, done) => {
      try {
        // Fetch user profile from the OpenID connect userinfo endpoint
        const response = await fetch('https://api.linkedin.com/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await response.json();

        // data contains standard OIDC fields: sub, name, given_name, family_name, picture, email
        let user = await User.findOne({ linkedinId: data.sub });

        if (user) {
          user.linkedin.accessToken = accessToken;
          user.linkedin.displayName = data.name;
          user.linkedin.photo = data.picture || user.linkedin.photo;
          await user.save();
          return done(null, user);
        }

        // New user — default to Jobseeker since the backend lacks an onboarding flow to pick a role.
        user = await Jobseeker.create({
          linkedinId: data.sub,
          name: data.name,
          email: data.email, // save email from OIDC
          linkedin: {
            accessToken,
            displayName: data.name,
            photo: data.picture,
          },
        });

        return done(null, user);
      } catch (err) {
        console.error("LinkedIn OAuth Error:", err.message);
        return done(err, null);
      }
    }
  );

  // LinkedIn requires a state parameter, but passport-oauth2 requires express-session to explicitly track it.
  // We override authorizationParams to just pass a static state to satisfy the LinkedIn API without needing session storage.
  strategy.authorizationParams = function () {
    return { state: 'linkedin_auth_state' };
  };

  passport.use('linkedin', strategy);

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
