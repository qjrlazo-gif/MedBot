import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type { UserProfile, UserRole } from '../contexts/AuthContext';
import './UserManagement.css';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    role: 'nurse' as UserRole,
    department: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      // For now, we'll use Firestore as the source of truth
      // In a production environment, you would need a backend function to sync Firebase Auth users
      await fetchUsersFromFirestore();
      
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users from database');
    } finally {
      setLoading(false);
    }
  };

  // Function to get users from Firestore only
  const fetchUsersFromFirestore = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const usersList: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() } as UserProfile & { id: string });
      });
      
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users from Firestore:', error);
      setError('Failed to load users from database');
    }
  };


  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setEditForm({
      displayName: user.displayName,
      role: user.role,
      department: user.department || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    // Validate form data
    if (!editForm.displayName.trim()) {
      setError('Full name is required');
      return;
    }

    if (!editForm.role) {
      setError('Role is required');
      return;
    }

    try {
      setError(''); // Clear any previous errors
      console.log('Updating user:', selectedUser.uid, 'with data:', editForm);
      
      const userRef = doc(db, 'users', selectedUser.uid);
      const updateData = {
        displayName: editForm.displayName.trim(),
        role: editForm.role,
        department: editForm.department.trim() || '',
        updatedAt: new Date().toISOString()
      };
      
      console.log('Update data:', updateData);
      await updateDoc(userRef, updateData);

      // Update local state
      setUsers(users.map(user => 
        user.uid === selectedUser.uid 
          ? { ...user, ...editForm, updatedAt: new Date().toISOString() }
          : user
      ));

      setShowEditModal(false);
      setSelectedUser(null);
      setSuccessMessage('User updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000); // Clear success message after 3 seconds
      console.log('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Handle specific Firebase errors
      if (errorMessage.includes('permission-denied')) {
        setError('Permission denied. Make sure you have admin privileges and Firestore rules allow user updates.');
      } else if (errorMessage.includes('not-found')) {
        setError('User document not found in database.');
      } else {
        setError(`Failed to update user: ${errorMessage}`);
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(users.filter(user => user.uid !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user');
    }
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1>User Management</h1>
            <p>Manage user accounts and permissions</p>
          </div>
          <div className="header-actions">
            <button 
              onClick={fetchUsers}
              className="refresh-btn"
              title="Refresh user list"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
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

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Created</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.uid} className={`role-${user.role}`}>
                <td>{user.displayName}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge role-${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td>{user.department || '-'}</td>
                <td>{formatDate(user.createdAt)}</td>
                <td>{user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="edit-btn"
                      title="Edit user"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.uid)}
                      className="delete-btn"
                      title="Delete user"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit User</h2>
              <button 
                className="close-btn" 
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="displayName">Full Name</label>
                <input
                  type="text"
                  id="displayName"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  value={editForm.role}
                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
                >
                  <option value="nurse">Nurse</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="department">Department</label>
                <input
                  type="text"
                  id="department"
                  value={editForm.department}
                  onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="e.g., ICU, Emergency, Surgery"
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
                onClick={handleUpdateUser}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
