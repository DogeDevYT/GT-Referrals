import { useState, useEffect } from 'react';
import api from '../api/client';
import ReferralCard from '../components/ReferralCard';
import './InboxPage.css';

export default function InboxPage() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchPending = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/employees/referrals/pending');
      setReferrals(data);
    } catch {
      setError('Could not load pending referrals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (id) => {
    setActionError('');
    try {
      await api.patch(`/employees/referrals/${id}/approve`);
      setReferrals((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to approve referral.');
    }
  };

  const handleReject = async (id) => {
    setActionError('');
    try {
      await api.patch(`/employees/referrals/${id}/reject`);
      setReferrals((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to reject referral.');
    }
  };

  return (
    <div className="page-wrapper fade-in">
      <div className="inbox-header">
        <div>
          <h1>Inbox</h1>
          <p>Pending referral requests — sorted by priority score (credits + shared clubs).</p>
        </div>
        <div className="inbox-badge-wrap">
          {!loading && referrals.length > 0 && (
            <span className="badge badge-pending" style={{ fontSize: '1rem', padding: '0.35rem 0.85rem' }}>
              {referrals.length} pending
            </span>
          )}
        </div>
      </div>

      {actionError && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{actionError}</div>
      )}

      {loading && (
        <div className="inbox-loading">
          <span className="spinner spinner-navy" style={{ width: '2rem', height: '2rem' }} />
          <p>Loading requests…</p>
        </div>
      )}

      {!loading && !error && referrals.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📬</div>
          <h3>You're all caught up!</h3>
          <p>No pending referral requests right now. Check back later.</p>
        </div>
      )}

      {error && !loading && (
        <div className="alert alert-error">{error}</div>
      )}

      <div className="inbox-list">
        {referrals.map((ref) => (
          <ReferralCard
            key={ref._id}
            referral={ref}
            viewAs="employee"
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ))}
      </div>
    </div>
  );
}
