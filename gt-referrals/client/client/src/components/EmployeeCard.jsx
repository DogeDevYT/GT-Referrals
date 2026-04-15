import { useState } from 'react';
import RequestReferralModal from './RequestReferralModal';
import './EmployeeCard.css';

export default function EmployeeCard({ employee, showRequestButton = true }) {
  const [showModal, setShowModal] = useState(false);
  const [requested, setRequested] = useState(false);

  const initials = employee.name
    ? employee.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const companyName = employee.company?.name || 'Unknown Company';

  return (
    <>
      <div className="employee-card card fade-in">
        <div className="employee-card-top">
          <div className="avatar avatar-lg employee-avatar">
            {employee.linkedin?.photo
              ? <img src={employee.linkedin.photo} alt={employee.name} />
              : initials}
          </div>
          <div className="employee-info">
            <span className="employee-name">{employee.name}</span>
            <span className="employee-title">
              {employee.jobTitle || employee.linkedin?.headline || 'GT Alumni'}
            </span>
            <span className="employee-company">{companyName}</span>
          </div>
          {employee.recommendationScore > 0 && (
            <div className="rec-score">
              <span className="badge badge-gold">★ {employee.recommendationScore} match</span>
            </div>
          )}
        </div>

        {employee.sharedClubs?.length > 0 && (
          <div className="employee-clubs">
            {employee.sharedClubs.map((club) => (
              <span key={club._id || club} className="badge badge-navy">{club.name}</span>
            ))}
          </div>
        )}

        {showRequestButton && (
          <button
            className={`btn btn-full ${requested ? 'btn-outline' : 'btn-gold'}`}
            onClick={() => !requested && setShowModal(true)}
            disabled={requested}
            style={{ marginTop: '1rem' }}
          >
            {requested ? '✓ Request Sent' : 'Request Referral'}
          </button>
        )}
      </div>

      {showModal && (
        <RequestReferralModal
          employee={employee}
          onClose={() => setShowModal(false)}
          onSuccess={() => setRequested(true)}
        />
      )}
    </>
  );
}
