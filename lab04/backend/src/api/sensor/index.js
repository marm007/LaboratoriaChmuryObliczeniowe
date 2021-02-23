const {Router} = require('express');
const {get, getLastMeasurements, getAverageFromDay, prepareDataToHistogram} = require('./controller');

const router = new Router();

router.get('/',
    get);

router.get('/last',
    getLastMeasurements);

router.get('/day-average',
    getAverageFromDay);

router.get('/histogram-data',
    prepareDataToHistogram);

module.exports = router;
