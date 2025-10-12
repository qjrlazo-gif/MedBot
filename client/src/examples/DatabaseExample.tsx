// Example of how to use the Firebase database utilities
import { RealtimeDB, FirestoreDB, DatabaseManager } from '../utils/firebaseUtils';

// Example: Get robot position
export const getRobotPositionExample = async () => {
  const position = await RealtimeDB.getRobotPosition();
  console.log('Robot position:', position);
  return position;
};

// Example: Update robot position
export const updateRobotPositionExample = async () => {
  const newPosition = { x: 100, y: 200 };
  const success = await RealtimeDB.updateRobotPosition(newPosition);
  console.log('Position update success:', success);
  return success;
};

// Example: Get current task
export const getCurrentTaskExample = async () => {
  const task = await RealtimeDB.getCurrentTask();
  console.log('Current task:', task);
  return task;
};

// Example: Set a new task
export const setNewTaskExample = async () => {
  const newTask = {
    source: { x: 50, y: 50 },
    destination: { x: 150, y: 150 },
    status: 'in-queue' as const,
    name: 'Deliver supplies',
    priority: 'High' as const,
    timeAdded: new Date().toISOString()
  };
  
  const success = await RealtimeDB.setCurrentTask(newTask);
  console.log('Task set success:', success);
  return success;
};

// Example: Get all maps
export const getAllMapsExample = async () => {
  const maps = await FirestoreDB.getAllMaps();
  console.log('All maps:', maps);
  return maps;
};

// Example: Get specific map
export const getSpecificMapExample = async (mapId: string) => {
  const map = await FirestoreDB.getMap(mapId);
  console.log('Map data:', map);
  return map;
};

// Example: Create a new map
export const createNewMapExample = async () => {
  const newMap = {
    dateCreated: new Date().toISOString(),
    width: 1000,
    height: 800,
    walls: [
      { x: 100, y: 100, w: 20, h: 200 },
      { x: 300, y: 200, w: 150, h: 20 }
    ]
  };
  
  const success = await FirestoreDB.createMap('test-map', newMap);
  console.log('Map creation success:', success);
  return success;
};

// Example: Listen to real-time changes
export const listenToRobotDataExample = () => {
  const unsubscribe = RealtimeDB.listenToRobotData((data) => {
    console.log('Robot data changed:', data);
  });
  
  // To stop listening, call unsubscribe()
  return unsubscribe;
};

// Example: Get complete robot state
export const getCompleteRobotStateExample = async () => {
  const state = await DatabaseManager.getRobotState();
  console.log('Complete robot state:', state);
  return state;
};

// Example: Set complete robot state
export const setCompleteRobotStateExample = async () => {
  const newState = {
    position: { x: 100, y: 100 },
    task: {
      source: { x: 0, y: 0 },
      destination: { x: 200, y: 200 },
      status: 'in-progress' as const
    },
    path: [
      { x: 100, y: 100 },
      { x: 150, y: 150 },
      { x: 200, y: 200 }
    ]
  };
  
  const success = await DatabaseManager.setRobotState(newState);
  console.log('State update success:', success);
  return success;
};
