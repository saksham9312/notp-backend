const User = require("../../../modals/users");
const Client = require('../../../modals/clients');
const { sendMessage } = require("../../helper_functions/whatsapp");
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;
const domain = process.env.DOMAIN;
const crypto = require('crypto');
const LoginLog = require("../../../modals/loginLog");

module.exports.checkUser = async function(req,res){
    let {Body, From} = JSON.parse(decodeURIComponent(req.query.data));
    let splitMessage = Body.split('to ');
    let clientName = splitMessage[1].toLowerCase();
    let splitFrom = From.split('91');
    let userNum = splitFrom[1];
    console.log(From);

    try{
        let client = await Client.findOne({name: clientName}).populate('users').populate('config').populate('loginLog');
        try{
            let user = client.users.find((user) => user.phone == userNum);
            if(!user){
                clientName = clientName.toUpperCase()
                sendMessage(`Sorry\nYou are not registered on ${clientName}.\nPlease Register first`,From);
            }else{
                const originalString = `${clientName}&${userNum}&user`;
                const encryptedString = encrypt(originalString);
                let url = `${domain}/auth/${encryptedString}`;

                try{
                    let clientLoginLog = await LoginLog.find({clientID: client._id}).sort({ updatedAt: -1 }).exec();
                    let latestlog = clientLoginLog[0];
                    let currDate = new Date();
                    currDate = currDate.toLocaleDateString('en-GB');

                    if(clientLoginLog){
                        let latestLogDate = latestlog.date;
                        latestLogDate = latestLogDate.toLocaleDateString('en-GB');
                        if(latestLogDate == currDate){
                            try{
                                let result = await LoginLog.updateOne({_id: latestlog._id},{$inc:{hits: 1}});
                                await sendMessage(`Please continue on this link.\n${url}`,From);
                            }catch(err){
                                console.log("Error in updating hits: ",err);
                            }
                        }else{
                            try{
                                let newEntry = await LoginLog.create({
                                    clientID: client._id,
                                    date: new Date(),
                                    hits: 1
                                })
                                client.loginLog.push(newEntry._id);
                                await client.save();
                                await sendMessage(`Please continue on this link.\n${url}`,From);
                            }catch(err){
                                console.log("Error in creating new log entry: ",err);
                            }
                        }
                    }else{
                        try{
                            let newEntry = await LoginLog.create({
                                clientID: client._id,
                                date: new Date(),
                                hits: 1
                            })
                            client.loginLog.push(newEntry._id);
                            await client.save();
                            await sendMessage(`Please continue on this link.\n${url}`,From);
                        }catch(err){
                            console.log("Error in creating new log entry: ",err);
                        }
                    }
                }catch(err){
                    console.log("Error in finding log: ",err);
                }
            }
        }catch(err){
            console.log(err);
        }

    }catch(err){
        console.log(err);
    }
}

module.exports.registerUser = async function(req, res){
    let client_cred = req.params.credential;
    
    try{
        let client = await Client.findOne({apiKey: client_cred}).populate('users');
        try{
            let isUser = await client.users.find((user) => user.phone == req.body.phone);
            // let user = client.users.find((user) => user.phone == userNum);
            if(!isUser){
                let newUser = await User.create({
                    name: req.body.name,
                    email: req.body.email,
                    phone: req.body.phone,
                    clientID: client._id
                });
                client.users.push(newUser._id);
                await client.save();
                return res.json(200,{
                    success: true,
                    message: "User Registered",
                    user: newUser
                })
            }
        }catch(err){
            console.log(err);
            return res.json(409,{
                success: false,
                message: "User Already Registered",
            })
        }
    }catch(err){
        console.log(err);
        return res.json(404,{
            message: "Error in finding Client",
            error: err
        })
    }
}

function encrypt(text) {
    const cipher = crypto.createCipher('aes-256-cbc', secretKey);
    let encrypted = cipher.update(text, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

