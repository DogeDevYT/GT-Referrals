import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import './ProfilePage.css';

const MAX_TAGLINE_LENGTH = 140;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MIN_COMPANY_QUERY_LENGTH = 2;

function buildInitialForm(user) {
  if (!user) {
    return {
      name: '',
      tagline: '',
      jobTitle: '',
      department: '',
      companyEmail: '',
      targetRolesInput: '',
    };
  }

  return {
    name: user.name || '',
    tagline: user.tagline || '',
    jobTitle: user.jobTitle || '',
    department: user.department || '',
    companyEmail: user.companyEmail || '',
    targetRolesInput: Array.isArray(user.targetRoles) ? user.targetRoles.join(', ') : '',
  };
}

export default function ProfilePage() {
  const { user, updateProfile, uploadProfilePhoto, refreshUser } = useAuth();
  const [form, setForm] = useState(() => buildInitialForm(user));
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyQuery, setCompanyQuery] = useState('');
  const [companyOptions, setCompanyOptions] = useState([]);
  const [companyLookupLoading, setCompanyLookupLoading] = useState(false);
  const [companyActionLoading, setCompanyActionLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [clubs, setClubs] = useState([]);
  const [clubsLoading, setClubsLoading] = useState(false);
  const [clubActionLoadingId, setClubActionLoadingId] = useState('');
  const [newClubName, setNewClubName] = useState('');
  const [addingClub, setAddingClub] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setForm(buildInitialForm(user));
  }, [user]);

  useEffect(() => {
    if (user?.role !== 'employee') {
      setSelectedCompany(null);
      setCompanyQuery('');
      setCompanyOptions([]);
      return;
    }

    if (user.company && typeof user.company === 'object' && user.company._id) {
      setSelectedCompany({
        _id: user.company._id,
        name: user.company.name || 'Unnamed company',
        logoUrl: user.company.logoUrl || '',
      });
    } else {
      setSelectedCompany(null);
    }

    setCompanyQuery('');
    setCompanyOptions([]);
  }, [user]);

  useEffect(() => {
    if (user?.role !== 'employee') return;

    const query = companyQuery.trim();
    if (query.length < MIN_COMPANY_QUERY_LENGTH) {
      setCompanyOptions([]);
      setCompanyLookupLoading(false);
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      setCompanyLookupLoading(true);
      try {
        const { data } = await api.get('/employees/companies', { params: { q: query } });
        if (!cancelled) {
          setCompanyOptions(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) {
          setCompanyOptions([]);
        }
      } finally {
        if (!cancelled) {
          setCompanyLookupLoading(false);
        }
      }
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [companyQuery, user?.role]);

  useEffect(() => {
    if (!selectedPhoto) {
      setPhotoPreviewUrl('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedPhoto);
    setPhotoPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedPhoto]);

  useEffect(() => {
    let cancelled = false;

    const loadClubs = async () => {
      setClubsLoading(true);
      try {
        const { data } = await api.get('/clubs');
        if (!cancelled) {
          setClubs(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) {
          setClubs([]);
        }
      } finally {
        if (!cancelled) {
          setClubsLoading(false);
        }
      }
    };

    loadClubs();
    return () => {
      cancelled = true;
    };
  }, []);

  const initials = useMemo(() => {
    if (!user?.name) return '?';
    return user.name
      .split(' ')
      .filter(Boolean)
      .map((token) => token[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [user?.name]);

  const resolvedPhoto = photoPreviewUrl || user?.profilePhoto || user?.linkedin?.photo || '';
  const selectedClubIds = new Set((user?.clubs || []).map((club) => (
    typeof club === 'object' ? club._id : club
  )).filter(Boolean));
  const companyQueryTrimmed = companyQuery.trim();
  const normalizedCompanyQuery = companyQueryTrimmed.toLowerCase();
  const hasExactCompanyMatch = normalizedCompanyQuery && companyOptions.some((company) =>
    company.name?.trim().toLowerCase() === normalizedCompanyQuery
  );
  const canCreateCompany =
    user.role === 'employee' &&
    companyQueryTrimmed.length >= MIN_COMPANY_QUERY_LENGTH &&
    !hasExactCompanyMatch;

  if (!user) return null;

  const onFieldChange = (key) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCompanySelect = (company) => {
    if (!company?._id) return;
    setSelectedCompany({
      _id: company._id,
      name: company.name || 'Unnamed company',
      logoUrl: company.logoUrl || '',
    });
    setCompanyQuery('');
    setCompanyOptions([]);
    setError('');
    setSuccess('');
  };

  const handleCreateCompany = async () => {
    const name = companyQueryTrimmed;
    if (name.length < MIN_COMPANY_QUERY_LENGTH) return;

    setCompanyActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = { name };
      const companyEmail = form.companyEmail.trim();
      if (companyEmail.includes('@')) {
        payload.emailDomain = companyEmail.split('@').pop().trim().toLowerCase();
      }

      const { data } = await api.post('/employees/companies', payload);
      if (!data?.company?._id) {
        throw new Error('Could not create company');
      }

      handleCompanySelect(data.company);
      setSuccess(data.created ? 'Company created and selected.' : 'Existing company selected.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add company. Please try again.');
    } finally {
      setCompanyActionLoading(false);
    }
  };

  const clearCompanySelection = () => {
    setSelectedCompany(null);
    setError('');
    setSuccess('');
  };

  const validateProfileForm = () => {
    if (!form.name.trim() || form.name.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }

    if (form.tagline.trim().length > MAX_TAGLINE_LENGTH) {
      return `Tagline must be ${MAX_TAGLINE_LENGTH} characters or fewer`;
    }

    if (/[<>]/.test(form.tagline)) {
      return 'Tagline cannot include HTML characters';
    }

    if (user.role === 'employee' && form.companyEmail && !form.companyEmail.includes('@')) {
      return 'Company email must be a valid email address';
    }

    if (user.role === 'employee' && !selectedCompany?._id) {
      return 'Please select or create your company before saving your profile';
    }

    return '';
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validateProfileForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      name: form.name.trim(),
      tagline: form.tagline.trim(),
    };

    if (user.role === 'employee') {
      payload.jobTitle = form.jobTitle.trim();
      payload.department = form.department.trim();
      payload.companyId = selectedCompany._id;
      const companyEmail = form.companyEmail.trim();
      if (companyEmail) {
        payload.companyEmail = companyEmail;
      }
    }

    if (user.role === 'jobseeker') {
      payload.targetRoles = form.targetRolesInput
        .split(',')
        .map((role) => role.trim())
        .filter(Boolean);
    }

    setSaving(true);
    try {
      await updateProfile(payload);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSelection = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setSelectedPhoto(null);
      setError('Photo must be JPG, PNG, or WEBP.');
      return;
    }

    if (file.size > MAX_PHOTO_BYTES) {
      setSelectedPhoto(null);
      setError('Photo must be 5MB or smaller.');
      return;
    }

    setError('');
    setSuccess('');
    setSelectedPhoto(file);
  };

  const handlePhotoUpload = async () => {
    if (!selectedPhoto) return;

    setUploadingPhoto(true);
    setError('');
    setSuccess('');

    try {
      await uploadProfilePhoto(selectedPhoto);
      setSelectedPhoto(null);
      setSuccess('Profile photo updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not upload your profile photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleClubToggle = async (clubId, shouldJoin) => {
    setClubActionLoadingId(clubId);
    setError('');
    setSuccess('');

    try {
      if (shouldJoin) {
        await api.post(`/clubs/${clubId}/join`);
        setSuccess('Club joined.');
      } else {
        await api.delete(`/clubs/${clubId}/leave`);
        setSuccess('Club left.');
      }
      await refreshUser();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update clubs right now.');
    } finally {
      setClubActionLoadingId('');
    }
  };

  const reloadClubs = async () => {
    try {
      const { data } = await api.get('/clubs');
      setClubs(Array.isArray(data) ? data : []);
    } catch {
      setClubs([]);
    }
  };

  const handleAddClub = async () => {
    const name = newClubName.trim();
    if (!name) return;

    setAddingClub(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await api.post('/clubs', { name });
      const clubId = data?.club?._id;
      if (!clubId) {
        throw new Error('Club was not returned');
      }

      await api.post(`/clubs/${clubId}/join`);
      await Promise.all([refreshUser(), reloadClubs()]);
      setNewClubName('');
      setSuccess(data.created ? 'Club created and joined.' : 'Joined existing club.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add and join club right now.');
    } finally {
      setAddingClub(false);
    }
  };

  return (
    <div className="page-wrapper profile-page fade-in">
      <div className="profile-header">
        <div>
          <h1>Your Profile</h1>
          <p>Keep your information current so referral matches and outreach stay high quality.</p>
        </div>
        <span className="badge badge-navy profile-role-badge">
          {user.role === 'employee' ? 'Employee account' : 'Jobseeker account'}
        </span>
      </div>

      {error && <div className="alert alert-error profile-alert">{error}</div>}
      {success && <div className="alert alert-success profile-alert">{success}</div>}

      <section className="card profile-photo-card">
        <div className="profile-photo-summary">
          <div className="avatar avatar-xl profile-avatar">
            {resolvedPhoto ? <img src={resolvedPhoto} alt={user.name} /> : initials}
          </div>
          <div>
            <h2>{user.name}</h2>
            <p className="profile-photo-subtitle">
              {user.role === 'employee'
                ? user.jobTitle || 'Employee profile'
                : 'Georgia Tech jobseeker profile'}
            </p>
          </div>
        </div>

        <div className="profile-photo-actions">
          <label className="btn btn-outline btn-sm profile-photo-picker">
            Upload photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoSelection}
              hidden
            />
          </label>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handlePhotoUpload}
            disabled={!selectedPhoto || uploadingPhoto}
          >
            {uploadingPhoto ? (
              <>
                <span className="spinner" style={{ width: '1rem', height: '1rem' }} />
                Uploading...
              </>
            ) : (
              'Save photo'
            )}
          </button>
        </div>

        <p className="profile-photo-help">JPG, PNG, or WEBP. Up to 5MB.</p>
      </section>

      <section className="card profile-form-card">
        <form className="profile-form" onSubmit={handleProfileSave}>
          <div className="profile-grid">
            <div className="form-group">
              <label htmlFor="profile-name" className="form-label">Full name</label>
              <input
                id="profile-name"
                className="form-input"
                value={form.name}
                onChange={onFieldChange('name')}
                maxLength={80}
                required
              />
            </div>

            {user.role === 'employee' && (
              <>
                <div className="form-group">
                  <label htmlFor="profile-job-title" className="form-label">Job title</label>
                  <input
                    id="profile-job-title"
                    className="form-input"
                    value={form.jobTitle}
                    onChange={onFieldChange('jobTitle')}
                    maxLength={100}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="profile-department" className="form-label">Department</label>
                  <input
                    id="profile-department"
                    className="form-input"
                    value={form.department}
                    onChange={onFieldChange('department')}
                    maxLength={100}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="profile-company-email" className="form-label">Company email</label>
                  <input
                    id="profile-company-email"
                    className="form-input"
                    type="email"
                    value={form.companyEmail}
                    onChange={onFieldChange('companyEmail')}
                    maxLength={120}
                  />
                </div>
              </>
            )}
          </div>

          {user.role === 'employee' && (
            <div className="form-group profile-field-full">
              <label htmlFor="profile-company-search" className="form-label">Company</label>

              <div className="profile-company-status">
                {selectedCompany ? (
                  <>
                    <span className="profile-company-selected-name">
                      Selected: {selectedCompany.name}
                    </span>
                    <button
                      type="button"
                      className="profile-company-clear"
                      onClick={clearCompanySelection}
                    >
                      Clear
                    </button>
                  </>
                ) : (
                  <span className="profile-company-empty">No company selected yet.</span>
                )}
              </div>

              <input
                id="profile-company-search"
                className="form-input"
                value={companyQuery}
                onChange={(event) => setCompanyQuery(event.target.value)}
                placeholder="Search existing companies or type to add a new one"
              />

              {companyLookupLoading && (
                <span className="profile-company-meta">Searching companies...</span>
              )}

              {!companyLookupLoading && companyOptions.length > 0 && (
                <div className="profile-company-results" role="listbox" aria-label="Company search results">
                  {companyOptions.map((company) => (
                    <button
                      key={company._id}
                      type="button"
                      className={`profile-company-option ${selectedCompany?._id === company._id ? 'active' : ''}`}
                      onClick={() => handleCompanySelect(company)}
                    >
                      <span className="profile-company-option-name">{company.name}</span>
                      {Array.isArray(company.emailDomains) && company.emailDomains.length > 0 && (
                        <span className="profile-company-option-domain">{company.emailDomains[0]}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {canCreateCompany && (
                <button
                  type="button"
                  className="profile-company-create"
                  onClick={handleCreateCompany}
                  disabled={companyActionLoading}
                >
                  {companyActionLoading ? 'Adding company...' : `Add "${companyQueryTrimmed}"`}
                </button>
              )}

              <span className="profile-field-help">
                Select your employer from the list or add it if it does not exist yet.
              </span>
            </div>
          )}

          <div className="form-group profile-field-full">
            <label htmlFor="profile-tagline" className="form-label">Tagline</label>
            <textarea
              id="profile-tagline"
              className="form-input form-textarea"
              value={form.tagline}
              onChange={onFieldChange('tagline')}
              maxLength={MAX_TAGLINE_LENGTH}
              placeholder="Add a short, plain-text line that introduces how you help others."
            />
            <div className="profile-tagline-meta">
              <span>Visible across referral surfaces</span>
              <span>{form.tagline.length}/{MAX_TAGLINE_LENGTH}</span>
            </div>
          </div>

          {user.role === 'jobseeker' && (
            <div className="form-group profile-field-full">
              <label htmlFor="profile-target-roles" className="form-label">Target roles</label>
              <input
                id="profile-target-roles"
                className="form-input"
                value={form.targetRolesInput}
                onChange={onFieldChange('targetRolesInput')}
                placeholder="Software Engineer, Product Manager, Data Scientist"
              />
              <span className="profile-field-help">Separate multiple roles with commas.</span>
            </div>
          )}

          <div className="form-group profile-field-full">
            <label className="form-label">Clubs</label>
            <span className="profile-field-help">
              Join clubs to improve recommendation matching and referral priority with shared members.
            </span>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                className="form-input"
                placeholder="Add a club name"
                value={newClubName}
                onChange={(event) => setNewClubName(event.target.value)}
                maxLength={120}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleAddClub}
                disabled={addingClub || !newClubName.trim()}
              >
                {addingClub ? 'Adding...' : 'Add Club'}
              </button>
            </div>

            {clubsLoading && (
              <div className="profile-clubs-loading">Loading clubs...</div>
            )}

            {!clubsLoading && clubs.length === 0 && (
              <div className="profile-clubs-empty">No clubs available right now.</div>
            )}

            {!clubsLoading && clubs.length > 0 && (
              <div className="profile-clubs-list">
                {clubs.map((club) => {
                  const isMember = selectedClubIds.has(club._id);
                  const isLoading = clubActionLoadingId === club._id;
                  return (
                    <div key={club._id} className="profile-club-item">
                      <div className="profile-club-main">
                        <span className="profile-club-name">{club.name}</span>
                        <span className="profile-club-weight">
                          Weight +{club.priorityWeight ?? 0}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={`btn btn-sm ${isMember ? 'btn-outline' : 'btn-primary'}`}
                        disabled={Boolean(clubActionLoadingId)}
                        onClick={() => handleClubToggle(club._id, !isMember)}
                      >
                        {isLoading ? 'Saving...' : isMember ? 'Leave' : 'Join'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="profile-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner" style={{ width: '1rem', height: '1rem' }} />
                  Saving...
                </>
              ) : (
                'Save profile'
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
