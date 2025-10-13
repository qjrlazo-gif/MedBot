import React, { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DirectionsIcon from '@mui/icons-material/Directions';

interface TaskTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskTypeSelect: (taskType: 'deliver' | 'go') => void;
}

function TaskTypeModal({ isOpen, onClose, onTaskTypeSelect }: TaskTypeModalProps) {
  const [selectedType, setSelectedType] = useState<'deliver' | 'go' | null>(null);

  // Reset selection when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedType(null);
    }
  }, [isOpen]);

  const handleTaskTypeClick = (taskType: 'deliver' | 'go') => {
    setSelectedType(taskType);
    onTaskTypeSelect(taskType);
    onClose();
  };

  const handleClose = () => {
    setSelectedType(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content task-type-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Task Type</h2>
          <p>Choose the type of task you want to create</p>
          <button className="close-btn" onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </button>
        </div>

        <div className="task-type-options">
          <button 
            className={`task-type-btn deliver ${selectedType === 'deliver' ? 'selected' : ''}`}
            onClick={() => handleTaskTypeClick('deliver')}
          >
            <div className="task-type-icon">
              <LocalShippingIcon fontSize="large" />
            </div>
            <div className="task-type-content">
              <h3>Deliver/Fetch</h3>
              <p>Request robot to deliver or fetch medical supplies to/from specific locations</p>
            </div>
          </button>

          <button 
            className={`task-type-btn go ${selectedType === 'go' ? 'selected' : ''}`}
            onClick={() => handleTaskTypeClick('go')}
          >
            <div className="task-type-icon">
              <DirectionsIcon fontSize="large" />
            </div>
            <div className="task-type-content">
              <h3>Go</h3>
              <p>Send robot to a specific location for inspection, maintenance, or other tasks</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskTypeModal;
