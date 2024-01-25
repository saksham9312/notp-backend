const Client = require('../modals/clients')
const jwt = require('jsonwebtoken');
const emailVerifyMailer = require('../mailers/email_verify_mailer');
const querystring = require('querystring');
const uuid = require("uuid");
const secretKey = process.env.JWT_SECRET;


module.exports.create = async function(req, res){
    try{
        let isClient = await Client.findOne({email: req.body.email});
        console.log(req.body);
        if(!isClient){
            let newClient = await Client.create({
                apiKey: uuid.v4(),
                name: req.body.name.toLowerCase(),
                email: req.body.email,
                contact: req.body.contact,
                country: req.body.country
            })
            console.log("Client Added in DB");
            // client = await Client.findOne({email: req.body.email});
            console.log(newClient);
            const data = {
              email: req.body.email,
              emailStatus: null // Placeholder value
          };
          const emailVerifyPromise = new Promise((resolve) => {
            emailVerifyMailer.emailVerify(newClient, newClient.apiKey, (success) => {
                console.log(success);
                data.emailStatus = success;
                resolve();
            });
        });
        await emailVerifyPromise;
        console.log(data);
        const queryParams = querystring.stringify(data);
        return res.redirect(`/client/email-sent?${queryParams}`);
        }else{
          console.log("Client already exists in DB!");
          return res.redirect('/client/signin');
        }

    }
    catch(err){
        console.log(err);
        return;
    }
}

module.exports.signup = function(req, res){

    return res.render('client_signup')
}

module.exports.emailSent = function(req, res){
  const email = req.query.email;
  const emailStatus = req.query.emailStatus;
  return res.render('email_confirmation',{
    email: email,
    emailStatus: emailStatus
  })
}

module.exports.signin = function(req, res){

  return res.render('client_login')
}

module.exports.emailVerify = async function(req,res){
  const credential = req.query.apiKey;
    try{
      
      const client = await Client.findOne({apiKey: credential});
      
      if(client){
        try{
          let updateClient = await Client.updateOne({_id: client._id},{$set:{verified: true}});
          return res.json(200, {
            success: true,
            message: "Email Verified."
          })
        }catch(err){
          console.log("Error in updating Email Verification Status: ",err);
          return res.json(500, {
            success: false,
            message: "Error in updating Email Verification Status"
          })
        }
      }else{
        return res.json(404, {
          success: false,
          message: "Client Not Found"
        })
      }
        
    }catch(err){
        console.log(err);
    }
}

module.exports.dashboardSetup = async function(req, res) {
  const token = req.query.token;
  try {
    jwt.verify(token, secretKey, async function(err, decoded) {
      if (err) {
        if (err instanceof jwt.TokenExpiredError) {
          return res.status(401).json({
            success: false,
            message: 'Token Expired!'
          });
        } else {
          return res.status(401).json({
            success: false,
            message: 'Token Invalid!'
          });
        }
      } else {
        console.log(decoded);
        // Fetch the client from the database using the decoded data
        try {
          let client = await Client.findOne({ email: decoded.email });
          if (!client) {
            // Handle client not found error
            return res.status(404).json({
              success: false,
              message: 'Client not found!'
            });
          }
          // Update the decoded object with the latest verified status
          decoded.verified = client.verified;

          return res.json({
            data: decoded,
            clientName: decoded.name.toUpperCase() 
          });
          // return res.render('dashboard_cred', { data: decoded, clientName: decoded.name.toUpperCase() });
        } catch (err) {
          console.log(err);
          return res.status(500).json({
            message: 'Internal Server Error'
          });
        }
      }
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: 'Internal Server Error'
    });
  }
};

module.exports.dashboardHistory = async function(req,res){

    const token = req.cookies.token;

    try{
      let decoded = jwt.verify(token,secretKey);
      try{
        let client = await Client.findOne({_id: decoded._id}).populate('users');
        console.log(client.users);
            return res.json(200,{
              userData: client.users,
              clientName: client.name
            });

      }catch(err){
        console.log("Error in finding users: ",err);
      }

    }catch(err){
      if(err instanceof jwt.TokenExpiredError){
        return res.json(401,{ //Render 401 page
          success: false,
          message: "Token Expired"
      })
    }else{
        console.log(err);
        return res.json(401,{ //Render 401 page
            success: false,
            message: "Token Invalid"
        })
    }
    }
}

module.exports.getoken = async function(req,res){
  const apiKey = req.params['apiKey'];

  try{
    const client = await Client.findOne({apiKey: apiKey});
    return res
  }catch(err){

  }
}  


