'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Sparkles } from 'lucide-react';
import Cookies from 'js-cookie';
import { useSettings } from '@/context/SettingsContext';
import styles from './Sidebar.module.css';
export default function Sidebar() {
  const pathname = usePathname();
  const { settings } = useSettings();
  const [assignmentCount, setAssignmentCount] = useState(0);
  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/assignments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAssignmentCount(data.length);
      })
      .catch(console.error);
  }, [pathname]);
  const navItems = [
    { name: 'Home', href: '/', icon: '/icons/home.svg' },
    { name: 'My Groups', href: '#', icon: '/icons/group.svg' },
    { name: 'Assignments', href: '/assignments', icon: '/icons/file-text.svg', badge: assignmentCount > 0 ? assignmentCount : undefined },
    { name: 'AI Teacher\'s Toolkit', href: '#', icon: '/icons/book.svg' },
    { name: 'My Library', href: '#', icon: '/icons/library.svg' },
  ];
  return (
    <aside className="sidebar">
      <Link href="/assignments" className={styles.logo}>
        <img src="/images/logo.png" alt="VedaAI Logo" className={styles.logoImage} />
        <h2>VedaAI</h2>
      </Link>
      <Link href="/assignments/new" className={styles.noDecoration}>
        <button className={`btn btn-primary ${styles.createBtn}`}>
          <Sparkles size={16} /> Create Assignment
        </button>
      </Link>
      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link key={item.name} href={item.href} className={`${styles.navItem} ${isActive ? styles.active : ''}`}>
              {}
              <img src={`${item.icon}`} alt={`icon`} className={styles.icon} />
              <span>{item.name}</span>
              {item.badge && <span className={styles.badge}>{item.badge}</span>}
            </Link>
          );
        })}
      </nav>
      <div className={styles.sidebarFooter}>
        <Link href="/settings" className={styles.navItem}>
          <Settings size={20} className={styles.icon} />
          <span>Settings</span>
        </Link>
        <div className={styles.schoolInfo}>
          <img src={settings.avatarUrl} alt="School" className={styles.schoolLogo} />
          <div>
            <div className={styles.schoolName}>{settings.schoolName}</div>
            <div className={styles.schoolLocation}>{settings.schoolLocation}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
