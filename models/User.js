const mongoose = require('mongoose');

const User = new mongoose.Schema({
    exchanges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'exchange' }],
    createdAt: { type: Date, default: Date.now() },
    username: String,
    id: String
})

module.exports = mongoose.model('user', User);