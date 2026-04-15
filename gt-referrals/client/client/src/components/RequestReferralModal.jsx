import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import './RequestReferralModal.css';

export default function RequestReferralModal({ employee, onClose, onSuccess }) {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({
    jobTitle: '',
    jobUrl: '',
    jobId: '',
    message: '',
    creditsToSpend: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/jobseekers/referrals', {
        employeeId: employee._id,
        companyId: employee.company?._id || employee.company,
        jobTitle: form.jobTitle,
        jobUrl: form.jobUrl,
        jobId: form.jobId,
        message: form.message,
        creditsToSpend: Number(form.creditsToSpend),
      });
      await refreshUser();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-in">
        <div className="modal-header">
          <div>
            <h3>Request a Referral</h3>
            <p className="modal-subtitle">
              From <strong>{employee.name}</strong>
              {employee.company?.name && <> at <strong>{employee.company.name}</strong></>}
            </p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={submit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Job Title *</label>
            <input
              className="form-input"
              name="jobTitle"
              value={form.jobTitle}
              onChange={handle}
              placeholder="e.g. Software Engineer Intern"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Job Posting URL</label>
            <input
              className="form-input"
              name="jobUrl"
              type="url"
              value={form.jobUrl}
              onChange={handle}
              placeholder="https://careers.company.com/..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Job / Req ID</label>
            <input
              className="form-input"
              name="jobId"
              value={form.jobId}
              onChange={handle}
              placeholder="Optional internal job ID"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Message to Alumni</label>
            <textarea
              className="form-input form-textarea"
              name="message"
              value={form.message}
              onChange={handle}
              placeholder="Introduce yourself and explain why you're a great fit..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Credits to Spend</label>
            <input
              className="form-input"
              name="creditsToSpend"
              type="number"
              min="1"
              value={form.creditsToSpend}
              onChange={handle}
              required
            />
            <span className="form-hint">More credits = higher priority in the alumni's queue</span>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-gold" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
