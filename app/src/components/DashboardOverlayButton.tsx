import { useAuth } from '../hooks/useAuth';
import adminIcon from '../../public/adminicon.png';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function DashboardOverlayButton() {
  const { userData, isWriter, isEditor, isSuperUser } = useAuth();
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only show if signed in and has staff role
    setVisible(
      !!userData && (isWriter() || isEditor() || isSuperUser()) && location.pathname !== '/dashboard'
    );
  }, [userData, location.pathname, isWriter, isEditor, isSuperUser]);

  if (!visible) return null;

  return (
    <button
      onClick={() => navigate('/dashboard')}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1000,
        background: 'white',
        borderRadius: '50%',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        padding: '12px',
        border: '2px solid #232425',
        cursor: 'pointer',
        width: '56px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label="Go to dashboard"
    >
      <img src={adminIcon} alt="Dashboard" style={{ width: '32px', height: '32px' }} />
    </button>
  );
}
