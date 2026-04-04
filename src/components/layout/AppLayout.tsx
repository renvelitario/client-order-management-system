import { useState, useEffect, useRef } from 'react';
import type { Dispatch, ReactNode, RefObject, SetStateAction } from 'react';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import DeliveryNav from './DeliveryNav';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/components/header.css';

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { isAdmin } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const sidebarToggleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isAdmin || !isSidebarOpen) {
      return undefined;
    }

    const isMobileView = window.matchMedia('(max-width: 980px)').matches;
    if (!isMobileView) {
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handlePointerDownOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (
        sidebarRef.current &&
        target &&
        !sidebarRef.current.contains(target) &&
        !sidebarToggleRef.current?.contains(target)
      ) {
        setIsSidebarOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
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
  }, [isAdmin, isSidebarOpen]);

  return (
    <>
      {isAdmin && (
        <div
          className={`sidebar-backdrop${isSidebarOpen ? ' is-open' : ''}`}
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden={!isSidebarOpen}
        />
      )}
      
      <div className="app-shell">
        <Topbar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen as Dispatch<SetStateAction<boolean>>}
          sidebarToggleRef={sidebarToggleRef as RefObject<HTMLButtonElement>}
          showSidebarToggle={isAdmin}
        />
        {isAdmin ? (
          <Sidebar
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen as Dispatch<SetStateAction<boolean>>}
            sidebarRef={sidebarRef as RefObject<HTMLElement>}
          />
        ) : (
          <DeliveryNav />
        )}
        
        <main className={`app-main${isAdmin ? '' : ' app-main-delivery'}`}>
          <div className="app-content">
            {children}
          </div>
        </main>
      </div>
    </>
  );
};

export default AppLayout;
