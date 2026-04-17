import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BlurFadeTextDemo } from '../components/ui/demo';
import './HomePage.css';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const firstName = user?.name?.split(' ')[0] || 'Yellow Jacket';
  const isEmployee = user?.role === 'employee';
  const hasLinkedCompany = Boolean(isEmployee && user?.company);
  const isCompanyVerified = Boolean(isEmployee && user?.isCompanyEmailVerified);

  return (
    <div className={`home-page fade-in ${!user ? 'home-page-landing' : ''}`}>
      {user && (
        <div className="home-hero">
          <h1 className="home-greeting">Hi, {firstName} 👋</h1>
          <p className="home-tagline">
            {user?.role === 'employee'
              ? 'Help fellow GT alumni and current students land their dream roles.'
              : 'Find GT alumni at your target companies and get referred.'}
          </p>
        </div>
      )}

      <div className="home-content">
        {/* Employee section */}
        {user?.role === 'employee' && (
          <section className="home-section card">
            {!hasLinkedCompany && (
              <>
                <div className="section-header">
                  <div>
                    <h2>Complete Your Employee Profile</h2>
                    <p>Add your company and company email to become discoverable by GT students.</p>
                  </div>
                  <Link to="/profile" className="section-action">Open Profile</Link>
                </div>
                <div className="home-actions-row" style={{ marginTop: '1.5rem' }}>
                  <Link to="/profile" id="home-verify-company" className="btn btn-gold btn-full" style={{ maxWidth: '500px' }}>
                    Add Company & Continue
                  </Link>
                </div>
              </>
            )}

            {hasLinkedCompany && !isCompanyVerified && (
              <>
                <div className="section-header">
                  <div>
                    <h2>Company Verification Pending</h2>
                    <p>Your company is linked, but your company email must match a verified company domain before students can discover you.</p>
                  </div>
                  <Link to="/profile" className="section-action">Resolve in Profile</Link>
                </div>
                <div className="home-actions-row" style={{ marginTop: '1.5rem' }}>
                  <Link to="/profile" id="home-verify-company" className="btn btn-gold btn-full" style={{ maxWidth: '500px' }}>
                    Update Company Email
                  </Link>
                </div>
                <p className="home-verification-note">You remain hidden from student discovery until verification is complete.</p>
              </>
            )}

            {hasLinkedCompany && isCompanyVerified && (
              <>
                <div className="section-header">
                  <div>
                    <h2>Verified Employee Dashboard</h2>
                    <p>You are visible to GT students and can manage active referral requests from your inbox.</p>
                  </div>
                  <Link to="/inbox" className="section-action">Manage Referrals</Link>
                </div>
                <div className="home-actions-row" style={{ marginTop: '1.5rem' }}>
                  <Link to="/inbox" id="home-verify-company" className="btn btn-gold btn-full" style={{ maxWidth: '500px' }}>
                    View Pending Referrals →
                  </Link>
                </div>
              </>
            )}

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
            {/* Referral dashboard */}
            <section className="home-section card">
              <div className="section-header">
                <div>
                  <h2>Your Referral Dashboard</h2>
                  <p>Browse verified employees, request referrals, and keep your outreach organized.</p>
                </div>
                <Link to="/my-requests" className="section-action">View My Requests</Link>
              </div>
              <div className="home-actions-row" style={{ marginTop: '1.5rem' }}>
                <button
                  id="home-find-verified"
                  className="btn btn-gold"
                  style={{ minWidth: '220px' }}
                  onClick={() => navigate('/find-alumni')}
                >
                  Find Verified Alumni
                </button>
                <button
                  id="home-view-requests"
                  className="btn btn-outline"
                  style={{ minWidth: '220px' }}
                  onClick={() => navigate('/my-requests')}
                >
                  Track My Requests
                </button>
              </div>
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
        {!user && <BlurFadeTextDemo />}
      </div>
    </div>
  );
}
