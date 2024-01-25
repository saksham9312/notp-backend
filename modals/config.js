const mongoose = require("mongoose");

const configSchema = new mongoose.Schema({
    clientID: {
        type:  mongoose.Schema.Types.ObjectId,
        ref: 'Client'
    },
    customDomain: {
        type: String,
        required: true
    },
    redirectPage: {
        type: String,
        required: true
    },
    expireAfter:{
        type: String,
        default: '1d'
    }

});

const Config = mongoose.model('Config', configSchema);
module.exports = Config;
