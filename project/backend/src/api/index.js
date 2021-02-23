const {Router} = require('express');
const _ = require('lodash');

const sensor = require('./sensor');

const router = new Router();

router.use('/', sensor);

router.use((req, res, next) => res.status(404).send({errors: ['Routing not found']}));

module.exports = router;
