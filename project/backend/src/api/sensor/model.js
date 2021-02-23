const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const crossingSessions = new Schema({
    start_date: Date,
    end_date: Date,
    vm_name: String,
    red: [{
        sensor_id: String,
        date: Date,
        road_type: String,
        direction: String
    }]
});

const sensorInformations = new Schema({
    road_type: String,
    sensor_id: String,
    location: [],
    vm_name: String
});

const weatherDatas = new Schema({
    date: Date,
    sensor_id: String,
    location: [],
    temperature: Number,
    vm_name: String
});


const sessionModel = mongoose.model('crossing_sessions', crossingSessions);
const sensorModel = mongoose.model('sensor_informations', sensorInformations);
const weatherModel = mongoose.model('weather_datas', weatherDatas);

module.exports = { sessionModel, sensorModel, weatherModel };
