import React, {useEffect, useState} from 'react';
import Alert from "react-bootstrap/Alert";

const moment = require('moment');


export default function Timer(props) {
    const timePeriod = 10; // co 10 sekund
    const calculateTimeLeft = () => {
        let now = new Date();
        let difference = updateTime - now;
        if (difference < 0) {
            let _updateTime = moment().add(timePeriod+1, 'seconds').toDate();
            setUpdateTime(_updateTime);
            let now = new Date();
            let difference = _updateTime - now;
            props.onTimerCountedDown();
            return moment(difference).get('seconds');
        }
        return moment(difference).get('seconds');
    };

    const [updateTime, setUpdateTime] = useState(moment().add(timePeriod, 'seconds').toDate());
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());


    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());

        }, 1000);

        return () => clearTimeout(timer);
    });

    return (
        <span className="text-center mt-2 mr-2 ml-auto fixed-top timer-container">
            <Alert variant="info" style={{color: "#000000"}}>
                {timeLeft === 0 ? "Updating..." : timeLeft}
            </Alert>
        </span>
    )
}
