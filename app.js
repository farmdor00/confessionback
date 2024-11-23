const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const Confession = require('./models/Confession');
require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

const MONGO_URI = `${process.env.URI}`;
mongoose.connect(MONGO_URI).then(() => console.log('Connected to Database'));

app.post('/confessions', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Confession text is required' });
    const confession = new Confession({ text });
    await confession.save();
    res.status(201).json({ message: 'Confession saved successfully', confession });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

app.get('/confessions', async (req, res) => {
  try {
    const confessions = await Confession.find().sort({ createdAt: -1 });
    res.status(200).json(confessions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

app.delete('/confessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedConfession = await Confession.findByIdAndDelete(id);

    if (!deletedConfession) return res.status(404).json({ message: 'Confession not found' });
    res.status(200).json({ message: 'Confession deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
