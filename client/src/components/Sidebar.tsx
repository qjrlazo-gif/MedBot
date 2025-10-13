import DashboardIcon from '@mui/icons-material/Dashboard';
import ViewListIcon from '@mui/icons-material/ViewList';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpIcon from '@mui/icons-material/Help';
import LogoutIcon from '@mui/icons-material/Logout';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

type Tabs = 'dashboard' | 'tasks' | 'settings' | 'help' | 'logout';

type SidebarProps = {
	activeTab: Tabs;
	setActiveTab: (tab: Tabs) => void;
	sidebarOpen: boolean;
	setSidebarOpen: (open: boolean) => void;
};

function Sidebar({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }: SidebarProps) {
	const getIcon = (icon: Tabs) => {
		switch(icon) {
			case 'dashboard':
				return <DashboardIcon fontSize='large' />;
			case 'tasks':
				return <ViewListIcon fontSize='large' />;
			case 'settings':
				return <SettingsIcon fontSize='large' />;
			case 'help':
				return <HelpIcon fontSize='large' />;
			case 'logout':
				return <LogoutIcon fontSize='large' />;
			default:
				return <ErrorOutlineIcon fontSize='large' />
		}
	}
	const getTabDisplay = (name: string, icon: Tabs) => {
		return (
			<div className='tab-full'>
				{getIcon(icon)}
				{(() => {if (sidebarOpen) return <h1 className='name'>{name}</h1>})()}
			</div>
		)
	};
	return (
	<div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`} onMouseEnter={() => setSidebarOpen(true)} onMouseLeave={() => setSidebarOpen(false)}>
		<nav className='sidebar-content'>
			<button onClick={() => setActiveTab('dashboard')} className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}>
				{getTabDisplay("Dashboard", 'dashboard')}
			</button>
			<button onClick={() => setActiveTab('tasks')} className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}>
				{getTabDisplay("Task Queue", 'tasks')}
			</button>
			{/* Hidden sidebar items - Robot Map, Monitoring, Reports */}
			<div className="sidebar-separator"></div>
			{/* Hidden admin items - Admin Panel, Robot Simulator */}
			<button onClick={() => setActiveTab('settings')} className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}>
				{getTabDisplay("Settings", 'settings')}
			</button>
			<button onClick={() => setActiveTab('help')} className={`tab-btn ${activeTab === 'help' ? 'active' : ''}`}>
				{getTabDisplay("Help", 'help')}
			</button>
			<button onClick={() => setActiveTab('logout')} className={`tab-btn ${activeTab === 'logout' ? 'active' : ''}`}>
				{getTabDisplay("Log out", 'logout')}
			</button>
		</nav>
	</div>
	);
};


export default Sidebar;