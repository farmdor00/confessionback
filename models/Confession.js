const mongoose = require('mongoose')

const indiaTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
const confessionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    createdAt: { type: Date, default: indiaTime },
  });
const Confession = mongoose.model('Confession', confessionSchema);

module.exports = Confession
