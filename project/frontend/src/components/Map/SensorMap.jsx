import React, {useEffect, useState} from 'react';
import {Circle, MapContainer as LeafletMap, Marker, Popup, TileLayer} from 'react-leaflet';
import CanvasJSReact from '../../assets/canvasjs.react';
import SensorService from "../../services/sensor.service";
import Table from 'react-bootstrap/Table';
import Timer from "../Timer/Timer";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import CanvasJS from '../../assets/canvasjs.min'

const CanvasJSChart = CanvasJSReact.CanvasJSChart;


const generateColors = (max = 150) => {
    let colors = [];

    const r = Math.round(Math.random() * 255);
    const g = Math.round(Math.random() * 255);
    const b = Math.round(Math.random() * 255);
    colors.push(rgbToHex(r, g, b));

    return colors;
};

const componentToHex = (c) => {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
};

const rgbToHex = (r, g, b) => {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
};

const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

CanvasJS.addColorSet("drivingWaitingColorSet",
    ["#be3535", "#49de18"]);


export default function SensorMap() {

    const [colors, setColors] = useState(generateColors());

    const [allDataFetched, setAllDataFetched] = useState(false);

    const [vmNames, setVmNames] = useState([]);
    const [vmDict, setVmDict] = useState(new Map());
    const [sensorInformation, updateSensorInformation] = useState([]);

    const handleUpdateData = async (_vmDict = new Map()) => {

        if (_vmDict.size === 0)
            _vmDict = vmDict;

        let _tmp = new Map();

        for (const key of _vmDict.keys()) {
            const lastCrossingSession = await SensorService.getLastCrossingSession({vm_name: key})
            const crossingHistogramData = await SensorService.getHistogramDataFromCrossingSessions({vm_name: key})
            const temperatureHistogram = await SensorService.getAverageTemperatureFromDay({vm_name: key})

            _tmp.set(key, {
                lastCrossingSession: lastCrossingSession.data,
                crossingHistogramData: crossingHistogramData.data,
                temperatureHistogram: temperatureHistogram.data
            })
        }

        setVmDict(_tmp);
        setAllDataFetched(true)
    };

    useEffect(() => {
        async function fetchData() {
            const sensorInformation = await SensorService.getSensorInformation()

            let _vmDict = new Map()
            let _vmNames = []

            for (const sensor of sensorInformation.data) {
                if (!_vmDict.has(sensor.vm_name)) {
                    _vmDict.set(sensor.vm_name, {})
                    _vmNames.push(sensor.vm_name)
                }
            }

            await handleUpdateData(_vmDict);

            updateSensorInformation(sensorInformation.data);
            setVmNames(_vmNames)
        }

        fetchData()
    }, []);

    return (

        <div>
            <div>
                <Timer onTimerCountedDown={handleUpdateData}/>
                {sensorInformation.length > 0 && <LeafletMap center={sensorInformation[0].location} zoom={15}>
                    <TileLayer
                        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {allDataFetched && vmNames.length > 0 && vmDict.size > 0 && vmNames.map((_vmName, value) => {
                        {
                            if (vmDict.get(_vmName).lastCrossingSession === undefined ||
                                vmDict.get(_vmName).crossingHistogramData === undefined) {
                                return
                            }


                            const _sensors = sensorInformation.filter((_i) => _i.vm_name === _vmName);
                            let _midPoint = _sensors.reduce((a, b) => {
                                return {
                                    lat: (a.lat ? a.lat : a.location[0]) + b.location[0],
                                    lng: (a.lng ? a.lng : a.location[1]) + b.location[1]
                                }
                            });

                            _midPoint = {
                                lat: _midPoint.lat / _sensors.length,
                                lng: _midPoint.lng / _sensors.length
                            }

                            const _lSess = vmDict.get(_vmName).lastCrossingSession[0];

                            const carsDrivingAndWaiting = {
                                animationEnabled: true,
                                exportEnabled: false,
                                colorSet: "drivingWaitingColorSet",
                                theme: "light1", //"light1", "dark1", "dark2"
                                title: {
                                    text: "Cars driving and waiting"
                                },
                                axisY: {
                                    includeZero: true
                                },
                                data: [{
                                    legendText: "waiting",
                                    showInLegend: "true",
                                    type: "stackedColumn", //or stackedColumn
                                    indexLabelFontColor: "#5A5757",
                                    indexLabelPlacement: "outside",
                                    dataPoints: vmDict.get(_vmName).crossingHistogramData.map((_hData) => {
                                        return {label: _hData.label, y: _hData.red}
                                    })
                                },
                                    {
                                        legendText: "driving",
                                        showInLegend: "true",
                                        type: "stackedColumn", //change type to bar, line, area, pie, etc
                                        //indexLabel: "{y}", //Shows y value on all Data Points
                                        indexLabelFontColor: "#5A5757",
                                        indexLabelPlacement: "outside",
                                        dataPoints: vmDict.get(_vmName).crossingHistogramData.map((_hData) => {
                                            return {label: _hData.label, y: _hData.green}
                                        })
                                    }]
                            };

                            const temperatureTime = {
                                animationEnabled: true,
                                exportEnabled: false,
                                theme: "light1", //"light1", "dark1", "dark2"
                                title: {
                                    text: "Temperature and time"
                                },
                                axisY: {
                                    includeZero: true
                                },
                                data: [{
                                    type: "area", //change type to bar, line, area, pie, etc
                                    legendText: "time",
                                    showInLegend: "true",
                                    indexLabelFontColor: "#5A5757",
                                    indexLabelPlacement: "outside",
                                    dataPoints: vmDict.get(_vmName).crossingHistogramData.map((_hData) => {
                                        return {label: _hData.label, y: _hData.times / 1000}
                                    })
                                },
                                    {
                                        type: "area", //change type to bar, line, area, pie, etc
                                        legendText: "temperature",
                                        showInLegend: "true",
                                        indexLabelFontColor: "#5A5757",
                                        indexLabelPlacement: "outside",
                                        dataPoints: vmDict.get(_vmName).temperatureHistogram.map((_hData) => {
                                            return {label: _hData.label, y: _hData.avg_temperature}
                                        })
                                    }]
                            };


                            return <div>
                                <Circle
                                    center={_midPoint}
                                    fillColor="blue"
                                    radius={60}>
                                    <Popup minWidth="800">
                                        <Tabs defaultActiveKey="cars" id="uncontrolled-tab-example">
                                            <Tab eventKey="cars" title="Cars: red vs green">
                                                <CanvasJSChart options={carsDrivingAndWaiting}/>
                                            </Tab>
                                            <Tab eventKey="temperature-time" title="Temp vs time">
                                                <CanvasJSChart options={temperatureTime}/>
                                            </Tab>
                                        </Tabs>
                                    </Popup>
                                </Circle>
                                {_sensors
                                    .map((_information, index) => {

                                        let isRed = _lSess.red
                                            .filter((_s) => _s.sensor_id === _information.sensor_id).length > 0

                                        return <Marker position={_information.location} key={index}
                                                       icon={isRed ? redIcon : greenIcon}>
                                            <Popup minWidth="800">
                                                <div>
                                                    <Table striped bordered hover size="sm">
                                                        <thead>
                                                        <tr>
                                                            <th>Location</th>
                                                            <th>Start date</th>
                                                            <th>End date</th>
                                                            {isRed &&
                                                            <th>Number of cars waiting</th>}
                                                            {!isRed &&
                                                            <th>Number of cars passed</th>}
                                                        </tr>
                                                        </thead>
                                                        <tbody>
                                                        <tr>
                                                            <td><span
                                                                className="font-weight-bold">lat: </span>{_information.location[0]}
                                                                <span
                                                                    className="font-weight-bold">&nbsp;&nbsp;lng: </span>{_information.location[1]}
                                                            </td>
                                                            <td>{_lSess.start_date}</td>
                                                            <td>{_lSess.end_date}</td>
                                                            {isRed &&
                                                            <td>{_lSess.red.length}</td>}
                                                            {!isRed &&
                                                            <td>{_lSess.green.length}</td>}
                                                        </tr>
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    })
                                }

                            </div>
                        }
                    })}
                </LeafletMap>}
            </div>
            }
        </div>
    );
};
