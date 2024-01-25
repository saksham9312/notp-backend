const express = require('express');
const router = express.Router();
const homeController = require('../controllers/home_controller');
const tokenController = require('../controllers/token_controller')
console.log('router exported!');

router.get('/', homeController.home);
router.use('/client', require('./client'));
router.use('/incoming', require('./incoming'));
// router.use('/post', require('./post'));
// router.use('/comment', require('./comment'));
router.use('/api', require('./api'));
router.get('/auth/:redirectKey', tokenController.handleToken);
module.exports = router;