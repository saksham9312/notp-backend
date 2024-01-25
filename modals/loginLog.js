const { Timestamp } = require("mongodb");
const mongoose = require("mongoose");

const loginlogSchema = new mongoose.Schema({
    date:{
        type: Date,
        required: true,
        unique: true
    },
    hits: {
        type: Number,
        required: true,
    },
    clientID: {
        type:  mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
}, {
    timestamps: true
});

const LoginLog = mongoose.model('LoginLog', loginlogSchema);
module.exports = LoginLog;
