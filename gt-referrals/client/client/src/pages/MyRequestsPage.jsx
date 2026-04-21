import { useState, useEffect } from 'react';
import api from '../api/client';
import ReferralCard from '../components/ReferralCard';
import './InboxPage.css';

const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected', 'submitted'];

export default function MyRequestsPage() {
  const [profile, setProfile] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/jobseekers/me');
        setProfile(data);
        // Referral IDs are stored on the profile — we fetch each individually
        // OR the backend already populates them
        if (Array.isArray(data.referrals) && data.referrals.length > 0 && typeof data.referrals[0] === 'object') {
          setReferrals(data.referrals);
        } else {
          // Referrals are just IDs — fetch each
          const results = await Promise.allSettled(
            (data.referrals || []).map((id) => api.get(`/referrals/${id}`).then((r) => r.data))
          );
          setReferrals(results.filter((r) => r.status === 'fulfilled').map((r) => r.value));
        }
      } catch {
        setError('Could not load your referrals. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = filter === 'all' ? referrals : referrals.filter((r) => r.status === filter);

  return (
    <div className="page-wrapper fade-in">
      <div className="inbox-header">
        <div>
          <h1>My Requests</h1>
          <p>All referral requests you've submitted, along with their current status.</p>
        </div>
        {profile && (
          <div className="credits-pill">
            <span className="credits-icon">💎</span>
            <span className="credits-value">{profile.credits ?? 0}</span>
            <span className="credits-label">credits</span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="inbox-filters">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            id={`filter-${s}`}
            className={`filter-tab ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading && (
        <div className="inbox-loading">
          <span className="spinner spinner-navy" style={{ width: '2rem', height: '2rem' }} />
          <p>Loading your requests…</p>
        </div>
      )}

      {error && !loading && <div className="alert alert-error">{error}</div>}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">{filter === 'all' ? '📋' : '🔎'}</div>
          <h3>{filter === 'all' ? 'No requests yet' : `No ${filter} requests`}</h3>
          <p>
            {filter === 'all'
              ? 'Head to Find Alumni to request your first referral!'
              : 'Try a different status filter.'}
          </p>
        </div>
      )}

      <div className="inbox-list">
        {filtered.map((ref) => (
          <ReferralCard key={ref._id} referral={ref} viewAs="jobseeker" />
        ))}
      </div>
    </div>
  );
}
