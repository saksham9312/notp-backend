const Client = require('../../../modals/clients')
const secretKey = process.env.JWT_SECRET;


module.exports.getStats = async function(req,res){
    const credential = req.query.credential;
    try{
        let client = await Client.findOne({apiKey: credential}).populate('users').populate('loginLog');

        const totalUsers = client.users.length;
        const totalHits = client.loginLog.reduce((sum,obj) => sum + obj.hits,0);
        const successhitperc = Math.round((client.successHits / totalHits) * 100);
        const loginPlatform = client.users.loginVia;
        return res.json(200,{
            success: true,
            totalUsers: totalUsers,
            totalHits: totalHits,
            successhitperc: successhitperc,
            unsuccesshitperc: 100-successhitperc,
            usageData: client.loginLog,
            platformCategory: loginPlatform
        })
    }catch(err){
        console.log(err);
        return res.json(500,{
            success: false,
            errorMsg: "Error in finding total users"
        })
    }
}