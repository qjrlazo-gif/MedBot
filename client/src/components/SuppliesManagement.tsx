import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './SuppliesManagement.css';

interface Supply {
  id: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

const SuppliesManagement: React.FC = () => {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'medical',
    quantity: 0,
    unit: 'units'
  });

  const categories = [
    'medical',
    'cleaning',
    'food',
    'equipment',
    'emergency',
    'other'
  ];

  const units = [
    'units',
    'boxes',
    'bottles',
    'packs',
    'kg',
    'liters',
    'pieces'
  ];

  useEffect(() => {
    fetchSupplies();
  }, []);

  const fetchSupplies = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'supplies'));
      const suppliesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Supply));
      setSupplies(suppliesData);
    } catch (error) {
      console.error('Error fetching supplies:', error);
      setError('Failed to load supplies');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupply = async () => {
    if (!formData.name.trim()) {
      setError('Supply name is required');
      return;
    }

    try {
      setError('');
      await addDoc(collection(db, 'supplies'), {
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      setSuccessMessage('Supply added successfully!');
      setShowAddModal(false);
      resetForm();
      fetchSupplies();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error adding supply:', error);
      setError('Failed to add supply');
    }
  };

  const handleEditSupply = (supply: Supply) => {
    setSelectedSupply(supply);
    setFormData({
      name: supply.name,
      description: supply.description,
      category: supply.category,
      quantity: supply.quantity,
      unit: supply.unit
    });
    setShowEditModal(true);
  };

  const handleUpdateSupply = async () => {
    if (!selectedSupply || !formData.name.trim()) {
      setError('Supply name is required');
      return;
    }

    try {
      setError('');
      const supplyRef = doc(db, 'supplies', selectedSupply.id);
      await updateDoc(supplyRef, {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      
      setSuccessMessage('Supply updated successfully!');
      setShowEditModal(false);
      setSelectedSupply(null);
      resetForm();
      fetchSupplies();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating supply:', error);
      setError('Failed to update supply');
    }
  };

  const handleDeleteSupply = async (supplyId: string) => {
    if (!window.confirm('Are you sure you want to delete this supply?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'supplies', supplyId));
      setSuccessMessage('Supply deleted successfully!');
      fetchSupplies();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting supply:', error);
      setError('Failed to delete supply');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'medical',
      quantity: 0,
      unit: 'units'
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


  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading supplies...</p>
      </div>
    );
  }

  return (
    <div className="supplies-management">
      <div className="page-header">
        <h2>Supplies Management</h2>
        <p>Manage medical supplies and inventory</p>
        <button 
          className="add-btn"
          onClick={() => setShowAddModal(true)}
        >
          ➕ Add Supply
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

      <div className="supplies-grid">
        {supplies.map((supply) => (
          <div key={supply.id} className="supply-card">
            <div className="supply-header">
              <h3>{supply.name}</h3>
              <span className={`category-badge ${supply.category}`}>
                {supply.category}
              </span>
            </div>
            
            <div className="supply-details">
              <p className="description">{supply.description}</p>
              <div className="quantity-info">
                <span className="quantity">{supply.quantity}</span>
                <span className="unit">{supply.unit}</span>
              </div>
            </div>
            
            <div className="supply-footer">
              <div className="dates">
                <small>Created: {formatDate(supply.createdAt)}</small>
                <small>Updated: {formatDate(supply.updatedAt)}</small>
              </div>
              
              <div className="actions">
                <button 
                  className="edit-btn"
                  onClick={() => handleEditSupply(supply)}
                  title="Edit supply"
                >
                  ✏️
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteSupply(supply.id)}
                  title="Delete supply"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {supplies.length === 0 && (
          <div className="empty-state">
            <p>No supplies found. Add your first supply to get started!</p>
          </div>
        )}
      </div>

      {/* Add Supply Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Supply</h2>
              <button 
                className="close-btn" 
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="name">Supply Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Bandages, Medicine, Cleaning supplies"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description (Optional)</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the supply item (optional)"
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="quantity">Quantity</label>
                  <input
                    type="number"
                    id="quantity"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="unit">Unit</label>
                  <select
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
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
                onClick={handleAddSupply}
              >
                Add Supply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Supply Modal */}
      {showEditModal && selectedSupply && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Supply</h2>
              <button 
                className="close-btn" 
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="edit-name">Supply Name *</label>
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
                  placeholder="Describe the supply item (optional)"
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-category">Category</label>
                  <select
                    id="edit-category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-quantity">Quantity</label>
                  <input
                    type="number"
                    id="edit-quantity"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-unit">Unit</label>
                  <select
                    id="edit-unit"
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
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
                onClick={handleUpdateSupply}
              >
                Update Supply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliesManagement;
