const express = require('express');
const User = require('../models/User');
const { generateToken, protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, aadharNumber, licenseNumber, vehicleNumber } = req.body;

    if (!name || !email || !password || String(password).length < 8) {
      return res.status(400).json({ message: 'Name, email and a password of at least 8 characters are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'driver', // public signup can never create an admin
      phone,
      aadharNumber,
      licenseNumber,
      vehicleNumber,
    });

    const token = generateToken(user._id);
    res.status(201).json({ user, token });
  } catch (error) {
    console.error('[auth]', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.json({ user, token });
  } catch (error) {
    console.error('[auth]', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
