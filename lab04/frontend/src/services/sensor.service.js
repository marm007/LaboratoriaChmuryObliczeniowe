import http from '../helpers/http-common';
import {config} from "../config";

class SensorService{
    getSensorInformation() {
        return http.get(`${config.apiUrl}`);
    }

    lastMeasurements(params = {}) {
        return http.get(`${config.apiUrl}/last`, {params});
    }

    averageMeasurementsFromDay(params = {}){
        return http.get(`${config.apiUrl}/day-average`, {params});
    }

    histogramDataFromToday(params = {}) {
        return http.get(`${config.apiUrl}/histogram-data`, {params});
    }

}

export default new SensorService();
