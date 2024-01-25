const Client = require("../modals/clients");
const Token = require('../modals/tokens');
const twilio = require("twilio");
const WA = require("../controllers/helper_functions/whatsapp");
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;
const domain = process.env.DOMAIN;
const algorithm = process.env.ALGORITHM;
const crypto = require('crypto');
const mongoose = require('mongoose');
const { ObjectId } = require("mongodb");
const User = require("../modals/users");


function decrypt(encryptedText) {
    // Decrypt the encrypted text
    const decipher = crypto.createDecipher('aes-256-cbc', secretKey);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
}


module.exports.handleToken = async function(req,res){
    const encryptedKey = req.params['redirectKey'];
    let decryptedKey = decrypt(encryptedKey);
    decryptedKey = decryptedKey.split('&');
    const clientName = decryptedKey[0];
    const contact = decryptedKey[1];
    const entity = decryptedKey[2];
    
    if(entity == 'client' && clientName == "swiftauth"){
        try{
            let client = await Client.findOne({ contact: contact });
            
            try{
                if(client.token){
                    let isTokenValid = jwt.verify(client.token, secretKey);
                    if(client && isTokenValid){
                        const url = `${domain}/client/dashboard/setup`;
                        res.clearCookie('token');
                        res.cookie('token', client.token, {
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production', // Set to true if using HTTPS in production
                            sameSite: 'None', // Set to 'None' for cross-site cookies
                            domain: 'https://216b-43-230-106-13.ngrok-free.app',
                            path: '/app/dashboard' 
                        });
                        return res.json(200,{message: "HI"});
                        // return res.redirect(`https://216b-43-230-106-13.ngrok-free.app/app/dashboard?token=${client.token}`);
                    }
                }else{
                    const newToken = await generateAndSaveToken(client,'client','1d')
                    // const url = `${domain}/client/dashboard/setup`;
                    // res.clearCookie('token');
                    // res.cookie('token', newToken, { httpOnly: true });
                    return res.redirect(`https://216b-43-230-106-13.ngrok-free.app/app/dashboard?token=${newToken}`);
                }
            }catch(err){
                if(err instanceof jwt.TokenExpiredError){
                    const newToken = generateAndSaveToken(client,'client','1d');
                    // const url = `${domain}/client/dashboard/setup`;
                    // res.cookie('token', newToken, { httpOnly: true });
                    return res.redirect(`https://216b-43-230-106-13.ngrok-free.app/app/dashboard?token=${newToken}`);
                }else{
                    console.log(err);
                    return res.json(401,{ //Render 401 page
                        success: false,
                        message: "Token Invalid"
                    })
                }
            }
        }catch(err){
            console.log("Error in finding client in Redirect URL: ",err)
        }
    }else if(entity=='user'){
        try{
            let client = await Client.findOne({name: clientName}).populate('users').populate('config');
     
            try{
                console.log(client.users.id);
                let user = await client.users.find((user) => user.phone == contact);
                console.log(user._id);
                try{
                    // let newToken = await User.findById(user._id).populate('tokens')
                    let userTokens = await Token.find({userID: user._id}).sort({ updatedAt: -1 }).exec();
                    let latestToken = userTokens[0];
                    if(userTokens.length>0){
                        try{
                            const isTokenValid = jwt.verify(latestToken.key,secretKey);
                            if(isTokenValid){
                                let url = `${client.config.customDomain}${client.config.redirectPage}`;
                                const tokenObj = {
                                    date: new Date(),
                                    key: latestToken.key,
                                    userID: user._id
                                }
                                let result = await Token.updateOne({_id: latestToken._id},{$set: tokenObj});
                                res.clearCookie('token');
                                res.cookie('token', tokenObj.key, { httpOnly: true });
                                updateSuccessfulHit(client);
                                updateLoginData(user);
                                return res.redirect(url);
                            }
                        }catch(err){
                            if(err instanceof jwt.TokenExpiredError){
                                const tokenObj = await generateAndSaveToken(user,'user',client.config.expireAfter);
                                let result = await Token.updateOne({_id: latestToken._id},{$set: tokenObj});

                                let url = `${client.config.customDomain}${client.config.redirectPage}`;
                                res.clearCookie('token');
                                res.cookie('token', tokenObj.key, { httpOnly: true });
                                updateSuccessfulHit(client);
                                updateLoginData(user);
                                return res.redirect(url);
                            }else{
                                console.log(err);
                                return res.json(401,{ //Render 401 page
                                    success: false,
                                    message: "Token Invalid"
                                })
                            }

                        }
                    }else{
                        const tokenObj = await generateAndSaveToken(user,'user',client.config.expireAfter);
                        try{
                            let newTokenEntry = await Token.create(tokenObj);
                            let url = `${client.config.customDomain}${client.config.redirectPage}`
                            res.clearCookie('token');
                            res.cookie('token', newTokenEntry, { httpOnly: true });
                            updateSuccessfulHit(client);
                            updateLoginData(user);
                            return res.redirect(url);
                        }catch(err){
                            console.log("Error in adding token for user",err);
                        }
                    }

                }catch(err){
                    console.log("Error in finding latest token: ",err);
                }

            }catch(err){
                console.log("Error in finding User in Redirect URL: ", err)
            }

        }catch(err){
            console.log("Error in finding Client in Redirect URL: ", err)
        }

    }

}

async function generateAndSaveToken(obj,entity,expireAfter){
    const newToken = jwt.sign(obj.toJSON(), secretKey, { expiresIn: expireAfter });

    if(entity == 'client'){
        obj.token = newToken;
        await obj.save();
        return newToken;
    }else if(entity == 'user'){
        const tokenObj = {
            date: new Date(),
            key: newToken,
            userID: obj._id
        }
        return tokenObj;
    }
}

async function updateSuccessfulHit(client){
    try{
        let updateSuccessfulHit = await Client.updateOne({_id: client._id},{$inc:{successHits: 1}});
    }catch(err){
        console.log("Error in incrementing Successful Hit: ",err);
    }
}

async function updateLoginData(user){
    try{
        let change = {
            lastLogin: new Date(),
            loginVia: 'Whatsapp'
        }
        let updatedUser = await User.updateOne({_id: user._id},{$set: change})
    }catch(err){
        console.log("Error in updating login details: ",err);
    }
}