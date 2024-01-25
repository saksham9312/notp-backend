const express = require('express');
const router = express.Router();
const processController = require('../../../controllers/api/v1/process_controller');
const configController = require('../../../controllers/api/v1/config_controller')
const statsController = require('../../../controllers/api/v1/stats_controller')

//JWT Authenticate for Client
router.post('/process', processController.checkUser)
//Check if Credentials are valid or not
router.post('/register/:credential', processController.registerUser)
router.put('/business/config', configController.setConfig);
router.get('/stats',statsController.getStats)
module.exports = router;