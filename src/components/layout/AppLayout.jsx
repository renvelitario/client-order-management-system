import { useState, useEffect, useRef } from 'react';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import '../../styles/components/header.css';

const AppLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const sidebarToggleRef = useRef(null);

  useEffect(() => {
    if (!isSidebarOpen) {
      return undefined;
    }

    const isMobileView = window.matchMedia('(max-width: 980px)').matches;
    if (!isMobileView) {
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handlePointerDownOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !sidebarToggleRef.current?.contains(event.target)
      ) {
        setIsSidebarOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDownOutside, true);
    document.addEventListener('touchstart', handlePointerDownOutside, true);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener('mousedown', handlePointerDownOutside, true);
      document.removeEventListener('touchstart', handlePointerDownOutside, true);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isSidebarOpen]);

  return (
    <>
      <div
        className={`sidebar-backdrop${isSidebarOpen ? ' is-open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden={!isSidebarOpen}
      />
      
      <div className="app-shell">
        <Topbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} sidebarToggleRef={sidebarToggleRef} />
        <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} sidebarRef={sidebarRef} />
        
        <main className="app-main">
          <div className="app-content">
            {children}
          </div>
        </main>
      </div>
    </>
  );
};

export default AppLayout;
