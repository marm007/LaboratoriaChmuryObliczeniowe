const path = require('path');
const merge = require('lodash/merge');

const config = {
    all: {
        env: process.env.NODE_ENV  || 'test',
        root: path.join(__dirname, '..'),
        port: 9000,
        ip: 'localhost',
        apiRoot: '/api',
        mongo: {
            options: {
                useCreateIndex: true,
                useNewUrlParser: true,
                useFindAndModify: false,
                useUnifiedTopology: true,
            }
        }
    },
    test: {
        mongo: {
            uri: process.env.MONGODB_URI_TEST,
            options: {
                debug: true
            }
        }
    },
    production: {
        ip: '0.0.0.0',
        port: process.env.PORT || 8080,
        mongo: {
            uri: process.env.MONGODB_URI
        }
    }
};

module.exports = merge(config.all, config[config.all.env]);
