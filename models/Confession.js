const mongoose = require('mongoose')

const confessionSchema = new mongoose.Schema({
    text: { type: String, required: true },
  },{timestamps: true});
const Confession = mongoose.model('Confession', confessionSchema);

module.exports = Confession
