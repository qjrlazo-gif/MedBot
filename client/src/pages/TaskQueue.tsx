import { useState } from 'react';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HistoryIcon from '@mui/icons-material/History';
import AddIcon from '@mui/icons-material/Add';
import StorageIcon from '@mui/icons-material/Storage';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import { timeAgo } from '../utils/Utils';
import TaskCreationModal from '../components/TaskCreationModal';
import DatabaseViewer from '../components/DatabaseViewer';
import { useAuth } from '../contexts/AuthContext';
import { FirestoreDB } from '../utils/firebaseUtils';
import { useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';

type Task = {
	id: string;
	name: string;
	priority: 'Low' | 'Medium' | 'High';
	timeAdded: string;
};

type SortType = 'time' | 'priority';
type SortDirection = 'asc' | 'desc';

function TaskQueue() {
	const { isAdmin } = useAuth();
	const [tasks, setTasks] = useState<Task[]>([]);
	const [loading, setLoading] = useState(true);
	const [sortBy, setSortBy] = useState<SortType>('time');
	const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
	const [showHistory, setShowHistory] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDatabaseViewerOpen, setIsDatabaseViewerOpen] = useState(false);
	const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
	const [isBulkMode, setIsBulkMode] = useState(false);

	// Real-time listener for tasks from Firebase
	useEffect(() => {
		console.log('Setting up real-time task listener...');
		
		const tasksQuery = query(collection(db, 'taskQueue'), orderBy('createdAt', 'desc'));
		
		const unsubscribe = onSnapshot(tasksQuery, 
			(snapshot) => {
				console.log('Task queue updated, received', snapshot.docs.length, 'tasks');
				console.log('Snapshot changes:', snapshot.docChanges());
				
				try {
					const firebaseTasks = snapshot.docs.map(doc => ({
						id: doc.id,
						...doc.data()
					} as any));
					
					console.log('Raw Firebase tasks:', firebaseTasks);
					
					// Convert Firebase tasks to our Task format and filter out completed tasks
					const formattedTasks: Task[] = firebaseTasks
						.filter(task => task.status !== 'completed') // Automatically remove completed tasks
						.map(task => ({
							id: task.id,
							name: task.name || 'Unnamed Task',
							priority: task.priority || 'Medium',
							timeAdded: task.timeAdded || task.createdAt || new Date().toISOString()
						}));
					
					console.log('Formatted tasks (excluding completed):', formattedTasks);
					console.log('Total tasks in Firestore:', firebaseTasks.length, 'Visible tasks:', formattedTasks.length);
					setTasks(formattedTasks);
					setLoading(false);
				} catch (error) {
					console.error('Error processing task updates:', error);
					setLoading(false);
				}
			},
			(error) => {
				console.error('Error listening to task queue:', error);
				setLoading(false);
				// Fallback to manual load if real-time fails
				loadTasksManually();
			}
		);

		// Cleanup listener on component unmount
		return () => {
			console.log('Cleaning up task listener...');
			unsubscribe();
		};
	}, []);

	// Fallback function to load tasks manually if real-time fails
	const loadTasksManually = async () => {
		try {
			console.log('Loading tasks manually...');
			const firebaseTasks = await FirestoreDB.getTaskQueue();
			const formattedTasks: Task[] = firebaseTasks.map(task => ({
				id: task.id,
				name: task.name || 'Unnamed Task',
				priority: task.priority || 'Medium',
				timeAdded: task.timeAdded || new Date().toISOString()
			}));
			setTasks(formattedTasks);
		} catch (error) {
			console.error('Error loading tasks manually:', error);
		}
	};

	const sortTasks = (tasks: Task[]): Task[] => {
		if (sortBy === 'time') {
			// Sort by time added
			const sorted = [...tasks].sort((a, b) => {
				const timeComparison = a.timeAdded.localeCompare(b.timeAdded);
				return sortDirection === 'desc' ? -timeComparison : timeComparison;
			});
			return sorted;
		}
		
		// Sort by priority (High, Medium, Low)
		const priorityOrder = { High: 1, Medium: 2, Low: 3 } as const;
		return [...tasks].sort((a, b) => {
			const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
			// If same priority, sort by time
			if (priorityDiff === 0) {
				const timeComparison = a.timeAdded.localeCompare(b.timeAdded);
				const timeResult = sortDirection === 'desc' ? -timeComparison : timeComparison;
				return timeResult;
			}
			return sortDirection === 'desc' ? priorityDiff : -priorityDiff;
		});
	};

	const pressIfSelected = (sortType: SortType) => (sortType === sortBy) ? "pressed" : "";
	
	const handleSortChange = (sortType: SortType) => {
		if (sortBy === sortType) {
			// If clicking the same button, toggle the direction
			setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
		} else {
			// If clicking a different button, switch to that sort type
			setSortBy(sortType);
			setSortDirection('desc'); // Default to descending
		}
	};

	const handleTaskSubmit = async (taskData: any) => {
		try {
			console.log('Adding task with data:', taskData);
			
			const taskToAdd = {
				name: `Deliver ${taskData.selectedSupplies.join(', ')} to ${taskData.destinationRooms.join(', ')}`,
				priority: (taskData.priority === 'URGENT' ? 'High' : taskData.priority === 'NORMAL' ? 'Medium' : 'Low') as 'Low' | 'Medium' | 'High',
				timeAdded: new Date().toISOString(),
				createdAt: new Date().toISOString(),
				source: { x: 0, y: 0 },
				destination: { x: 100, y: 100 },
				status: 'in-queue' as const
			};
			
			console.log('Task to add:', taskToAdd);
			
			const taskId = await FirestoreDB.addTaskToQueue(taskToAdd);
			console.log('Task added with ID:', taskId);

			if (taskId) {
				console.log('Task added successfully, real-time listener will update UI');
				// Real-time listener will automatically update the UI
				// No need to manually update local state
			} else {
				console.error('Task ID not returned from addTaskToQueue');
				alert('Failed to add task - no ID returned');
			}
		} catch (error) {
			console.error('Error adding task:', error);
			console.error('Error details:', error);
			alert(`Failed to add task: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	};

	const handleDeleteTask = async (taskId: string) => {
		if (window.confirm('Are you sure you want to delete this task?')) {
			try {
				const success = await FirestoreDB.deleteTaskFromQueue(taskId);
				if (success) {
					// Real-time listener will automatically update the UI
					setSelectedTasks(prev => prev.filter(id => id !== taskId));
					console.log('Task deleted successfully, real-time listener will update UI');
				} else {
					alert('Failed to delete task. Please try again.');
				}
			} catch (error) {
				console.error('Error deleting task:', error);
				alert('Failed to delete task. Please try again.');
			}
		}
	};

	const handleBulkDelete = async () => {
		if (selectedTasks.length === 0) return;
		
		const confirmMessage = `Are you sure you want to delete ${selectedTasks.length} task(s)?`;
		if (window.confirm(confirmMessage)) {
			try {
				const deletePromises = selectedTasks.map(taskId => 
					FirestoreDB.deleteTaskFromQueue(taskId)
				);
				
				const results = await Promise.all(deletePromises);
				const successCount = results.filter(result => result).length;
				
				if (successCount === selectedTasks.length) {
					// Real-time listener will automatically update the UI
					setSelectedTasks([]);
					setIsBulkMode(false);
					alert(`Successfully deleted ${successCount} task(s).`);
					console.log('Bulk delete completed, real-time listener will update UI');
				} else {
					alert(`Failed to delete some tasks. ${successCount}/${selectedTasks.length} deleted.`);
				}
			} catch (error) {
				console.error('Error bulk deleting tasks:', error);
				alert('Failed to delete tasks. Please try again.');
			}
		}
	};

	const handleSelectTask = (taskId: string) => {
		setSelectedTasks(prev => 
			prev.includes(taskId) 
				? prev.filter(id => id !== taskId)
				: [...prev, taskId]
		);
	};

	const handleSelectAll = () => {
		if (selectedTasks.length === tasks.length) {
			setSelectedTasks([]);
		} else {
			setSelectedTasks(tasks.map(task => task.id));
		}
	};

	const toggleBulkMode = () => {
		setIsBulkMode(!isBulkMode);
		setSelectedTasks([]);
	};

	return (
		<div className="page task-queue">
			<div className="controls">
				<h1>Sort by</h1>
				<button 
					className={`sort-btn ${pressIfSelected('time')}`} 
					onClick={() => handleSortChange('time')}
					title={`Sort by time ${sortBy === 'time' ? `(${sortDirection === 'desc' ? 'newest first' : 'oldest first'})` : ''}`}
				>
					<AccessTimeIcon fontSize="small" style={{ marginRight: '8px' }} />
					Time Added
					{sortBy === 'time' && (
						sortDirection === 'desc' ? 
							<ArrowDownwardIcon fontSize="small" style={{ marginLeft: '8px' }} /> :
							<ArrowUpwardIcon fontSize="small" style={{ marginLeft: '8px' }} />
					)}
				</button>
				<button 
					className={`sort-btn ${pressIfSelected('priority')}`} 
					onClick={() => handleSortChange('priority')}
					title={`Sort by priority ${sortBy === 'priority' ? `(${sortDirection === 'desc' ? 'High to Low' : 'Low to High'})` : ''}`}
				>
					<TrendingUpIcon fontSize="small" style={{ marginRight: '8px' }} />
					Priority
					{sortBy === 'priority' && (
						sortDirection === 'desc' ? 
							<ArrowDownwardIcon fontSize="small" style={{ marginLeft: '8px' }} /> :
							<ArrowUpwardIcon fontSize="small" style={{ marginLeft: '8px' }} />
					)}
				</button>
				<div className='spacer'></div>
				<button className='add-task-btn' onClick={() => setIsModalOpen(true)}>
					<AddIcon fontSize="small" />
					<span>Add Task</span>
				</button>
				<button className='history-btn' onClick={() => setShowHistory(!showHistory)}>
					<HistoryIcon fontSize="medium" color='primary' />
				</button>
				{isAdmin && (
					<button className='database-btn' onClick={() => setIsDatabaseViewerOpen(true)}>
						<StorageIcon fontSize="medium" color='primary' />
					</button>
				)}
				<button 
					className={`bulk-mode-btn ${isBulkMode ? 'active' : ''}`} 
					onClick={toggleBulkMode}
					title={isBulkMode ? 'Exit bulk delete mode' : 'Enter bulk delete mode'}
				>
					{isBulkMode ? 'Exit Bulk' : 'Bulk Delete'}
				</button>
				{isBulkMode && (
					<>
						<button 
							className='select-all-btn' 
							onClick={handleSelectAll}
							title={selectedTasks.length === tasks.length ? 'Deselect all' : 'Select all'}
						>
							{selectedTasks.length === tasks.length ? 'Deselect All' : 'Select All'}
						</button>
						<button 
							className={`bulk-delete-btn ${selectedTasks.length === 0 ? 'disabled' : ''}`}
							onClick={handleBulkDelete}
							disabled={selectedTasks.length === 0}
							title={selectedTasks.length === 0 ? 'Select tasks to delete' : `Delete ${selectedTasks.length} selected task(s)`}
						>
							Delete Selected ({selectedTasks.length})
						</button>
					</>
				)}
			</div>

			<div className='task-list'>
				{loading ? (
					<div className="loading-container">
						<div className="loading-spinner"></div>
						<p>Loading tasks...</p>
					</div>
				) : tasks.length === 0 ? (
					<div className="empty-state">
						<p>No tasks in queue. Click "Add Task" to create your first task!</p>
					</div>
				) : (
					sortTasks(tasks).map((task) => (
						<div key={task.id} className={`entry ${isBulkMode ? 'bulk-mode' : ''} ${selectedTasks.includes(task.id) ? 'selected' : ''}`}>
							{isBulkMode && (
								<input
									type="checkbox"
									checked={selectedTasks.includes(task.id)}
									onChange={() => handleSelectTask(task.id)}
									className="task-checkbox"
								/>
							)}
							<div className='info'>
								<h1 className='name'>{task.name}</h1>
								<h4 className={`priority ${task.priority.toLowerCase()}`}>{`${task.priority} Priority`}</h4>
							</div>
							<div className='task-actions'>
								<h4 className='time'>{timeAgo(task.timeAdded)}</h4>
								{!isBulkMode && (
									<button 
										className='delete-task-btn' 
										onClick={() => handleDeleteTask(task.id)}
										title="Delete task"
									>
										🗑️
									</button>
								)}
							</div>
						</div>
					))
				)}
			</div>

			{showHistory && <p className="history">History view (placeholder)</p>}
			
			<TaskCreationModal 
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSubmit={handleTaskSubmit}
			/>
			
			{isAdmin && (
				<DatabaseViewer
					isOpen={isDatabaseViewerOpen}
					onClose={() => setIsDatabaseViewerOpen(false)}
				/>
			)}
		</div>
	);
}

export default TaskQueue;