import { useState } from 'react'
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import TaskQueue from './pages/TaskQueue';
import './App.css'

const customTheme = createTheme({
	palette: {
		primary: {
			main: "#3513e1",
		},
	},
});

function App() {
	const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks'>('dashboard');
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<ThemeProvider theme={customTheme}>
			<div className="app">
				<Sidebar activeTab={activeTab} setActiveTab={setActiveTab} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
				<div className="main-content">
					<Header title={activeTab === 'dashboard' ? 'Dashboard' : 'Task Queue'} />
					{
						(() => {
							switch(activeTab) {
								case 'tasks':
									return <TaskQueue />;
								default:
									return <Dashboard setActiveTab={setActiveTab} />;
							}
						})()
					}
				</div>
			</div>
		</ThemeProvider>
	)
}

export default App
