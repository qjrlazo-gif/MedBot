import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FirestoreDB } from '../utils/firebaseUtils';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';

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

function RobotSimulationControl() {
  const { isAdmin } = useAuth();
  const [_tasks, setTasks] = useState<Task[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(3000);
  const [_currentTask, setCurrentTask] = useState<Task | null>(null);
  const tasksRef = useRef<Task[]>([]);
  const currentTaskRef = useRef<Task | null>(null);

  // Real-time listener for tasks
  useEffect(() => {
    console.log('RobotSimulationControl: Setting up real-time task listener...');
    
    const tasksQuery = query(collection(db, 'taskQueue'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(tasksQuery, 
      (snapshot) => {
        console.log('RobotSimulationControl: Task queue updated, received', snapshot.docs.length, 'tasks');
        try {
          const firebaseTasks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as any));
          
          const formattedTasks: Task[] = firebaseTasks.map(task => ({
            id: task.id,
            name: task.name || 'Unnamed Task',
            priority: task.priority || 'Medium',
            timeAdded: task.timeAdded || task.createdAt || new Date().toISOString(),
            status: task.status || 'in-queue',
            robotStatus: task.robotStatus,
            progress: task.progress,
            updatedAt: task.updatedAt
          }));
          
          setTasks(formattedTasks);
          tasksRef.current = formattedTasks;
          
          if (currentTaskRef.current) {
            const updatedCurrentTask = formattedTasks.find(task => task.id === currentTaskRef.current!.id);
            if (updatedCurrentTask) {
              setCurrentTask(updatedCurrentTask);
              currentTaskRef.current = updatedCurrentTask;
            }
          }
        } catch (error) {
          console.error('RobotSimulationControl: Error processing task updates:', error);
        }
      },
      (error) => {
        console.error('RobotSimulationControl: Error listening to task queue:', error);
      }
    );

    return () => {
      console.log('RobotSimulationControl: Cleaning up task listener...');
      unsubscribe();
    };
  }, []);

  // Update task status
  const updateTaskStatus = async (taskId: string, status: Task['status'], robotStatus?: string, progress?: number) => {
    try {
      const updatedAt = new Date().toISOString();
      const success = await FirestoreDB.updateTaskInQueue(taskId, {
        status,
        robotStatus,
        progress,
        updatedAt
      });
      
      if (success) {
        setTasks(prev => {
          const updatedTasks = prev.map(task => 
            task.id === taskId 
              ? { ...task, status, robotStatus, progress, updatedAt }
              : task
          );
          tasksRef.current = updatedTasks;
          return updatedTasks;
        });
        
        console.log(`Task ${taskId} updated to ${status} with robot status: ${robotStatus}`);
      }
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  // Simulate robot working on a task
  const simulateTask = async (task: Task) => {
    const initialCurrentTask = {
      ...task,
      status: 'in-progress' as const,
      robotStatus: 'Starting delivery...',
      progress: 0,
      updatedAt: new Date().toISOString()
    };
    setCurrentTask(initialCurrentTask);
    currentTaskRef.current = initialCurrentTask;
    
    await updateTaskStatus(task.id, 'in-progress', 'Starting delivery...', 0);
    
    // Small delay to ensure the update is processed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const steps = [
      { status: 'Navigating to source location...', progress: 20 },
      { status: 'Collecting supplies...', progress: 40 },
      { status: 'Loading supplies onto robot...', progress: 60 },
      { status: 'Navigating to destination...', progress: 80 },
      { status: 'Delivering supplies...', progress: 95 }
    ];
    
    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, simulationSpeed));
      await updateTaskStatus(task.id, 'in-progress', step.status, step.progress);
    }
    
    await new Promise(resolve => setTimeout(resolve, simulationSpeed));
    await updateTaskStatus(task.id, 'completed', 'Delivery completed successfully!', 100);
    
    setCurrentTask(null);
    currentTaskRef.current = null;
  };

  // Main simulation loop
  useEffect(() => {
    if (!isSimulating) return;
    
    let isActive = true;
    
    const simulationLoop = async () => {
      while (isSimulating && isActive) {
        const pendingTasks = tasksRef.current.filter(task => (task.status || 'in-queue') === 'in-queue');
        
        if (pendingTasks.length > 0) {
          const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
          const sortedTasks = pendingTasks.sort((a, b) => {
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) {
              return priorityDiff;
            }
            return new Date(a.timeAdded).getTime() - new Date(b.timeAdded).getTime();
          });
          
          const nextTask = sortedTasks[0];
          console.log('Selected next task based on priority:', nextTask.name, 'Priority:', nextTask.priority);
          await simulateTask(nextTask);
        } else {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    };
    
    simulationLoop();
    
    return () => {
      isActive = false;
    };
  }, [isSimulating, simulationSpeed]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="robot-simulation-control">
      <div className="simulation-header">
        <h3>Robot Simulation</h3>
        <div className="simulation-status">
          <div className={`status-indicator ${isSimulating ? 'active' : 'inactive'}`}></div>
          <span>{isSimulating ? 'Robot is working...' : 'Robot is idle'}</span>
        </div>
      </div>
      
      <div className="simulation-controls">
        <button 
          className={`simulation-btn ${isSimulating ? 'stop' : 'start'}`}
          onClick={() => setIsSimulating(!isSimulating)}
        >
          {isSimulating ? '🛑 Stop Simulation' : '▶️ Start Simulation'}
        </button>
        
        <div className="speed-control">
          <label htmlFor="simulation-speed">Speed:</label>
          <select 
            id="simulation-speed"
            value={simulationSpeed}
            onChange={(e) => setSimulationSpeed(Number(e.target.value))}
            disabled={isSimulating}
          >
            <option value={1000}>Fast (1s)</option>
            <option value={3000}>Normal (3s)</option>
            <option value={5000}>Slow (5s)</option>
            <option value={10000}>Very Slow (10s)</option>
          </select>
        </div>
      </div>
      
    </div>
  );
}

export default RobotSimulationControl;
