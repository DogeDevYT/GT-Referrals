import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

export default function RegisterPage() {
  const { registerJobseeker, registerEmployee } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('jobseeker');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (role === 'jobseeker' && !form.email.endsWith('@gatech.edu')) {
      return setError('Jobseekers must use a @gatech.edu email address.');
    }
    setLoading(true);
    try {
      if (role === 'jobseeker') {
        await registerJobseeker(form.name, form.email, form.password);
      } else {
        await registerEmployee(form.name, form.email, form.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card fade-in">
        <div className="auth-logo">
          <span className="auth-logo-gt">GT</span> Referrals
        </div>
        <h1 className="auth-title">Create an account</h1>
        <p className="auth-subtitle">Join the GT referral network</p>

        {/* Role Toggle */}
        <div className="role-toggle">
          <button
            id="role-jobseeker"
            type="button"
            className={`role-tab ${role === 'jobseeker' ? 'active' : ''}`}
            onClick={() => setRole('jobseeker')}
          >
            🎓 GT Student
          </button>
          <button
            id="role-employee"
            type="button"
            className={`role-tab ${role === 'employee' ? 'active' : ''}`}
            onClick={() => setRole('employee')}
          >
            💼 GT Alumni / Employee
          </button>
        </div>

        <p className="role-hint">
          {role === 'jobseeker'
            ? 'You need a @gatech.edu email to register as a student.'
            : 'Register with your company email to verify your employment.'}
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={submit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              className="form-input"
              type="text"
              name="name"
              value={form.name}
              onChange={handle}
              placeholder="Jane Smith"
              required
              autoComplete="name"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">
              {role === 'jobseeker' ? 'GT Email (@gatech.edu)' : 'Company Email'}
            </label>
            <input
              id="reg-email"
              className="form-input"
              type="email"
              name="email"
              value={form.email}
              onChange={handle}
              placeholder={role === 'jobseeker' ? 'jsmith@gatech.edu' : 'jane@company.com'}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              className="form-input"
              type="password"
              name="password"
              value={form.password}
              onChange={handle}
              placeholder="At least 8 characters"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
            <input
              id="reg-confirm"
              className="form-input"
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handle}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </div>
          <button id="register-submit" type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
