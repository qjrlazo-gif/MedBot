import { 
  getDatabase, 
  ref, 
  set, 
  onValue, 
  off,
  get 
} from 'firebase/database';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc 
} from 'firebase/firestore';
import { app } from '../firebaseConfig';

// Initialize database instances
const rtdb = getDatabase(app);
const firestore = getFirestore(app);

// Types
export interface RobotPosition {
  x: number;
  y: number;
}

export interface TaskData {
  source: RobotPosition;
  destination: RobotPosition;
  status: 'in-progress' | 'in-queue' | 'completed';
  id?: string;
  name?: string;
  priority?: 'Low' | 'Medium' | 'High';
  timeAdded?: string;
  robotStatus?: string;
  progress?: number;
}

export interface TaskQueueItem {
  id: string;
  nurseName: string;
  selectedSupplies: string[];
  sourceLocation: string;
  destinationRooms: string[];
  priority: 'NORMAL' | 'URGENT';
  notes: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  robotStatus?: string;
  progress?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MapData {
  dateCreated: string;
  width: number;
  height: number;
  walls: Array<{ x: number; y: number; w: number; h: number }>;
}

// Realtime Database Operations
export class RealtimeDB {
  // Get robot position
  static async getRobotPosition(): Promise<RobotPosition | null> {
    try {
      const snapshot = await get(ref(rtdb, 'position'));
      return snapshot.val();
    } catch (error) {
      console.error('Error getting robot position:', error);
      return null;
    }
  }

  // Update robot position
  static async updateRobotPosition(position: RobotPosition): Promise<boolean> {
    try {
      await set(ref(rtdb, 'position'), position);
      return true;
    } catch (error) {
      console.error('Error updating robot position:', error);
      return false;
    }
  }

  // Get current task
  static async getCurrentTask(): Promise<TaskData | null> {
    try {
      const snapshot = await get(ref(rtdb, 'task'));
      return snapshot.val();
    } catch (error) {
      console.error('Error getting current task:', error);
      return null;
    }
  }

  // Set current task
  static async setCurrentTask(task: TaskData): Promise<boolean> {
    try {
      await set(ref(rtdb, 'task'), task);
      return true;
    } catch (error) {
      console.error('Error setting current task:', error);
      return false;
    }
  }

  // Get robot path
  static async getRobotPath(): Promise<RobotPosition[]> {
    try {
      const snapshot = await get(ref(rtdb, 'path'));
      return snapshot.val() || [];
    } catch (error) {
      console.error('Error getting robot path:', error);
      return [];
    }
  }

  // Update robot path
  static async updateRobotPath(path: RobotPosition[]): Promise<boolean> {
    try {
      await set(ref(rtdb, 'path'), path);
      return true;
    } catch (error) {
      console.error('Error updating robot path:', error);
      return false;
    }
  }

  // Listen to real-time changes
  static listenToRobotData(callback: (data: any) => void): () => void {
    const robotRef = ref(rtdb, '/');
    const unsubscribe = onValue(robotRef, (snapshot) => {
      callback(snapshot.val());
    });
    
    return () => off(robotRef, 'value', unsubscribe);
  }
}

// Firestore Operations
export class FirestoreDB {
  // Get all maps
  static async getAllMaps(): Promise<MapData[]> {
    try {
      const querySnapshot = await getDocs(collection(firestore, 'maps'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MapData & { id: string }));
    } catch (error) {
      console.error('Error getting maps:', error);
      return [];
    }
  }

  // Get specific map
  static async getMap(mapId: string): Promise<MapData | null> {
    try {
      const docRef = doc(firestore, 'maps', mapId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as MapData;
      } else {
        console.warn('Map not found:', mapId);
        return null;
      }
    } catch (error) {
      console.error('Error getting map:', error);
      return null;
    }
  }

  // Create new map
  static async createMap(mapId: string, mapData: MapData): Promise<boolean> {
    try {
      await setDoc(doc(firestore, 'maps', mapId), mapData);
      return true;
    } catch (error) {
      console.error('Error creating map:', error);
      return false;
    }
  }

  // Update map
  static async updateMap(mapId: string, mapData: Partial<MapData>): Promise<boolean> {
    try {
      await updateDoc(doc(firestore, 'maps', mapId), mapData);
      return true;
    } catch (error) {
      console.error('Error updating map:', error);
      return false;
    }
  }

