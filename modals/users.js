const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: Number,
        required: true,
        unique: true
    },
    loginVia: {
        type: String
    },
    tokens: [
        {
            type:  mongoose.Schema.Types.ObjectId,
            ref: 'Token'
        }
    ],
    lastLogin:{
        type: Date
    },
    clientID: {
        type:  mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);
module.exports = User;
