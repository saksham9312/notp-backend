const Client = require("../modals/clients");
const twilio = require("twilio");
const WA = require("../controllers/helper_functions/whatsapp");
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;
const domain = process.env.DOMAIN;
const crypto = require('crypto');
const LoginLog = require("../modals/loginLog");

module.exports.checkClient = async function (req, res) {
  let message = req.body;
  let { Body, From } = req.body;
  let splitMessage = Body.split("to ");
  // console.log(From);

  try {
    try {
      var clientName = splitMessage[1].toLowerCase();
    } catch (err) {
      if (err.name === "TypeError") {
        await WA.sendMessage(`Invalid Response. Please Try Again!`, From);
        return;
      }
    }

    if (clientName == "swiftauth") {

      let clientNum = From.split("+91");
      let client = await Client.findOne({ contact: clientNum[1] });
      console.log(client);
      if(client){
        const originalString = `${clientName}&${clientNum[1]}&client`;
        const encryptedString = encrypt(originalString);
        let url = `${domain}/${encryptedString}`;
        await WA.sendMessage(`Please continue on this link.\n${url}`,From);
      }

    } else {
      //for API
      let client = await Client.findOne({ name: clientName });
      // console.log(client);
      if (!client) {
        await WA.sendMessage(
          `${splitMessage[1]} is not Registered with us.`,
          From
        );
      } else if (client) {
        const encodedData = encodeURIComponent(JSON.stringify(message));
        //change the url later
        res.redirect(307, "/api/v1/process?data=" + encodedData);
      } else {
        await WA.sendMessage(`Invalid Response`, From);
      }
    }
  } catch (err) {
    console.log("Error in finding client in DB", err);
  }
};


function encrypt(text) {
  const cipher = crypto.createCipher('aes-256-cbc', secretKey);
  let encrypted = cipher.update(text, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}