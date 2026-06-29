const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/db');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'user_' + req.session.userId + '_' + Date.now() + ext);
  }
});

const upload = multer({ storage: storage });

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

router.get('/profile', requireLogin, async (req, res) => {
  try {
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [req.session.userId]);
    const [profiles] = await db.query('SELECT * FROM profiles WHERE user_id = ?', [req.session.userId]);

    res.render('profile', {
      user: users[0],
      profile: profiles[0] || {},
      saved: req.query.saved || false
    });
  } catch (err) {
    console.log(err);
    res.redirect('/login');
  }
});

router.post('/profile', requireLogin, upload.single('photo'), async (req, res) => {
  const { fullName, address, education, department, designation, plantLocation } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM profiles WHERE user_id = ?', [req.session.userId]);

    let photoPath = existing[0] ? existing[0].photo : null;
    if (req.file) {
      photoPath = '/uploads/' + req.file.filename;
    }

    if (existing.length > 0) {
      await db.query(
        `UPDATE profiles SET full_name=?, photo=?, address=?, education=?, department=?, designation=?, plant_location=? WHERE user_id=?`,
        [fullName, photoPath, address, education, department, designation, plantLocation, req.session.userId]
      );
    } else {
      await db.query(
        `INSERT INTO profiles (user_id, full_name, photo, address, education, department, designation, plant_location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.session.userId, fullName, photoPath, address, education, department, designation, plantLocation]
      );
    }

    res.redirect('/profile?saved=true');

  } catch (err) {
    console.log(err);
    res.redirect('/profile');
  }
});

module.exports = router;
