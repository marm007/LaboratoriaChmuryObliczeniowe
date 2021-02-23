const {success, notFound} = require('../../services/response');
const Sensor = require('./model').model;
const SensorInformation = require('./model').sensorInformationModel;
const moment = require('moment');
const {formatDate} = require('../../services/helpers');

const get = ({query}, res, next) => {
    SensorInformation.find({})
        .then(notFound(res))
        .then(success(res))
        .catch(next);
};

const getLastMeasurements = ({query}, res, next) => {
    const numberOfMeasurements = query.number ? parseInt(query.number) : 10;
    const values = query.values ? query.values : ['Sensor_ID', 'Temperature', 'Humidity', 'Pm10', 'Location', 'Date'];


    Sensor.find({}, values).sort('-Date').limit(numberOfMeasurements)
        .then(notFound(res))
        .then((sensorData) => sensorData.map((sensorData) => sensorData.view(false)))
        .then(success(res))
        .catch(next);

};

const getAverageFromDay = ({query}, res, next) => {
    let today = null;
    const values = query.values ? query.values : ['Temperature', 'Humidity', 'Pm10'];
    const sensors = query.sensors;

    if (query.day) {
        const userKeyRegExp = /^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$/;
        if (!userKeyRegExp.test(query.day)) {
            return res.status(400).json({error: 'Date must be in format: YYYY-MM-DD'}).end();
        }
        today = new Date(query.day)
    } else {
        today = moment().startOf('day').toDate();
    }

    let groupBy = {_id: "All sensors"};

    if(sensors)
        groupBy = {_id: "$Sensor_ID"};

    if (values.indexOf('Temperature') > -1)
        groupBy ={...groupBy, avg_temperature: {$avg: "$Temperature"}};

    if (values.indexOf('Humidity') > -1)
        groupBy = {...groupBy, avg_humidity: {$avg: "$Humidity"}};

    if (values.indexOf('Pm10') > -1)
        groupBy = {...groupBy, avg_pm10: {$avg: "$Pm10"}};

    Sensor.aggregate([
        {
            $match: {
                "Date": {
                    "$gte": new Date(today.setHours(0, 0, 0)),
                    "$lt": new Date(today.setHours(23, 59, 59))
                }
            }
        },
        {
            $group: groupBy
        }


    ])
        .then(notFound(res))
        .then((res) => {
            return res.map(sensor => {
                return {...sensor, data: formatDate(today).split(" ")[0]}
            });
        })
        .then(success(res))
        .catch(next);
};

const prepareDataToHistogram = ({query}, res, next) => {
    const today = moment().startOf('day').toDate();
    const sensorID = query.sensorId;
    const doubleGroup = query.doubleGroup;

    const match = {
        "Date": {
            "$gte": new Date(today.setHours(0, 0, 0)),
            "$lt": new Date(today.setHours(23, 59, 59))
        }
    };

    if (sensorID)
        match.Sensor_ID = Array.isArray(sensorID) ? sensorID[0] : sensorID;

    if (!doubleGroup) {
        Sensor.aggregate([
            {
                $match: match
            },
            {
                $group: {
                    _id: {$hour: "$Date"},
                    count: {$sum: 1},
                    avg_temperature: {$avg: "$Temperature"},
                    avg_humidity: {$avg: "$Humidity"},
                    avg_pm10: {$avg: "$Pm10"},
                }
            },
            {
                $sort: {"_id": 1}
            }])
            .then((sensorData) => sensorData.map(data => {
                const label = data._id.toString() + "-" + (data._id + 1).toString();
                data = {label, ...data};
                return data;
            }))
            .then(success(res))
            .catch(next)
    } else {
        Sensor.aggregate([
            {
                $match: match
            },
            {
                $group: {
                    _id: {hour: {$hour: "$Date"}, sensor: "$Sensor_ID"},
                    count: {$sum: 1},
                    avg_temperature: {$avg: "$Temperature"},
                    avg_humidity: {$avg: "$Humidity"},
                    avg_pm10: {$avg: "$Pm10"},
                }
            },
            {
                $group: {
                    _id: "$_id.sensor",
                    hours: {
                        $push: {
                            hour: "$_id.hour",
                            count: "$count",
                            avg_temperature: "$avg_temperature",
                            avg_humidity: "$avg_humidity",
                            avg_pm10: "$avg_pm10",
                        },
                    }
                }
            },
            {
                $sort: {"_id": 1}
            }])
            .then((sensorData) => sensorData.map(data => {
                data.hours = data.hours.map((_hour) => {
                    const label = _hour.hour.toString() + "-" + (_hour.hour + 1).toString();
                    _hour = {label, ..._hour};
                    return _hour;
                });

                data.hours = data.hours.sort((a, b) => {
                    if (a.hour < b.hour)
                        return -1;
                    else if (a.hour > b.hour)
                        return 1;
                    return 0;
                });

                return data;
            }))
            .then(success(res))
            .catch(next)
    }

};

module.exports = {get, getLastMeasurements, getAverageFromDay, prepareDataToHistogram};
