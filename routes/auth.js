const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');
const db = require('../config/db');

router.get('/signup', (req, res) => {
  res.render('signup', { error: null });
});

router.post('/signup', async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  if (!username || !password) {
    return res.render('signup', { error: 'Fill in all fields' });
  }

  if (password !== confirmPassword) {
    return res.render('signup', { error: 'Passwords do not match' });
  }

  try {
    const [check] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (check.length > 0) {
      return res.render('signup', { error: 'Username already taken' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashed]
    );

    await db.query('INSERT INTO profiles (user_id) VALUES (?)', [result.insertId]);

    req.session.userId = result.insertId;
    res.redirect('/profile');

  } catch (err) {
    console.log(err);
    res.render('signup', { error: 'Something went wrong, try again' });
  }
});

router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

    if (rows.length === 0) {
      return res.render('login', { error: 'Invalid username or password' });
    }

    const user = rows[0];

    if (!user.password) {
      return res.render('login', { error: 'This account uses Google login' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render('login', { error: 'Invalid username or password' });
    }

    req.session.userId = user.id;
    res.redirect('/profile');

  } catch (err) {
    console.log(err);
    res.render('login', { error: 'Something went wrong, try again' });
  }
});

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' }));
router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    req.session.userId = req.user.id;
    res.redirect('/profile');
  }
);

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
