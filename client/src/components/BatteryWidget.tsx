import { useEffect, useState } from 'react';

function BatteryWidget() {
	const [battery, setBattery] = useState<number>(0);

	useEffect(() => {
		const randomBattery = Math.floor(Math.random() * 101);
		setBattery(randomBattery);
	}, []);

	const getBatteryColor = (level: number): string => {
		if (level >= 71) return 'green';
		if (level >= 31) return 'yellow';
		if (level >= 16) return 'orange';
		return 'red';
	};

	return (
		<div className={`widget dark battery-widget ${getBatteryColor(battery)}`}>
			<h1>Battery Level</h1>
			<p>{battery}%</p>
		</div>
		);
	}

export default BatteryWidget;