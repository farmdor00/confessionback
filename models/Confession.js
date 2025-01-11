const mongoose = require('mongoose')

const confessionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    comments: {type : [String], default: []},
    createdAt: { type: Date, default: Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }) },
  });
const Confession = mongoose.model('Confession', confessionSchema);

module.exports = Confession 
