import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './RoomsManagement.css';

interface Room {
  id: string;
  name: string;
  description: string;
  type: string;
  floor: number;
  capacity: number;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  location: string;
  createdAt: string;
  updatedAt: string;
}

const RoomsManagement: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'patient',
    floor: 1,
    capacity: 1,
    status: 'available' as Room['status'],
    location: ''
  });

  const roomTypes = [
    'patient',
    'icu',
    'surgery',
    'emergency',
    'consultation',
    'storage',
    'office',
    'other'
  ];

  const roomStatuses = [
    'available',
    'occupied',
    'maintenance',
    'reserved'
  ];

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'rooms'));
      const roomsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Room));
      setRooms(roomsData);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async () => {
    if (!formData.name.trim()) {
      setError('Room name is required');
      return;
    }

    try {
      setError('');
      await addDoc(collection(db, 'rooms'), {
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      setSuccessMessage('Room added successfully!');
      setShowAddModal(false);
      resetForm();
      fetchRooms();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error adding room:', error);
      setError('Failed to add room');
    }
  };

  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    setFormData({
      name: room.name,
      description: room.description,
      type: room.type,
      floor: room.floor,
      capacity: room.capacity,
      status: room.status,
      location: room.location
    });
    setShowEditModal(true);
  };

  const handleUpdateRoom = async () => {
    if (!selectedRoom || !formData.name.trim()) {
      setError('Room name is required');
      return;
    }

    try {
      setError('');
      const roomRef = doc(db, 'rooms', selectedRoom.id);
      await updateDoc(roomRef, {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      
      setSuccessMessage('Room updated successfully!');
      setShowEditModal(false);
      setSelectedRoom(null);
      resetForm();
      fetchRooms();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating room:', error);
      setError('Failed to update room');
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!window.confirm('Are you sure you want to delete this room?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'rooms', roomId));
      setSuccessMessage('Room deleted successfully!');
      fetchRooms();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting room:', error);
      setError('Failed to delete room');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'patient',
      floor: 1,
      capacity: 1,
      status: 'available',
      location: ''
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: Room['status']) => {
    switch (status) {
      case 'available': return '#c6f6d5';
      case 'occupied': return '#fed7d7';
      case 'maintenance': return '#fbd38d';
      case 'reserved': return '#bee3f8';
      default: return '#e2e8f0';
    }
  };

  const getStatusTextColor = (status: Room['status']) => {
    switch (status) {
      case 'available': return '#22543d';
      case 'occupied': return '#c53030';
      case 'maintenance': return '#c05621';
      case 'reserved': return '#2b6cb0';
      default: return '#718096';
    }
  };


  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading rooms...</p>
      </div>
    );
  }

  return (
    <div className="rooms-management">
      <div className="page-header">
        <h2>Rooms Management</h2>
        <p>Manage hospital rooms and locations</p>
        <button 
          className="add-btn"
          onClick={() => setShowAddModal(true)}
        >
          ➕ Add Room
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {successMessage && (
        <div className="success-message">
          {successMessage}
          <button onClick={() => setSuccessMessage('')}>×</button>
        </div>
      )}

      <div className="rooms-grid">
        {rooms.map((room) => (
          <div key={room.id} className="room-card">
            <div className="room-header">
              <h3>{room.name}</h3>
              <span 
                className="status-badge"
                style={{
                  backgroundColor: getStatusColor(room.status),
                  color: getStatusTextColor(room.status)
                }}
              >
                {room.status}
              </span>
            </div>
            
            <div className="room-details">
              <p className="description">{room.description}</p>
              
              <div className="room-info">
                <div className="info-item">
                  <span className="label">Type:</span>
                  <span className="value">{room.type}</span>
                </div>
                <div className="info-item">
                  <span className="label">Floor:</span>
                  <span className="value">{room.floor}</span>
                </div>
                <div className="info-item">
                  <span className="label">Capacity:</span>
                  <span className="value">{room.capacity} people</span>
                </div>
                {room.location && (
                  <div className="info-item">
                    <span className="label">Location:</span>
                    <span className="value">{room.location}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="room-footer">
              <div className="dates">
                <small>Created: {formatDate(room.createdAt)}</small>
                <small>Updated: {formatDate(room.updatedAt)}</small>
              </div>
              
              <div className="actions">
                <button 
                  className="edit-btn"
                  onClick={() => handleEditRoom(room)}
                  title="Edit room"
                >
                  ✏️
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteRoom(room.id)}
                  title="Delete room"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {rooms.length === 0 && (
          <div className="empty-state">
            <p>No rooms found. Add your first room to get started!</p>
          </div>
        )}
      </div>

      {/* Add Room Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Room</h2>
              <button 
                className="close-btn" 
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="name">Room Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Room 101, ICU-A, Surgery Room 1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description (Optional)</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the room and its purpose (optional)"
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="type">Room Type</label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  >
                    {roomTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Room['status'] }))}
                  >
                    {roomStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="floor">Floor</label>
                  <input
                    type="number"
                    id="floor"
                    value={formData.floor}
                    onChange={(e) => setFormData(prev => ({ ...prev, floor: parseInt(e.target.value) || 1 }))}
                    min="1"
                    max="50"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="capacity">Capacity</label>
                  <input
                    type="number"
                    id="capacity"
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                    min="1"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="location">Location/Building</label>
                <input
                  type="text"
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Main Building, East Wing, Emergency Department"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="cancel-btn" 
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button 
                className="save-btn" 
                onClick={handleAddRoom}
              >
                Add Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {showEditModal && selectedRoom && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Room</h2>
              <button 
                className="close-btn" 
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="edit-name">Room Name *</label>
                <input
                  type="text"
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-description">Description (Optional)</label>
                <textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the room and its purpose (optional)"
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-type">Room Type</label>
                  <select
                    id="edit-type"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  >
                    {roomTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-status">Status</label>
                  <select
                    id="edit-status"
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Room['status'] }))}
                  >
                    {roomStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-floor">Floor</label>
                  <input
                    type="number"
                    id="edit-floor"
                    value={formData.floor}
                    onChange={(e) => setFormData(prev => ({ ...prev, floor: parseInt(e.target.value) || 1 }))}
                    min="1"
                    max="50"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-capacity">Capacity</label>
                  <input
                    type="number"
                    id="edit-capacity"
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                    min="1"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edit-location">Location/Building</label>
                <input
                  type="text"
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="cancel-btn" 
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button 
                className="save-btn" 
                onClick={handleUpdateRoom}
              >
                Update Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomsManagement;
