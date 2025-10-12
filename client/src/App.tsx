import { useState } from 'react'
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import Register from './components/Register';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import TaskQueue from './pages/TaskQueue';
import RobotMap from './pages/RobotMap';
import Monitoring from './pages/Monitoring';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Help from './pages/Help';
import Admin from './pages/Admin';
import RobotSimulator from './pages/RobotSimulator';
import './App.css'

const customTheme = createTheme({
	palette: {
		primary: {
			main: "#3513e1",
		},
	},
});

function AppContent() {
	const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'robot-map' | 'monitoring' | 'reports' | 'settings' | 'help' | 'logout' | 'admin' | 'robot-simulator'>('dashboard');
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const { userProfile, logout } = useAuth();

	// Handle logout tab
	if (activeTab === 'logout') {
		logout();
		setActiveTab('dashboard');
		return null;
	}

	return (
		<div className="app">
			<Sidebar 
				activeTab={activeTab} 
				setActiveTab={setActiveTab} 
				sidebarOpen={sidebarOpen} 
				setSidebarOpen={setSidebarOpen}
				userProfile={userProfile}
			/>
			<div className="main-content">
				<Header 
					title={(() => {
						switch(activeTab) {
							case 'dashboard': return 'Dashboard';
							case 'tasks': return 'Task Queue';
							case 'robot-map': return 'Robot Map';
							case 'monitoring': return 'Monitoring';
							case 'reports': return 'Reports';
							case 'settings': return 'Settings';
							case 'help': return 'Help';
							case 'admin': return 'Admin Panel';
							case 'robot-simulator': return 'Robot Simulator';
							default: return 'Dashboard';
						}
					})()}
					userProfile={userProfile}
					onLogout={logout}
				/>
				{
					(() => {
						switch(activeTab) {
							case 'tasks':
								return <ProtectedRoute><TaskQueue /></ProtectedRoute>;
							case 'robot-map':
								return <ProtectedRoute><RobotMap /></ProtectedRoute>;
							case 'monitoring':
								return <ProtectedRoute><Monitoring /></ProtectedRoute>;
							case 'reports':
								return <ProtectedRoute><Reports /></ProtectedRoute>;
							case 'settings':
								return <ProtectedRoute><Settings /></ProtectedRoute>;
							case 'help':
								return <ProtectedRoute><Help /></ProtectedRoute>;
							case 'admin':
								return <ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>;
							case 'robot-simulator':
								return <ProtectedRoute requiredRole="admin"><RobotSimulator /></ProtectedRoute>;
							default:
								return <ProtectedRoute><Dashboard setActiveTab={setActiveTab} /></ProtectedRoute>;
						}
					})()
				}
			</div>
		</div>
	);
}

function AuthWrapper() {
	const { currentUser, loading } = useAuth();
	const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

	if (loading) {
		return (
			<div className="loading-screen">
				<div className="loading-spinner"></div>
				<p>Loading...</p>
			</div>
		);
	}

	if (!currentUser) {
		return authMode === 'login' ? 
			<Login onSwitchToRegister={() => setAuthMode('register')} /> :
			<Register onSwitchToLogin={() => setAuthMode('login')} />;
	}

	return <AppContent />;
}

function App() {
	return (
		<ThemeProvider theme={customTheme}>
			<AuthProvider>
				<AuthWrapper />
			</AuthProvider>
		</ThemeProvider>
	)
}

export default App
