const Client = require('../../../modals/clients')
const Config = require('../../..//modals/config');

module.exports.setConfig = async function(req,res){

    let credential = req.query.credential;
    const {customDomain, redirectPage, expireAfter} = req.body;

    try{
        let client = await Client.findOne({apiKey: credential}).populate('config');
        let config = client.config
        if(client){
            if(config){
                config.customDomain = customDomain
                config.redirectPage = redirectPage
                config.expireAfter = expireAfter
                
                await config.save();
                client.config = config;
                await client.save();
            }else{
                let newConfig = await Config.create({
                    clientID: client._id,
                    customDomain: customDomain,
                    redirectPage: redirectPage,
                    expireAfter: expireAfter
                })
                client.config = newConfig._id;
                await client.save();
            }

            return res.status(200).json({ message: 'Configurations updated successfully' });
        }

    }catch(err){
        console.error('Error updating configuration:', err);
        return res.status(500).json({ error: 'An error occurred while updating the settings' });
    }
}

  


