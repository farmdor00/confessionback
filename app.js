const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios'); // Import axios for API requests
const Confession = require('./models/Confession');
require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

const MONGO_URI = `${process.env.URI}`;
mongoose.connect(MONGO_URI).then(() => console.log('Connected to Database'));

const HCAPTCHA_SECRET = process.env.CAPTCHA_SECRET;

app.post('/confessions', async (req, res) => {
  try {
    const { text, hCaptchaToken } = req.body;

    if (!text) return res.status(400).json({ message: 'Confession text is required' });
    if (!hCaptchaToken) return res.status(400).json({ message: 'Complete the captcha' });

    const hCaptchaResponse = await axios.post('https://hcaptcha.com/siteverify', null, {
      params: {
        secret: HCAPTCHA_SECRET,
        response: hCaptchaToken,
      },
    });

    if (!hCaptchaResponse.data.success) {
      return res.status(400).json({ message: 'Invalid Captcha', errors: hCaptchaResponse.data['error-codes'] });
    }

    const confession = new Confession({ text });
    await confession.save();

    res.status(201).json({ message: 'Confession saved successfully', confession });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
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
    res.status(500).json({ message: 'Server error', error });
  }
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
