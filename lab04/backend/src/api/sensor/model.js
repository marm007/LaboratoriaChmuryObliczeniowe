const mongoose = require('mongoose');
const {formatDate} = require('../../services/helpers');

const Schema = mongoose.Schema;

const sensorSchema = new Schema({
    Sensor_ID: String,
    Date: Date,
    Humidity: Number,
    Temperature: Number,
    Pm10: Number,
    Location: [Number]
});

const sensorInformationSchema = new Schema({
   Sensor_Name: String,
   Lat: Number,
   Lng: Number,
   Radius: Number
});


sensorSchema.methods = {

    view(full) {
        let view = {};
        let fields = ['Sensor_ID', 'Date', 'Humidity', 'Temperature', 'Pm10', 'Location'];

        if(full)
            fields = ['id', ...fields];

        fields.forEach((field) => {
            view[field] = this[field];
        });

        if(view['Date'])
            view['Date'] = formatDate(view['Date']);

        return view;
    }
};

const model = mongoose.model('sensor_datas', sensorSchema);
const sensorInformationModel = mongoose.model('sensor_informations', sensorInformationSchema);

module.exports = { model, sensorSchema, sensorInformationModel, sensorInformationSchema };
