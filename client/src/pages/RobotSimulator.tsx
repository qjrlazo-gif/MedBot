import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FirestoreDB } from '../utils/firebaseUtils';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './RobotSimulator.css';

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

const RobotSimulator: React.FC = () => {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [simulationSpeed, setSimulationSpeed] = useState(3000); // 3 seconds default
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [selectedCompletedTasks, setSelectedCompletedTasks] = useState<string[]>([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const tasksRef = useRef<Task[]>([]);
  const currentTaskRef = useRef<Task | null>(null);

  // Real-time listener for tasks from Firebase (same as TaskQueue)
  const setupTaskListener = () => {
    console.log('Setting up real-time task listener in Robot Simulator...');
    
    const tasksQuery = query(collection(db, 'taskQueue'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(tasksQuery, 
      (snapshot) => {
        console.log('Robot Simulator: Task queue updated, received', snapshot.docs.length, 'tasks');
        try {
          const firebaseTasks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as any));
          
          // Convert Firebase tasks to our Task format with default status
          const formattedTasks: Task[] = firebaseTasks.map(task => ({
            id: task.id,
            name: task.name || 'Unnamed Task',
            priority: task.priority || 'Medium',
            timeAdded: task.timeAdded || task.createdAt || new Date().toISOString(),
            status: task.status || 'in-queue',
            robotStatus: task.robotStatus, // Keep existing robot status
            progress: task.progress, // Keep existing progress
            updatedAt: task.updatedAt // Keep existing update time
          }));
          
          console.log('Robot Simulator: Formatted tasks:', formattedTasks);
          
          // Check for abandoned tasks (in-progress for more than 5 minutes)
          const abandonedTasks = formattedTasks.filter(task => {
            if (task.status === 'in-progress' && task.updatedAt) {
              const updatedTime = new Date(task.updatedAt).getTime();
              const currentTime = new Date().getTime();
              const timeDiff = currentTime - updatedTime;
              return timeDiff > 5 * 60 * 1000; // 5 minutes in milliseconds
            }
            return false;
          });

          // Auto-complete abandoned tasks
          abandonedTasks.forEach(async (task) => {
            console.log('Auto-completing abandoned task:', task.id);
            await FirestoreDB.updateTaskInQueue(task.id, {
              status: 'completed',
              robotStatus: 'Task completed automatically (was abandoned)',
              progress: 100
            });
          });
          
          setTasks(formattedTasks);
          tasksRef.current = formattedTasks; // Update ref
          
          // Update currentTask if it exists and matches a task in the updated list
          if (currentTaskRef.current) {
            const updatedCurrentTask = formattedTasks.find(task => task.id === currentTaskRef.current!.id);
            if (updatedCurrentTask) {
              console.log('Updating currentTask from real-time listener:', updatedCurrentTask);
              setCurrentTask(updatedCurrentTask);
              currentTaskRef.current = updatedCurrentTask;
            }
          }
          
          setLoading(false);
        } catch (error) {
          console.error('Robot Simulator: Error processing task updates:', error);
          setLoading(false);
        }
      },
      (error) => {
        console.error('Robot Simulator: Error listening to task queue:', error);
        setLoading(false);
        setError('Failed to connect to task queue');
      }
    );

    return unsubscribe;
  };

  // Update task status
  const updateTaskStatus = async (taskId: string, status: Task['status'], robotStatus?: string, progress?: number) => {
    try {
      const success = await FirestoreDB.updateTaskInQueue(taskId, {
        status,
        robotStatus,
        progress
      });
      
      if (success) {
        // Update local state
        setTasks(prev => {
          const updatedTasks = prev.map(task => 
            task.id === taskId 
              ? { ...task, status, robotStatus, progress, updatedAt: new Date().toISOString() }
              : task
          );
          tasksRef.current = updatedTasks; // Update ref
          return updatedTasks;
        });

        // Note: currentTask will be updated by the real-time listener
        
        console.log(`Task ${taskId} updated to ${status} with robot status: ${robotStatus}`);
      }
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };


  // Simulate robot working on a task
  const simulateTask = async (task: Task) => {
    // Set current task with initial robot status
    const initialCurrentTask = {
      ...task,
      status: 'in-progress' as const,
      robotStatus: 'Starting delivery...',
      progress: 0,
      updatedAt: new Date().toISOString()
    };
    setCurrentTask(initialCurrentTask);
    currentTaskRef.current = initialCurrentTask;
    
    // Start task
    await updateTaskStatus(task.id, 'in-progress', 'Starting delivery...', 0);
    
    // Simulate progress steps
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
    
    // Complete task
    await new Promise(resolve => setTimeout(resolve, simulationSpeed));
    await updateTaskStatus(task.id, 'completed', 'Delivery completed successfully!', 100);
    
    setCurrentTask(null);
    currentTaskRef.current = null;
  };

  // Main simulation loop
  useEffect(() => {
    if (!isSimulating) return;
    
    let isActive = true; // Flag to control the loop
    
    const simulationLoop = async () => {
      while (isSimulating && isActive) {
        // Find next pending task with priority-based selection
        const pendingTasks = tasksRef.current.filter(task => (task.status || 'in-queue') === 'in-queue');
        
        if (pendingTasks.length > 0) {
          // Sort by priority (High -> Medium -> Low) and then by timeAdded (oldest first)
          const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
          const sortedTasks = pendingTasks.sort((a, b) => {
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) {
              return priorityDiff; // Higher priority first
            }
            // If same priority, sort by timeAdded (oldest first)
            return new Date(a.timeAdded).getTime() - new Date(b.timeAdded).getTime();
          });
          
          const nextTask = sortedTasks[0];
          console.log('Selected next task based on priority:', nextTask.name, 'Priority:', nextTask.priority, 'Added:', nextTask.timeAdded);
          await simulateTask(nextTask);
        } else {
          // No pending tasks, wait and check again
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
        // Real-time listener will automatically update tasks
        // No need to manually reload since we have real-time updates
      }
    };
    
    simulationLoop();
    
    // Cleanup function
    return () => {
      isActive = false;
    };
  }, [isSimulating, simulationSpeed]); // Removed 'tasks' from dependencies

  // Set up real-time task listener on component mount
  useEffect(() => {
    const unsubscribe = setupTaskListener();
    
    // Cleanup listener on component unmount
    return () => {
      console.log('Robot Simulator: Cleaning up task listener...');
      unsubscribe();
    };
  }, []);

  // Get status color for display
  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'in-queue': return '#f59e0b';
      case 'in-progress': return '#3b82f6';
      case 'completed': return '#10b981';
      default: return '#6b7280';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    return priority === 'URGENT' ? '#ef4444' : '#6b7280';
  };

  // Filter tasks based on current view
  const getActiveTasks = () => {
    return tasks.filter(task => {
      // Exclude completed tasks
      if (task.status === 'completed') return false;
      
      // Exclude the currently processing task (show only in Currently Processing section)
      if (currentTask && task.id === currentTask.id) return false;
      
      return true;
    });
  };

  const getCompletedTasks = () => {
    return tasks.filter(task => task.status === 'completed');
  };

  // Manually complete an in-progress task
  const handleCompleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to manually complete this task?')) {
      try {
        console.log('Manually completing task:', taskId);
        await FirestoreDB.updateTaskInQueue(taskId, {
          status: 'completed',
          robotStatus: 'Task completed manually',
          progress: 100
        });
        console.log('Task completed successfully');
      } catch (error) {
        console.error('Error completing task:', error);
        alert('Failed to complete task. Please try again.');
      }
    }
  };

  // Delete completed task permanently
  const handleDeleteCompletedTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to permanently delete this completed task? This action cannot be undone.')) {
      try {
        console.log('Deleting completed task:', taskId);
        await FirestoreDB.deleteTaskFromQueue(taskId);
        console.log('Completed task deleted successfully');
      } catch (error) {
        console.error('Error deleting completed task:', error);
        alert('Failed to delete completed task. Please try again.');
      }
    }
  };

  // Bulk delete functions for completed tasks
  const handleSelectCompletedTask = (taskId: string) => {
    setSelectedCompletedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAllCompletedTasks = () => {
    const completedTasks = getCompletedTasks();
    if (selectedCompletedTasks.length === completedTasks.length) {
      setSelectedCompletedTasks([]);
    } else {
      setSelectedCompletedTasks(completedTasks.map(task => task.id));
    }
  };

  const handleBulkDeleteCompletedTasks = async () => {
    if (selectedCompletedTasks.length === 0) return;

    const confirmMessage = `Are you sure you want to permanently delete ${selectedCompletedTasks.length} completed task(s)? This action cannot be undone.`;
    if (window.confirm(confirmMessage)) {
      try {
        console.log('Bulk deleting completed tasks:', selectedCompletedTasks);
        let successCount = 0;
        
        for (const taskId of selectedCompletedTasks) {
          try {
            await FirestoreDB.deleteTaskFromQueue(taskId);
            successCount++;
          } catch (error) {
            console.error(`Error deleting task ${taskId}:`, error);
          }
        }

        if (successCount === selectedCompletedTasks.length) {
          console.log('All completed tasks deleted successfully');
          alert(`Successfully deleted ${successCount} completed task(s).`);
        } else {
          console.log(`Partial deletion: ${successCount}/${selectedCompletedTasks.length} deleted`);
          alert(`Deleted ${successCount}/${selectedCompletedTasks.length} completed task(s). Some deletions may have failed.`);
        }

        setSelectedCompletedTasks([]);
        setIsBulkMode(false);
      } catch (error) {
        console.error('Error bulk deleting completed tasks:', error);
        alert('Failed to delete completed tasks. Please try again.');
      }
    }
  };

  const toggleBulkMode = () => {
    setIsBulkMode(!isBulkMode);
    setSelectedCompletedTasks([]);
  };

  // Debug currentTask changes
  useEffect(() => {
    console.log('Current task updated:', currentTask);
  }, [currentTask]);

  if (!isAdmin) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You need admin privileges to access the robot simulator.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading robot simulator...</p>
      </div>
    );
  }

  return (
    <div className="robot-simulator">
      <div className="simulator-header">
        <h1>Robot Simulator</h1>
        <p>Simulate robot delivery operations and monitor task progress</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      <div className="simulator-controls">
        <div className="control-group">
          <button 
            className={`simulator-btn ${isSimulating ? 'stop' : 'start'}`}
            onClick={() => setIsSimulating(!isSimulating)}
          >
            {isSimulating ? '🛑 Stop Simulation' : '▶️ Start Simulation'}
          </button>
          
          <div className="speed-control">
            <label htmlFor="simulation-speed">Simulation Speed:</label>
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

        <div className="status-indicator">
          <div className={`status-light ${isSimulating ? 'active' : 'inactive'}`}></div>
          <span>{isSimulating ? 'Robot is working...' : 'Robot is idle'}</span>
        </div>
      </div>

      {currentTask && (
        <div className="current-task">
          <h3>Currently Processing:</h3>
          <div className="task-card current">
            <div className="task-header">
              <h4>{currentTask.name}</h4>
              <span className={`priority ${currentTask.priority.toLowerCase()}`}>
                {currentTask.priority}
              </span>
            </div>
            <div className="task-details">
              <p><strong>Task:</strong> {currentTask.name}</p>
              <p><strong>Priority:</strong> {currentTask.priority}</p>
              <p><strong>Robot Status:</strong> {currentTask.robotStatus || 'Processing...'}</p>
            </div>
            {currentTask.progress !== undefined && (
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${currentTask.progress}%` }}
                ></div>
                <span className="progress-text">{currentTask.progress}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="tasks-section">
        <h2>Task Queue ({tasks.filter(t => t.status !== 'completed').length} active)</h2>
        <div className="task-stats">
          <div className="stat">
            <span className="stat-number" style={{ color: getStatusColor('in-queue') }}>
              {tasks.filter(t => (t.status || 'in-queue') === 'in-queue').length}
            </span>
            <span className="stat-label">In Queue</span>
          </div>
          <div className="stat">
            <span className="stat-number" style={{ color: getStatusColor('in-progress') }}>
              {tasks.filter(t => t.status === 'in-progress').length}
            </span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat">
            <span className="stat-number" style={{ color: getStatusColor('completed') }}>
              {tasks.filter(t => t.status === 'completed').length}
            </span>
            <span className="stat-label">Completed</span>
          </div>
        </div>

        <div className="task-controls">
          <button 
            className={`view-toggle-btn ${showCompletedTasks ? 'active' : ''}`}
            onClick={() => setShowCompletedTasks(!showCompletedTasks)}
          >
            {showCompletedTasks ? '📋 Active Tasks' : '✅ Completed Tasks'}
          </button>

          {/* Bulk delete controls - only show when viewing completed tasks */}
          {showCompletedTasks && (
            <>
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
                    onClick={handleSelectAllCompletedTasks}
                    title={selectedCompletedTasks.length === getCompletedTasks().length ? 'Deselect all' : 'Select all'}
                  >
                    {selectedCompletedTasks.length === getCompletedTasks().length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button 
                    className={`bulk-delete-btn ${selectedCompletedTasks.length === 0 ? 'disabled' : ''}`}
                    onClick={handleBulkDeleteCompletedTasks}
                    disabled={selectedCompletedTasks.length === 0}
                    title={selectedCompletedTasks.length === 0 ? 'No tasks selected' : `Delete ${selectedCompletedTasks.length} selected task(s)`}
                  >
                    🗑️ Delete Selected ({selectedCompletedTasks.length})
                  </button>
                </>
              )}
            </>
          )}
        </div>

        <div className="tasks-list">
          {(() => {
            const displayTasks = showCompletedTasks ? getCompletedTasks() : getActiveTasks();
            const taskType = showCompletedTasks ? 'completed' : 'active';
            
            if (displayTasks.length === 0) {
              return (
                <div className="empty-state">
                  <p>No {taskType} tasks found.</p>
                </div>
              );
            }
            
            return displayTasks.map(task => (
              <div key={task.id} className={`task-card ${task.status || 'in-queue'} ${showCompletedTasks && isBulkMode ? 'bulk-mode' : ''} ${showCompletedTasks && isBulkMode && selectedCompletedTasks.includes(task.id) ? 'selected' : ''}`}>
                <div className="task-header">
                  {showCompletedTasks && isBulkMode && (
                    <input
                      type="checkbox"
                      className="task-checkbox"
                      checked={selectedCompletedTasks.includes(task.id)}
                      onChange={() => handleSelectCompletedTask(task.id)}
                    />
                  )}
                  <h4>{task.name}</h4>
                  <div className="task-badges">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(task.status || 'in-queue') }}
                    >
                      {(task.status || 'in-queue').replace('-', ' ').toUpperCase()}
                    </span>
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(task.priority) }}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>
                
                <div className="task-details">
                  <p><strong>Task:</strong> {task.name}</p>
                  <p><strong>Priority:</strong> {task.priority}</p>
                  {task.robotStatus && <p><strong>Robot:</strong> {task.robotStatus}</p>}
                </div>
                
                {task.progress !== undefined && (
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${task.progress}%` }}
                    ></div>
                    <span className="progress-text">{task.progress}%</span>
                  </div>
                )}
                
                <div className="task-meta">
                  <small>Added: {new Date(task.timeAdded).toLocaleString()}</small>
                  {task.updatedAt && <small>Updated: {new Date(task.updatedAt).toLocaleString()}</small>}
                </div>

                {/* Task actions */}
                <div className="task-actions">
                  {/* Complete button for in-progress tasks */}
                  {!showCompletedTasks && task.status === 'in-progress' && (
                    <button 
                      className="complete-task-btn"
                      onClick={() => handleCompleteTask(task.id)}
                      title="Manually complete this task"
                    >
                      ✅ Complete
                    </button>
                  )}
                  
                  {/* Delete button for completed tasks - only show when not in bulk mode */}
                  {showCompletedTasks && task.status === 'completed' && !isBulkMode && (
                    <button 
                      className="delete-completed-btn"
                      onClick={() => handleDeleteCompletedTask(task.id)}
                      title="Permanently delete this completed task"
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
};

export default RobotSimulator;
