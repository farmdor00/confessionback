const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const Confession = require('./models/Confession');
require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

const MONGO_URI = process.env.URI;
const HCAPTCHA_SECRET = process.env.CAPTCHA_SECRET;

if (!MONGO_URI || !HCAPTCHA_SECRET) {
  console.error('Error: Missing environment variables.');
  process.exit(1);
}

mongoose.connect(MONGO_URI).then(() => console.log('Connected to Database')).catch(err => {
  console.error('Database connection failed', err);
  process.exit(1);
});

const confessionRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many requests, please try again later.',
});

app.post('/confessions', confessionRateLimiter, async (req, res) => {
  try {
    const { text, hCaptchaToken } = req.body;

    if (!text) return res.status(400).json({ message: 'Confession text is required' });
    if (!hCaptchaToken) return res.status(400).json({ message: 'Please complete the CAPTCHA' });
    if (text.length > 300) return res.status(400).json({message: 'Confession text cannot have more than 300 characters'})

    const hCaptchaResponse = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: HCAPTCHA_SECRET,
        response: hCaptchaToken,
      }),
    });

    const data = await hCaptchaResponse.json();

    if (!data.success) {
      return res.status(400).json({
        message: 'Invalid CAPTCHA',
        errors: data['error-codes'],
      });
    }

    const confession = new Confession({ text });
    await confession.save();

    res.status(201).json({ message: 'Confession saved successfully', confession });
  } catch (error) {
    console.error('Error in POST /confessions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


const fetchRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 24,
  message: 'Too many requests, please try again later.',
});

app.get('/confessions', fetchRateLimiter, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 25;

    const skip = (page - 1) * limit;

    const confessions = await Confession.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalConfessions = await Confession.countDocuments();

    res.status(200).json({
      confessions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalConfessions / limit),
        totalConfessions,
      },
    });
  } catch (error) {
    console.error('Error in GET /confessions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/confessions/:id', fetchRateLimiter, async (req, res) => {
  try {
    const confession = await Confession.findById(req.params.id);
    if (!confession) {
      return res.status(404).json({ message: 'Confession not found' });
    }
    res.status(200).json(confession);
  } catch (error) {
    console.error('Error in getting confession', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/confessions/:id/comments', fetchRateLimiter, async (req, res) => {
  try {
    const confession = await Confession.findById(req.params.id);
    if (!confession) {
      return res.status(404).json({ message: 'Confession not found' });
    }
    res.status(200).json(confession.comments);
  } catch (error) {
    console.error('Error in getting confession', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/confessions/:id/comments', confessionRateLimiter, async (req, res) => {
  try {
    const { comment, hCaptchaToken } = req.body;

    if (!comment) return res.status(400).json({ message: 'Comment text is required' });
    if (!hCaptchaToken) return res.status(400).json({ message: 'Please complete the CAPTCHA' });
    if (comment.length > 300) return res.status(400).json({ message: 'Comment text cannot have more than 300 characters' });

    const hCaptchaResponse = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: HCAPTCHA_SECRET,
        response: hCaptchaToken,
      }),
    });

    const data = await hCaptchaResponse.json();

    if (!data.success) {
      return res.status(400).json({
        message: 'Invalid CAPTCHA',
        errors: data['error-codes'],
      });
    }

    const confession = await Confession.findById(req.params.id);
    if (!confession) {
      return res.status(404).json({ message: 'Confession not found' });
    }

    confession.comments.push(comment);
    await confession.save();

    res.status(200).json({ message: 'Comment added successfully', confession });
  } catch (error) {
    console.error('Error in POST /confessions/:id/comments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


app.listen(PORT, () => console.log(`Server running on ${PORT}`));
