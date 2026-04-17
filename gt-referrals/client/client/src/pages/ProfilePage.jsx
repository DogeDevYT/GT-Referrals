import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css';

const MAX_TAGLINE_LENGTH = 140;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

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
  const { user, updateProfile, uploadProfilePhoto } = useAuth();
  const [form, setForm] = useState(() => buildInitialForm(user));
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setForm(buildInitialForm(user));
  }, [user]);

  useEffect(() => {
    if (!selectedPhoto) {
      setPhotoPreviewUrl('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedPhoto);
    setPhotoPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedPhoto]);

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

  if (!user) return null;

  const onFieldChange = (key) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
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
