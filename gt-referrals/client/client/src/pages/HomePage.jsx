import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const firstName = user?.name?.split(' ')[0] || 'Yellow Jacket';

  return (
    <div className="home-page fade-in">
      {/* Hero greeting */}
      <div className="home-hero">
        <h1 className="home-greeting">Hi, {firstName} 👋</h1>
        <p className="home-tagline">
          {user?.role === 'employee'
            ? 'Help fellow GT alumni and current students land their dream roles.'
            : 'Find GT alumni at your target companies and get referred.'}
        </p>
      </div>

      <div className="home-content">
        {/* Employee section */}
        {user?.role === 'employee' && (
          <section className="home-section card">
            <div className="section-header">
              <div>
                <h2>Verified Employee Dashboard</h2>
                <p>Help fellow GT alum and current students find referrals by verifying where you're currently working</p>
              </div>
              <Link to="/inbox" className="section-action">Manage Referrals</Link>
            </div>
            <div className="home-actions-row" style={{ marginTop: '1.5rem' }}>
              <Link to="/inbox" id="home-verify-company" className="btn btn-gold btn-full" style={{ maxWidth: '500px' }}>
                View Pending Referrals →
              </Link>
            </div>

            {/* Stats row */}
            <div className="home-stats">
              <div className="home-stat">
                <span className="home-stat-value">{user?.credits ?? 0}</span>
                <span className="home-stat-label">Credits earned</span>
              </div>
              <div className="home-stat">
                <span className="home-stat-value">{user?.referrals?.length ?? 0}</span>
                <span className="home-stat-label">Referrals reviewed</span>
              </div>
            </div>
          </section>
        )}

        {/* Jobseeker section */}
        {user?.role === 'jobseeker' && (
          <>
            {/* Verify Company teaser */}
            <section className="home-section card">
              <div className="section-header">
                <div>
                  <h2>Verified Employee Dashboard</h2>
                  <p>Help fellow GT alum and current students find referrals by verifying where you're currently working</p>
                </div>
                <button className="section-action">Manage Verification</button>
              </div>
              <button id="home-verify-company" className="btn btn-gold" style={{ marginTop: '1.5rem', minWidth: '220px' }}>
                Verify Company
              </button>
            </section>

            {/* Find Alumni */}
            <section className="home-section card">
              <h2>Find a Job Referral</h2>
              <div className="home-search-row">
                <input
                  id="home-search-input"
                  className="form-input home-search"
                  placeholder="Search by company, role, or alumni name..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') navigate(`/find-alumni?q=${e.target.value}`);
                  }}
                />
              </div>
              <button
                id="home-find-alumni"
                className="btn btn-primary"
                style={{ marginTop: '1rem', minWidth: '160px' }}
                onClick={() => navigate('/find-alumni')}
              >
                Find Alumni
              </button>
            </section>

            {/* Credits */}
            <div className="home-stats-row">
              <div className="home-stat-card card">
                <span className="home-stat-value">{user?.credits ?? 0}</span>
                <span className="home-stat-label">Credits available</span>
              </div>
              <div className="home-stat-card card">
                <span className="home-stat-value">{user?.referrals?.length ?? 0}</span>
                <span className="home-stat-label">Referrals requested</span>
              </div>
              <div className="home-stat-card card">
                <span className="home-stat-value">{user?.clubs?.length ?? 0}</span>
                <span className="home-stat-label">Clubs joined</span>
              </div>
            </div>
          </>
        )}

        {/* Not logged in fallback */}
        {!user && (
          <section className="home-section card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <h2 style={{ marginBottom: '0.5rem' }}>Welcome to GT Referrals</h2>
            <p style={{ marginBottom: '1.5rem' }}>
              Connecting Georgia Tech students with alumni for job referrals.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-primary">Get Started</Link>
              <Link to="/login" className="btn btn-outline">Sign In</Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
