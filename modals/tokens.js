const { Timestamp } = require("mongodb");
const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
    date:{
        type: Date,
        required: true,
    },
    key: {
        type: String,
        required: true,
        unique: true
    },
    userID: {
        type:  mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
}, {
    timestamps: true
});

const Token = mongoose.model('Token', tokenSchema);
module.exports = Token;
