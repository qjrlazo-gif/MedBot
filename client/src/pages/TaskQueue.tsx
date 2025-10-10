import { useState } from 'react';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HistoryIcon from '@mui/icons-material/History';

import { timeAgo } from '../utils/Utils';

type Task = {
	id: number;
	name: string;
	priority: 'Low' | 'Medium' | 'High';
	timeAdded: string;
};

type SortType = 'time' | 'priority';

function TaskQueue() {
	const [tasks, setTasks] = useState<Task[]>([
		{ id: 1, name: 'Deliver meds', priority: 'High', timeAdded: '2025-10-09 19:30' },
		{ id: 2, name: 'Collect vitals', priority: 'Medium', timeAdded: '2025-10-09 19:45' },
	]);
	const [sortBy, setSortBy] = useState<SortType>('time');
	const [showHistory, setShowHistory] = useState(false);

	const sortTasks = (tasks: Task[]): Task[] => {
		if (sortBy === 'time') return [...tasks].sort((a, b) => a.timeAdded.localeCompare(b.timeAdded));
		const priorityOrder = { High: 1, Medium: 2, Low: 3 } as const;
		return [...tasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
	};

	const pressIfSelected = (sortType: SortType) => (sortType === sortBy) ? "pressed" : "";

	return (
		<div className="page task-queue">
			<div className="controls">
				<h1>Sort by</h1>
				<button className={`sort-btn ${pressIfSelected('time')}`} onClick={() => setSortBy('time')}>Time Added</button>
				<button className={`sort-btn ${pressIfSelected('priority')}`} onClick={() => setSortBy('priority')}>Priority</button>
				<div className='spacer'></div>
				<button className='history-btn' onClick={() => setShowHistory(!showHistory)}>
					<HistoryIcon fontSize="medium" color='primary' />
				</button>
			</div>

			<div className='task-list'>
				{sortTasks(tasks).map((task) => (
					<div key={task.id} className='entry'>
						<div className='info'>
							<h1 className='name'>{task.name}</h1>
							<h4 className={`priority ${task.priority.toLowerCase()}`}>{`${task.priority} Priority`}</h4>
						</div>
						<h4 className='time'>{timeAgo(task.timeAdded)}</h4>
					</div>
					
				))}
			</div>

			{showHistory && <p className="history">History view (placeholder)</p>}
		</div>
	);
}

export default TaskQueue;