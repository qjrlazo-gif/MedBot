import { useState, useEffect } from 'react';
import { FirestoreDB, DatabaseManager, type TaskData, type MapData } from '../utils/firebaseUtils';
import { useAuth } from '../contexts/AuthContext';

interface DatabaseViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

function DatabaseViewer({ isOpen, onClose }: DatabaseViewerProps) {
  const { isAdmin } = useAuth();
  const [robotState, setRobotState] = useState<any>(null);
  const [maps, setMaps] = useState<(MapData & { id: string })[]>([]);
  const [taskQueue, setTaskQueue] = useState<(TaskData & { id: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'realtime' | 'firestore'>('realtime');

  // Don't render if user is not admin
  if (!isAdmin) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="access-denied">
            <h2>Access Denied</h2>
            <p>You need admin privileges to access the database viewer.</p>
            <button className="close-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const loadData = async () => {
    setLoading(true);
    try {
      // Load robot state
      const state = await DatabaseManager.getRobotState();
      setRobotState(state);

      // Load maps
      const mapsData = await FirestoreDB.getAllMaps();
      setMaps(mapsData as (MapData & { id: string })[]);

      // Load task queue
      const tasks = await FirestoreDB.getTaskQueue();
      setTaskQueue(tasks);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const formatData = (data: any): string => {
    return JSON.stringify(data, null, 2);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Database Viewer</h2>
          <p>View and inspect Firebase database data</p>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Tabs */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginBottom: '24px',
            borderBottom: '1px solid #e9ecef'
          }}>
            <button
              className={`tab-btn ${activeTab === 'realtime' ? 'active' : ''}`}
              onClick={() => setActiveTab('realtime')}
              style={{
                padding: '12px 24px',
                border: 'none',
                background: activeTab === 'realtime' ? '#3513e1' : 'transparent',
                color: activeTab === 'realtime' ? 'white' : '#666',
                cursor: 'pointer',
                borderRadius: '8px 8px 0 0'
              }}
            >
              Realtime Database
            </button>
            <button
              className={`tab-btn ${activeTab === 'firestore' ? 'active' : ''}`}
              onClick={() => setActiveTab('firestore')}
              style={{
                padding: '12px 24px',
                border: 'none',
                background: activeTab === 'firestore' ? '#3513e1' : 'transparent',
                color: activeTab === 'firestore' ? 'white' : '#666',
                cursor: 'pointer',
                borderRadius: '8px 8px 0 0'
              }}
            >
              Firestore
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadData}
            disabled={loading}
            style={{
              padding: '8px 16px',
              background: '#3513e1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '16px'
            }}
          >
            {loading ? 'Loading...' : 'Refresh Data'}
          </button>

          {/* Content */}
          {activeTab === 'realtime' && (
            <div>
              <h3>Robot State (Realtime Database)</h3>
              <div style={{
                background: '#f8f9fa',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                fontFamily: 'monospace',
                fontSize: '12px',
                whiteSpace: 'pre-wrap',
                maxHeight: '400px',
                overflow: 'auto'
              }}>
                {robotState ? formatData(robotState) : 'No data available'}
              </div>
            </div>
          )}

          {activeTab === 'firestore' && (
            <div>
              <h3>Maps Collection</h3>
              <div style={{
                background: '#f8f9fa',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                fontFamily: 'monospace',
                fontSize: '12px',
                whiteSpace: 'pre-wrap',
                maxHeight: '200px',
                overflow: 'auto',
                marginBottom: '16px'
              }}>
                {maps.length > 0 ? formatData(maps) : 'No maps found'}
              </div>

              <h3>Task Queue Collection</h3>
              <div style={{
                background: '#f8f9fa',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                fontFamily: 'monospace',
                fontSize: '12px',
                whiteSpace: 'pre-wrap',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                {taskQueue.length > 0 ? formatData(taskQueue) : 'No tasks in queue'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DatabaseViewer;
