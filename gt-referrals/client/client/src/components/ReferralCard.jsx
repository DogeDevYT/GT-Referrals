import './ReferralCard.css';

const STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  submitted: 'Submitted',
  expired: 'Expired',
};

export default function ReferralCard({ referral, onApprove, onReject, viewAs }) {
  const isEmployee = viewAs === 'employee';
  const other = isEmployee ? referral.jobseeker : referral.employee;
  const otherName = other?.name || 'Unknown';
  const otherInitials = otherName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const avatarSrc = other?.profilePhoto || other?.linkedin?.photo || '';

  return (
    <div className={`referral-card card fade-in status-${referral.status}`}>
      <div className="referral-card-header">
        <div className="referral-card-who">
          <div className="avatar">
            {avatarSrc
              ? <img src={avatarSrc} alt={otherName} />
              : otherInitials}
          </div>
          <div>
            <div className="referral-card-name">{otherName}</div>
            <div className="referral-card-sub">
              {isEmployee ? other?.gtEmail : other?.jobTitle}
            </div>
          </div>
        </div>
        <span className={`badge badge-${referral.status}`}>
          {STATUS_LABELS[referral.status] || referral.status}
        </span>
      </div>

      <div className="referral-card-body">
        <div className="referral-job-info">
          <span className="referral-job-title">{referral.jobTitle}</span>
          {referral.company?.name && (
            <span className="referral-company">{referral.company.name}</span>
          )}
          {referral.jobUrl && (
            <a href={referral.jobUrl} target="_blank" rel="noopener noreferrer" className="referral-link">
              View posting ↗
            </a>
          )}
        </div>

        {referral.message && (
          <p className="referral-message">"{referral.message}"</p>
        )}

        <div className="referral-meta">
          <span className="badge badge-navy">
            {referral.creditsUsed} credit{referral.creditsUsed !== 1 ? 's' : ''}
          </span>
          {referral.priorityScore > 0 && (
            <span className="badge badge-gold">★ Priority {referral.priorityScore}</span>
          )}
          {referral.sharedClubs?.length > 0 && (
            <>
              {referral.sharedClubs.map((club) => (
                <span key={club._id || club} className="badge badge-gold">
                  🎓 {club.name || 'Shared club'}
                </span>
              ))}
            </>
          )}
        </div>
      </div>

      {isEmployee && referral.status === 'pending' && (
        <div className="referral-card-actions">
          <button className="btn btn-success btn-sm" onClick={() => onApprove(referral._id)}>
            ✓ Approve
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => onReject(referral._id)}>
            ✕ Reject
          </button>
        </div>
      )}

      {referral.employeeNote && (
        <div className="referral-note">
          <span className="referral-note-label">Note: </span>
          {referral.employeeNote}
        </div>
      )}
    </div>
  );
}
