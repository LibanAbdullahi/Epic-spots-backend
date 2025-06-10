import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../index';

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID as string,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Google ID
    let user = await prisma.user.findUnique({
      where: { googleId: profile.id }
    });

    if (user) {
      // User exists, return user
      return done(null, user);
    }

    // Check if user exists with the same email (from regular registration)
    const existingUser = await prisma.user.findUnique({
      where: { email: profile.emails?.[0]?.value }
    });

    if (existingUser) {
      // Link Google account to existing user
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          googleId: profile.id,
          avatar: profile.photos?.[0]?.value
        }
      });
      return done(null, user);
    }

    // Create new user
    user = await prisma.user.create({
      data: {
        googleId: profile.id,
        name: profile.displayName || profile.name?.givenName + ' ' + profile.name?.familyName || 'Unknown',
        email: profile.emails?.[0]?.value || '',
        avatar: profile.photos?.[0]?.value,
        role: 'USER'
      }
    });

    return done(null, user);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true
      }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport; 