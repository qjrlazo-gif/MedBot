import MapContainer from '../components/MapContainer';
import BatteryWidget from '../components/BatteryWidget';
import TaskWidget from '../components/TaskWidget';


type DashboardProps = {
	setActiveTab: (tab: 'dashboard' | 'tasks') => void;
};

function Dashboard({ setActiveTab }: DashboardProps) {
	return (
		<div className="page dashboard">
			<MapContainer />
			<div className="row">
				<BatteryWidget />
				<TaskWidget setActiveTab={setActiveTab} />
			</div>
		</div>
	);
}

export default Dashboard;