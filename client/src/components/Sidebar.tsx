import DashboardIcon from '@mui/icons-material/Dashboard';
import ViewListIcon from '@mui/icons-material/ViewList';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

type Tabs = 'dashboard' | 'tasks';

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
		</nav>
	</div>
	);
};


export default Sidebar;