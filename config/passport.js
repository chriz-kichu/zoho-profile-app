const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./db');
require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const googleId = profile.id;
      const email = profile.emails[0].value;
      const name = profile.displayName;

      const [existing] = await db.query('SELECT * FROM users WHERE google_id = ?', [googleId]);

      if (existing.length > 0) {
        return done(null, existing[0]);
      }

      const [byEmail] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (byEmail.length > 0) {
        await db.query('UPDATE users SET google_id = ? WHERE id = ?', [googleId, byEmail[0].id]);
        return done(null, byEmail[0]);
      }

      const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
      const [result] = await db.query(
        'INSERT INTO users (username, email, google_id) VALUES (?, ?, ?)',
        [username, email, googleId]
      );

      await db.query('INSERT INTO profiles (user_id, full_name) VALUES (?, ?)', [result.insertId, name]);

      const [newUser] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      return done(null, newUser[0]);

    } catch (err) {
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    done(null, rows[0]);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
