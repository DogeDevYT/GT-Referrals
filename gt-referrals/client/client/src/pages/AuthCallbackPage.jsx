import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function AuthCallbackPage() {
  const [params] = useSearchParams();
  const { loginWithToken, setUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      navigate('/login');
      return;
    }
    // Store token, then fetch the user profile
    localStorage.setItem('gt_token', token);
    const fetchUser = async () => {
      try {
        // Try employee first, then jobseeker
        try {
          const { data } = await api.get('/employees/me');
          loginWithToken(token, data);
        } catch {
          const { data } = await api.get('/jobseekers/me');
          loginWithToken(token, data);
        }
        navigate('/');
      } catch {
        navigate('/login');
      }
    };
    fetchUser();
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <span className="spinner spinner-navy" style={{ width: '2rem', height: '2rem' }} />
      <p style={{ color: 'var(--text-muted)' }}>Signing you in…</p>
    </div>
  );
}
