import http from '../helpers/http-common';
import {config} from "../config";

class SensorService{
    getSensorInformation() {
        return http.get(`${config.apiUrl}`);
    }

    getLastCrossingSession(params = {}) {
        return http.get(`${config.apiUrl}/crossing/last`, {params});
    }

    getLastWeatherConditions(params = {}){
        return http.get(`${config.apiUrl}/weather/last`, {params});
    }

    getAverageTemperatureFromDay(params = {}) {
        return http.get(`${config.apiUrl}/weather/average`, {params});
    }

    getHistogramDataFromCrossingSessions(params = {}) {
        return http.get(`${config.apiUrl}/crossing/histogram-data`, {params});
    }



}

export default new SensorService();
