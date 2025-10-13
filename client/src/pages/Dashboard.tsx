import MapContainer from '../components/MapContainer';
import BatteryWidget from '../components/BatteryWidget';
import TaskWidget from '../components/TaskWidget';
import RobotStatusWidget from '../components/RobotStatusWidget';
import RobotSimulationControl from '../components/RobotSimulationControl';


type DashboardProps = {
	setActiveTab: (tab: 'dashboard' | 'tasks') => void;
};

function Dashboard({ setActiveTab }: DashboardProps) {
	return (
		<div className="page dashboard">
			<div className="row">
				<BatteryWidget />
				<TaskWidget setActiveTab={setActiveTab} />
			</div>
			<MapContainer />
			<RobotStatusWidget />
			<RobotSimulationControl />
		</div>
	);
}

export default Dashboard;