  // Delete map
  static async deleteMap(mapId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(firestore, 'maps', mapId));
      return true;
    } catch (error) {
      console.error('Error deleting map:', error);
      return false;
    }
  }

  // Create task queue collection (if needed)
  static async addTaskToQueue(task: TaskData): Promise<string | null> {
    try {
      const docRef = await addDoc(collection(firestore, 'taskQueue'), {
        ...task,
        timeAdded: new Date().toISOString(),
        status: 'in-queue'
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding task to queue:', error);
      return null;
    }
  }

  // Get all tasks from queue
  static async getTaskQueue(): Promise<(TaskData & { id: string })[]> {
    try {
      const querySnapshot = await getDocs(collection(firestore, 'taskQueue'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TaskData & { id: string }));
    } catch (error) {
      console.error('Error getting task queue:', error);
      return [];
    }
  }

  // Delete task from queue
  static async deleteTaskFromQueue(taskId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(firestore, 'taskQueue', taskId));
      return true;
    } catch (error) {
      console.error('Error deleting task from queue:', error);
      return false;
    }
  }

  // Update task in queue
  static async updateTaskInQueue(taskId: string, taskData: Partial<TaskData>): Promise<boolean> {
    try {
      await updateDoc(doc(firestore, 'taskQueue', taskId), {
        ...taskData,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error updating task in queue:', error);
      return false;
    }
  }
}

// Combined operations
export class DatabaseManager {
  // Get complete robot state
  static async getRobotState() {
    const [position, task, path] = await Promise.all([
      RealtimeDB.getRobotPosition(),
      RealtimeDB.getCurrentTask(),
      RealtimeDB.getRobotPath()
    ]);

    return { position, task, path };
  }

  // Set complete robot state
  static async setRobotState(state: {
    position?: RobotPosition;
    task?: TaskData;
    path?: RobotPosition[];
  }) {
    const updates: Promise<boolean>[] = [];

    if (state.position) {
      updates.push(RealtimeDB.updateRobotPosition(state.position));
    }
    if (state.task) {
      updates.push(RealtimeDB.setCurrentTask(state.task));
    }
    if (state.path) {
      updates.push(RealtimeDB.updateRobotPath(state.path));
    }

    const results = await Promise.all(updates);
    return results.every(result => result === true);
  }

  // Task Status Management for Robot Simulator
  static async updateTaskStatus(
    taskId: string, 
    status: 'pending' | 'in-progress' | 'completed' | 'failed',
    robotStatus?: string,
    progress?: number
  ): Promise<boolean> {
    try {
      const taskRef = doc(firestore, 'taskQueue', taskId);
      const updateData: any = {
        status,
        updatedAt: new Date().toISOString()
      };
      
      if (robotStatus) updateData.robotStatus = robotStatus;
      if (progress !== undefined) updateData.progress = progress;
      
      await updateDoc(taskRef, updateData);
      return true;
    } catch (error) {
      console.error('Error updating task status:', error);
      return false;
    }
  }

  static async getAllTasksWithStatus(): Promise<TaskQueueItem[]> {
    try {
      const tasksSnapshot = await getDocs(collection(firestore, 'taskQueue'));
      return tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Ensure default values for new fields
        status: doc.data().status || 'pending',
        createdAt: doc.data().createdAt || new Date().toISOString(),
        updatedAt: doc.data().updatedAt || new Date().toISOString()
      } as TaskQueueItem));
    } catch (error) {
      console.error('Error getting tasks with status:', error);
      return [];
    }
  }

  static async getPendingTasks(): Promise<TaskQueueItem[]> {
    try {
      const tasksSnapshot = await getDocs(collection(firestore, 'taskQueue'));
      return tasksSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          status: doc.data().status || 'pending',
          createdAt: doc.data().createdAt || new Date().toISOString(),
          updatedAt: doc.data().updatedAt || new Date().toISOString()
        } as TaskQueueItem))
        .filter(task => task.status === 'pending');
    } catch (error) {
      console.error('Error getting pending tasks:', error);
      return [];
    }
  }
}

export { rtdb, firestore };
