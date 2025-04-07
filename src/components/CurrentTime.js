import React, { useEffect, useState } from "react";

export const CurrentTime = ({CurrentTime, date}) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const intervalId = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div>
            <p>{time.toLocaleTimeString()}</p>
        </div>
    );
}

export default CurrentTime;
