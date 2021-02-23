const http = require('http');
const {env, port, ip, apiRoot, mongo} = require('./config');
const express = require('./services/express');
const api = require('./api');
const mongoose = require('./services/mongoose');
const app = express(apiRoot, api);
const server = http.createServer(app);

mongoose.connect(mongo.uri, {poolSize: 100});

setImmediate(function () {
  server.listen(port, ip, () => {
    console.log('Express server listening on http://%s:%d, in % mode', ip, port, env);
  })
});
