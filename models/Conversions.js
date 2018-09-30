const mongoose = require('mongoose');

const ConversionSchema = new mongoose.Schema({
    from: String,
    to: String,
    date: { type: Date, default: Date.now() },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
})

const ExchangeSchema = new mongoose.Schema({
    rates: [ ConversionSchema ],
    location: String
})

module.exports = {
    Exchange: mongoose.model('exchange', ExchangeSchema),
    Conversion: mongoose.model('conversion', ConversionSchema)
};