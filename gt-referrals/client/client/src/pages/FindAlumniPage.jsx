import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import EmployeeCard from '../components/EmployeeCard';
import './FindAlumniPage.css';

export default function FindAlumniPage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRecommendations = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/jobseekers/recommendations');
      setEmployees(data);
    } catch (err) {
      setError('Could not load recommendations. Make sure you are signed in as a student.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const filtered = employees.filter((emp) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(q) ||
      emp.company?.name?.toLowerCase().includes(q) ||
      emp.jobTitle?.toLowerCase().includes(q) ||
      emp.linkedin?.headline?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-wrapper fade-in">
      <div className="find-alumni-header">
        <div>
          <h1>Find Verified Alumni</h1>
          <p>Discover GT alumni with verified company profiles, ranked by shared clubs and connections.</p>
        </div>
      </div>

      {/* Search */}
      <div className="find-alumni-search">
        <input
          id="alumni-search-input"
          className="form-input find-search-input"
          placeholder="Search by company, role, or alumni name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button id="alumni-search-btn" className="btn btn-primary" onClick={fetchRecommendations}>
          Search
        </button>
      </div>

      {/* Results */}
      {loading && (
        <div className="find-loading">
          <span className="spinner spinner-navy" style={{ width: '2rem', height: '2rem' }} />
          <p>Loading recommendations…</p>
        </div>
      )}

      {error && !loading && (
        <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No verified alumni found</h3>
          <p>Try adjusting your search, or add target companies to your profile to get recommendations.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <>
          <div className="find-results-meta">
            {filtered.length} alumni found
            {query && ` for "${query}"`}
          </div>
          <div className="find-alumni-grid">
            {filtered.map((emp) => (
              <EmployeeCard key={emp._id} employee={emp} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
