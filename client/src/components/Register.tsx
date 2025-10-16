import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../contexts/AuthContext';
import './Login.css';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    role: 'nurse' as UserRole,
    department: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    symbol: false
  });
  const [adminCode, setAdminCode] = useState('');
  const [showAdminCode, setShowAdminCode] = useState(false);
  const { register } = useAuth();

  // Password validation function
  const validatePassword = (password: string) => {
    // Debug logging
    console.log('Password length:', password.length, 'Password:', password.replace(/./g, '*'));
    
    const validation = {
      length: password.length >= 8 && password.length <= 64,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
    
    // Debug logging for validation results
    console.log('Validation results:', validation);
    
    setPasswordValidation(validation);
    return Object.values(validation).every(Boolean);
  };

  // Admin code validation
  const validateAdminCode = (code: string) => {
    // Define the special admin authorization code
    const validAdminCode = 'LULAN2024';
    return code === validAdminCode;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate password when password field changes
    if (name === 'password') {
      validatePassword(value);
    }

    // Show/hide admin code field when role changes
    if (name === 'role') {
      if (value === 'admin') {
        setShowAdminCode(true);
      } else {
        setShowAdminCode(false);
        setAdminCode(''); // Clear admin code when role is not admin
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.password || !formData.displayName) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate full name length
    if (formData.displayName.length > 100) {
      setError('Full name cannot exceed 100 characters');
      return;
    }

    // Validate email domain
    const emailDomain = formData.email.split('@')[1];
    if (emailDomain !== 'gmail.com' && emailDomain !== 'tip.edu.ph') {
      setError('Email must be from gmail.com or tip.edu.ph domain');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!validatePassword(formData.password)) {
      setError('Password does not meet the minimum requirements');
      return;
    }

    // Validate admin code if admin role is selected
    if (formData.role === 'admin') {
      if (!adminCode.trim()) {
        setError('Admin authorization code is required');
        return;
      }
      if (!validateAdminCode(adminCode)) {
        setError('Invalid admin authorization code');
        return;
      }
    }

    try {
      setError('');
      setLoading(true);
      await register(
        formData.email,
        formData.password,
        formData.displayName,
        formData.role,
        formData.department || undefined
      );
      
      // Show success message
      setSuccess(true);
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/weak-password':
        return 'Password is too weak';
      case 'auth/operation-not-allowed':
        return 'Registration is currently disabled. Please contact an administrator or enable Email/Password authentication in Firebase Console.';
      default:
        return 'Failed to create account. Please try again';
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join the Lulan Robot Dashboard team</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            <h3>✅ Account Created Successfully!</h3>
            <p>Your account is ready. You can now log in.</p>
            <button 
              type="button" 
              onClick={onSwitchToLogin}
              className="login-button"
            >
              Go to Login
            </button>
          </div>
        )}

        {!success && (
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="displayName">Full Name *</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              maxLength={100}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              required
            >
              <option value="nurse">Nurse</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Admin Authorization Code Field */}
          {showAdminCode && (
            <div className="form-group">
              <label htmlFor="adminCode">Admin Authorization Code *</label>
              <input
                type="password"
                id="adminCode"
                name="adminCode"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                placeholder="Enter admin authorization code"
                required
              />
              <p className="admin-code-hint">
                Contact your administrator for the authorization code
              </p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="department">Department</label>
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              placeholder="e.g., ICU, Emergency, Surgery"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              required
            />
            
            {/* Password Requirements */}
            <div className="password-requirements">
              <h4>Password Requirements:</h4>
              <ul>
                <li className={passwordValidation.length ? 'valid' : 'invalid'}>
                  {passwordValidation.length ? '✓' : '✗'} At least 8 characters
                </li>
                <li className={passwordValidation.uppercase ? 'valid' : 'invalid'}>
                  {passwordValidation.uppercase ? '✓' : '✗'} At least 1 uppercase letter
                </li>
                <li className={passwordValidation.lowercase ? 'valid' : 'invalid'}>
                  {passwordValidation.lowercase ? '✓' : '✗'} At least 1 lowercase letter
                </li>
                <li className={passwordValidation.number ? 'valid' : 'invalid'}>
                  {passwordValidation.number ? '✓' : '✗'} At least 1 number
                </li>
                <li className={passwordValidation.symbol ? 'valid' : 'invalid'}>
                  {passwordValidation.symbol ? '✓' : '✗'} At least 1 symbol (@, #, $, etc.)
                </li>
              </ul>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-button primary"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        )}

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button 
              type="button" 
              onClick={onSwitchToLogin}
              className="link-button"
            >
              Sign in here
            </button>
          </p>
          <div className="setup-info">
            <p><strong>First time setup:</strong> Registration requires Firebase Authentication to be enabled. 
            Contact your administrator or enable Email/Password authentication in Firebase Console.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
