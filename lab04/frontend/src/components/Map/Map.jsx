import React, {useEffect, useState} from 'react';
import {Circle, MapContainer as LeafletMap, Marker, Popup, TileLayer} from 'react-leaflet';
import CanvasJSReact from '../../assets/canvasjs.react';
import SensorService from "../../services/sensor.service";
import Table from 'react-bootstrap/Table';
import Timer from "../Timer/Timer";

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

const options = {
    animationEnabled: true,
    exportEnabled: true,
    theme: "light2", //"light1", "dark1", "dark2"
    title: {
        text: "PM10 histogram"
    },
    axisY: {
        includeZero: true
    }
};


const generateColors = (max = 150) => {

    let colors = [];
    let aR = 255, aG = 0, aB = 0;
    let bR = 0, bG = 255, bB = 0;

    for (let i = 0; i < max; i++) {
        const value = (i / max);
        const r = Math.round((bR - aR) * value + aR);
        const g = Math.round((bG - aG) * value + aG);
        const b = Math.round((bB - aB) * value + aB);
        colors.push(rgbToHex(r, g, b));
    }


    return colors;
};

const componentToHex = (c) => {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
};

const rgbToHex = (r, g, b) => {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
};


export default function Map() {

    const [colors, setColors] = useState(generateColors());

    const [allDataFetched, setAllDataFetched] = useState(false);

    const [sensorInformation, updateSensorInformation] = useState([]);
    const [sensorData, updateSensorData] = useState([]);
    const [sensorAverageData, updateSensorAverageData] = useState([]);
    const [sensorHistogramData, updateSensorHistogramData] = useState([]);

    const handleUpdateData = () => {
        SensorService.averageMeasurementsFromDay({sensors: true})
            .then((res) => {
                updateSensorAverageData(res.data);

                SensorService.lastMeasurements({number: 22})
                    .then((res) => {
                        updateSensorData(res.data);
                        SensorService.histogramDataFromToday({doubleGroup: true})
                            .then((res) => {
                                updateSensorHistogramData(res.data);
                            })
                            .catch((err) => {
                                console.log(err);
                            })
                    })
                    .catch((err) => {
                        console.log(err);
                    });

            })
            .catch((err) => {
                console.log(err);
            });
    };

    useEffect(() => {
        SensorService.getSensorInformation()
            .then((res) => {
                updateSensorInformation(res.data);

                SensorService.averageMeasurementsFromDay({sensors: true})
                    .then((res) => {
                        updateSensorAverageData(res.data);

                        SensorService.lastMeasurements({number: 22})
                            .then((res) => {
                                updateSensorData(res.data);
                                SensorService.histogramDataFromToday({doubleGroup: true})
                                    .then((res) => {
                                        updateSensorHistogramData(res.data);
                                        setAllDataFetched(true);
                                    })
                                    .catch((err) => {
                                        console.log(err);
                                    })
                            })
                            .catch((err) => {
                                console.log(err);
                            });

                    })
                    .catch((err) => {
                        console.log(err);
                    });

            })
            .catch((err) => {
                console.log(err);
            });

        console.log("mounted")
    }, []);

    return (

        <div>
            {allDataFetched &&
            <div>
                <Timer onTimerCountedDown={handleUpdateData}/>
                {sensorData.length > 0 && <LeafletMap center={sensorData[0].Location} zoom={15}>
                    {sensorInformation.length > 0 && sensorInformation.map((_information, index) => {
                        const _sensorAverageData = sensorAverageData.filter((_data) => _data._id === _information.Sensor_Name)[0];
                        const _sensorHistogramData = sensorHistogramData.filter((_data) => _data._id === _information.Sensor_Name)[0];

                        const _color = _sensorAverageData ? colors[Math.round(_sensorAverageData.avg_pm10)] : colors[0];

                        const _data = [{
                            type: "column", //change type to bar, line, area, pie, etc
                            //indexLabel: "{y}", //Shows y value on all Data Points
                            indexLabelFontColor: "#5A5757",
                            indexLabelPlacement: "outside",
                            dataPoints: _sensorHistogramData.hours.map((_hData) => {
                                return {label: _hData.label, y: _hData.avg_pm10}
                            })
                        }];
                        console.log(_data);
                        const _histogramOptions = {...options, data: _data};


                        return <Circle key={index} center={[_information.Lat, _information.Lng]}
                                       radius={_information.Radius * 1000} color={_color}>
                            <Popup minWidth="800">
                                <Table striped bordered hover size="sm">
                                    <thead>
                                    <tr>
                                        <th>Sensor name</th>
                                        <th>Average Pm10</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    <tr>
                                        <td>{_information.Sensor_Name}</td>
                                        <td>{_sensorAverageData.avg_pm10}</td>
                                    </tr>
                                    </tbody>
                                </Table>
                                <CanvasJSChart options={_histogramOptions}/>
                            </Popup>
                        </Circle>
                    })}

                    <TileLayer
                        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {sensorData.length > 0 && sensorData.map((_sensorData, index) => {
                        return <Marker position={_sensorData.Location} key={index}>
                            <Popup minWidth="800">
                                <Table striped bordered hover size="sm">
                                    <thead>
                                    <tr>
                                        <th>Location</th>
                                        <th>Date</th>
                                        <th>Temperature</th>
                                        <th>Humidity</th>
                                        <th>Pm10</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    <tr>
                                        <td><span className="font-weight-bold">lat: </span>{_sensorData.Location[0]}
                                            <span
                                                className="font-weight-bold">&nbsp;&nbsp;lng: </span>{_sensorData.Location[1]}
                                        </td>
                                        <td>{_sensorData.Date}</td>
                                        <td>{_sensorData.Temperature}</td>
                                        <td>{_sensorData.Humidity}</td>
                                        <td>{_sensorData.Pm10}</td>
                                    </tr>
                                    </tbody>
                                </Table>
                            </Popup>
                        </Marker>
                    })}

                </LeafletMap>}
            </div>
            }
        </div>
    );
};
