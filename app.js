const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios'); 
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

app.post('/confessions', async (req, res) => {
  try {
    const { text, hCaptchaToken } = req.body;

    if (!text) return res.status(400).json({ message: 'Confession text is required' });
    if (!hCaptchaToken) return res.status(400).json({ message: 'Please complete the CAPTCHA' });

    const hCaptchaResponse = await axios.post('https://hcaptcha.com/siteverify', null, {
      params: {
        secret: HCAPTCHA_SECRET,
        response: hCaptchaToken,
      },
    });

    if (!hCaptchaResponse.data.success) {
      return res.status(400).json({
        message: 'Invalid CAPTCHA',
        errors: hCaptchaResponse.data['error-codes'],
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

app.get('/confessions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; 
    const limit = 15;

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

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
