'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './BottomNav.module.css';
export default function BottomNav() {
  const pathname = usePathname();
  const navItems = [
    { name: 'Home', href: '/', icon: '/icons/home.svg' },
    { name: 'Assignments', href: '/assignments', icon: '/icons/file-text.svg' },
    { name: 'Library', href: '#', icon: '/icons/library.svg' },
    { name: 'AI Toolkit', href: '#', icon: '/icons/book.svg' },
  ];
  return (
    <nav className={styles.bottomNav}>
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <Link key={item.name} href={item.href} className={`${styles.navItem} ${isActive ? styles.active : ''}`}>
            <img src={item.icon} alt={item.name} className={styles.icon} />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
