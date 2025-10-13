import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebaseConfig';

type TaskWidgetProps = {
	setActiveTab: (tab: 'dashboard' | 'tasks') => void;
};

interface Task {
	id: string;
	name: string;
	priority: 'Low' | 'Medium' | 'High';
	timeAdded: string;
	status?: 'in-queue' | 'in-progress' | 'completed';
	robotStatus?: string;
	progress?: number;
	updatedAt?: string;
}

function TaskWidget({ setActiveTab }: TaskWidgetProps) {
	const [currentTask, setCurrentTask] = useState<Task | null>(null);
	const [loading, setLoading] = useState(true);

	// Real-time listener for current task
	useEffect(() => {
		console.log('TaskWidget: Setting up real-time listener for current task...');
		
		// Listen to all tasks and filter for in-progress ones
		const tasksQuery = query(collection(db, 'taskQueue'));
		
		const unsubscribe = onSnapshot(tasksQuery, 
			(snapshot) => {
				console.log('TaskWidget: Received', snapshot.docs.length, 'total tasks');
				
				try {
					// Filter for in-progress tasks and get the most recent one
					const inProgressTasks = snapshot.docs
						.map(doc => ({
							id: doc.id,
							...doc.data()
						} as Task))
						.filter(task => task.status === 'in-progress')
						.sort((a, b) => {
							const aTime = new Date(a.updatedAt || a.timeAdded).getTime();
							const bTime = new Date(b.updatedAt || b.timeAdded).getTime();
							return bTime - aTime; // Most recent first
						});
					
					if (inProgressTasks.length > 0) {
						const latestTask = inProgressTasks[0];
						console.log('TaskWidget: Current task updated:', latestTask);
						setCurrentTask(latestTask);
					} else {
						console.log('TaskWidget: No current task');
						setCurrentTask(null);
					}
					setLoading(false);
				} catch (error) {
					console.error('TaskWidget: Error processing task updates:', error);
					setLoading(false);
				}
			},
			(error) => {
				console.error('TaskWidget: Error listening to current task:', error);
				setLoading(false);
			}
		);

		return () => {
			console.log('TaskWidget: Cleaning up listener...');
			unsubscribe();
		};
	}, []);

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'in-progress': return '#3b82f6';
			case 'completed': return '#10b981';
			default: return '#6b7280';
		}
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case 'High': return '#ef4444';
			case 'Medium': return '#f59e0b';
			case 'Low': return '#10b981';
			default: return '#f59e0b';
		}
	};

	return (
		<div className="widget task-widget" onClick={() => setActiveTab('tasks')}>
			<h1>Current Task</h1>
			{loading ? (
				<p>Loading...</p>
			) : currentTask ? (
				<div className="current-task-info">
					<p className="task-name">{currentTask.name}</p>
					<div className="task-tags">
						<span 
							className="status-tag"
							style={{ backgroundColor: getStatusColor(currentTask.status || 'in-queue') }}
						>
							{(currentTask.status || 'in-queue').replace('-', ' ').toUpperCase()}
						</span>
						<span 
							className="priority-tag"
							style={{ backgroundColor: getPriorityColor(currentTask.priority) }}
						>
							{currentTask.priority.toUpperCase()}
						</span>
					</div>
					{currentTask.robotStatus && (
						<p className="robot-status">{currentTask.robotStatus}</p>
					)}
					{currentTask.progress !== undefined && (
						<div className="progress-section">
							<div className="progress-bar">
								<div 
									className="progress-fill"
									style={{ width: `${currentTask.progress}%` }}
								></div>
							</div>
						</div>
					)}
				</div>
			) : (
				<p>No active task</p>
			)}
		</div>
	);
}

export default TaskWidget;