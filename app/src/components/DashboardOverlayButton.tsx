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
    <img
      src={adminIcon}
      alt="Dashboard"
      onClick={() => navigate('/dashboard')}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1000,
        cursor: 'pointer',
        width: '56px',
        height: '56px',
        transition: 'filter 0.2s',
      }}
      aria-label="Go to dashboard"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          navigate('/dashboard');
        }
      }}
      onMouseOver={e => {
        (e.currentTarget as HTMLImageElement).style.filter = 'brightness(0.85)';
      }}
      onMouseOut={e => {
        (e.currentTarget as HTMLImageElement).style.filter = '';
      }}
    />
  );
}
