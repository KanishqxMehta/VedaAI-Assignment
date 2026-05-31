'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import styles from './TopNav.module.css';

export default function TopNav() {
  const pathname = usePathname();
  const { settings } = useSettings();
  const { user, logout } = useAuth();
  const isMainPage = pathname === '/assignments';
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={styles.topNav}>
      <Link href="/assignments" className={styles.mobileLogo} style={{ textDecoration: 'none', color: 'inherit' }}>
        <img src="/images/logo.png" alt="VedaAI Logo" />
        <h2>VedaAI</h2>
      </Link>

      <Link href="/assignments" className={styles.breadcrumbs}>
        {!isMainPage && <span>←</span>}
        <span>Assignments</span>
      </Link>
      
      <div className={styles.userProfile} ref={dropdownRef}>
        <span className={styles.notificationIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          <span className={styles.notificationDot}></span>
        </span>
        <div className={styles.userMenu} onClick={() => setDropdownOpen(!dropdownOpen)}>
          <img src={settings.avatarUrl || '/images/default-avatar.png'} alt="User" className={styles.userAvatar} />
          <span className={styles.userName}>{user?.name || 'User'}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
          
          {dropdownOpen && (
            <div className={styles.dropdownMenu}>
              <Link href="/settings" onClick={() => setDropdownOpen(false)} className={styles.dropdownItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                Settings
              </Link>
              <button 
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }} 
                className={`${styles.dropdownItem} ${styles.dropdownItemLogout}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Logout
              </button>
            </div>
          )}
        </div>
        <button className={styles.mobileMenuBtn} onClick={() => setDropdownOpen(!dropdownOpen)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </div>
    </header>
  );
}
