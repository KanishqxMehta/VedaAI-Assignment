'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Filter, MoreVertical, Plus, Calendar } from 'lucide-react';
import Cookies from 'js-cookie';
import styles from './Assignments.module.css';

interface Assignment {
  _id: string;
  title: string;
  dueDate: string;
  status: string;
  createdAt: string;
  difficulty?: string;
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pending filter states (used inside modal)
  const [filterDifficulty, setFilterDifficulty] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Active filter states (used for actual filtering)
  const [activeFilterDifficulty, setActiveFilterDifficulty] = useState('All');
  const [activeStartDate, setActiveStartDate] = useState('');
  const [activeEndDate, setActiveEndDate] = useState('');
  
  const [showFilterBlob, setShowFilterBlob] = useState(false);
  
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [currentStartMonth, setCurrentStartMonth] = useState(new Date());
  const [currentEndMonth, setCurrentEndMonth] = useState(new Date());

  const filterRef = useRef<HTMLDivElement>(null);
  const startCalendarRef = useRef<HTMLDivElement>(null);
  const endCalendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleCalendarClickOutside(event: MouseEvent) {
      if (showStartCalendar && startCalendarRef.current && !startCalendarRef.current.contains(event.target as Node)) {
        setShowStartCalendar(false);
      }
      if (showEndCalendar && endCalendarRef.current && !endCalendarRef.current.contains(event.target as Node)) {
        setShowEndCalendar(false);
      }
    }
    document.addEventListener('mousedown', handleCalendarClickOutside);
    return () => document.removeEventListener('mousedown', handleCalendarClickOutside);
  }, [showStartCalendar, showEndCalendar]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        if (showFilterBlob) {
          // Reset pending states to match active states when clicking outside
          setFilterDifficulty(activeFilterDifficulty);
          setStartDate(activeStartDate);
          setEndDate(activeEndDate);
          setShowFilterBlob(false);
          setShowStartCalendar(false);
          setShowEndCalendar(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterBlob, activeFilterDifficulty, activeStartDate, activeEndDate]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (confirm('Are you sure you want to delete this assignment?')) {
      try {
        const token = Cookies.get('token');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/assignments/${id}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        window.location.reload();
      } catch (err) {
        console.error('Failed to delete', err);
      }
    }
    setOpenMenuId(null);
  };

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/assignments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAssignments(data);
        } else {
          setAssignments([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch assignments:', err);
        setAssignments([]);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  if (assignments.length === 0) {
    return (
      <div className={styles.emptyState}>
        <img
          src="/images/empty_assignments.png"
          alt="No assignments"
          className={styles.emptyIllustration}
        />

        <h3>No assignments yet</h3>

        <p>
          Create your first assignment to start collecting and grading student
          submissions. You can set up rubrics, define marking criteria, and let AI
          assist with grading.
        </p>

        <Link href="/assignments/new">
          <button className="btn btn-primary">
            <Plus size={16} />
            Create Your First Assignment
          </button>
        </Link>
      </div>
    );
  }

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilterDifficulty === 'All' || a.difficulty === activeFilterDifficulty;
    
    // a.createdAt exists and might be like "2024-05-31T05:22:33Z".
    // We only want the date part for comparison.
    let matchesStartDate = true;
    let matchesEndDate = true;
    if (activeStartDate && a.createdAt) {
      matchesStartDate = new Date(a.createdAt) >= new Date(activeStartDate);
    }
    if (activeEndDate && a.createdAt) {
      // End date should include the end of the day, so we compare carefully
      const endD = new Date(activeEndDate);
      endD.setHours(23, 59, 59, 999);
      matchesEndDate = new Date(a.createdAt) <= endD;
    }
    
    return matchesSearch && matchesFilter && matchesStartDate && matchesEndDate;
  });

  let dateText = '';
  if (activeStartDate && activeEndDate) {
    dateText = `${new Date(activeStartDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})} - ${new Date(activeEndDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}`;
  } else if (activeStartDate) {
    dateText = `From ${new Date(activeStartDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}`;
  } else if (activeEndDate) {
    dateText = `Until ${new Date(activeEndDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}`;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <div className={styles.greenDot}></div>
          <h2>Assignments</h2>
        </div>
        <p>Manage and track all your assignments</p>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterContainer} ref={filterRef}>
          <div className={styles.filterBtn} onClick={() => setShowFilterBlob(!showFilterBlob)}>
            <Filter size={18} />
            <span>Filters</span>

            {activeFilterDifficulty !== 'All' && (
              <span className={styles.filterChip}>
                {activeFilterDifficulty}
              </span>
            )}

            {dateText && (
              <span className={styles.filterChip}>
                {dateText}
              </span>
            )}
          </div>
          {showFilterBlob && (
            <div className={`${styles.filterBlob} ${styles.filterBlobContainer}`}>
              <div className={styles.filterSectionTitle}>Difficulty</div>
              <div className={styles.filterChipsContainer}>
              {['All', 'Easy', 'Medium', 'Hard', 'Mixed'].map(level => (
                <div 
                  key={level} 
                  onClick={() => setFilterDifficulty(level)}
                  className={`${styles.levelChip} ${filterDifficulty === level ? styles.levelChipActive : ''}`}
                >
                  {level}
                </div>
              ))}
              </div>

              <div className={styles.filterDivider}></div>

              <div className={styles.filterSectionTitle}>Date Range</div>
              <div className={styles.dateRangeContainer}>
                <div>
                  <label className={styles.dateLabel}>Start Date</label>
                  <div className={styles.dateInputWrapper} ref={startCalendarRef}>
                    <input 
                      type="text"
                      placeholder="DD-MM-YYYY"
                      value={startDate ? new Date(startDate).toLocaleDateString('en-GB').replace(/\//g, '-') : ''} 
                      onClick={() => { setShowStartCalendar(!showStartCalendar); setShowEndCalendar(false); }}
                      readOnly
                      className={styles.dateInput}
                    />
                    <Calendar className={styles.calendarIcon} size={18} style={{ pointerEvents: 'none' }} />
                    
                    {showStartCalendar && (
                      <div className={styles.customCalendar}>
                        <div className={styles.calendarHeader}>
                          <button onClick={(e) => { e.preventDefault(); setCurrentStartMonth(new Date(currentStartMonth.getFullYear(), currentStartMonth.getMonth() - 1, 1)) }}>&lt;</button>
                          <span>{currentStartMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                          <button onClick={(e) => { e.preventDefault(); setCurrentStartMonth(new Date(currentStartMonth.getFullYear(), currentStartMonth.getMonth() + 1, 1)) }}>&gt;</button>
                        </div>
                        <div className={styles.calendarGrid}>
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className={styles.calDayHeader}>{d}</div>)}
                          {Array.from({ length: new Date(currentStartMonth.getFullYear(), currentStartMonth.getMonth(), 1).getDay() }).map((_, i) => <div key={`empty-start-${i}`} />)}
                          {Array.from({ length: new Date(currentStartMonth.getFullYear(), currentStartMonth.getMonth() + 1, 0).getDate() }).map((_, i) => {
                            const day = i + 1;
                            const dateStr = new Date(currentStartMonth.getFullYear(), currentStartMonth.getMonth(), day).toISOString().split('T')[0];
                            return (
                              <div 
                                key={day} 
                                className={`${styles.calDay} ${startDate === dateStr ? styles.calDaySelected : ''}`}
                                onClick={(e) => { 
                                  e.preventDefault(); 
                                  setStartDate(dateStr); 
                                  setShowStartCalendar(false); 
                                }}
                              >
                                {day}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className={styles.dateLabel}>End Date</label>
                  <div className={styles.dateInputWrapper} ref={endCalendarRef}>
                    <input 
                      type="text"
                      placeholder="DD-MM-YYYY"
                      value={endDate ? new Date(endDate).toLocaleDateString('en-GB').replace(/\//g, '-') : ''} 
                      onClick={() => { setShowEndCalendar(!showEndCalendar); setShowStartCalendar(false); }}
                      readOnly
                      className={styles.dateInput}
                    />
                    <Calendar className={styles.calendarIcon} size={18} style={{ pointerEvents: 'none' }} />

                    {showEndCalendar && (
                      <div className={styles.customCalendar}>
                        <div className={styles.calendarHeader}>
                          <button onClick={(e) => { e.preventDefault(); setCurrentEndMonth(new Date(currentEndMonth.getFullYear(), currentEndMonth.getMonth() - 1, 1)) }}>&lt;</button>
                          <span>{currentEndMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                          <button onClick={(e) => { e.preventDefault(); setCurrentEndMonth(new Date(currentEndMonth.getFullYear(), currentEndMonth.getMonth() + 1, 1)) }}>&gt;</button>
                        </div>
                        <div className={styles.calendarGrid}>
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className={styles.calDayHeader}>{d}</div>)}
                          {Array.from({ length: new Date(currentEndMonth.getFullYear(), currentEndMonth.getMonth(), 1).getDay() }).map((_, i) => <div key={`empty-end-${i}`} />)}
                          {Array.from({ length: new Date(currentEndMonth.getFullYear(), currentEndMonth.getMonth() + 1, 0).getDate() }).map((_, i) => {
                            const day = i + 1;
                            const dateStr = new Date(currentEndMonth.getFullYear(), currentEndMonth.getMonth(), day).toISOString().split('T')[0];
                            return (
                              <div 
                                key={day} 
                                className={`${styles.calDay} ${endDate === dateStr ? styles.calDaySelected : ''}`}
                                onClick={(e) => { 
                                  e.preventDefault(); 
                                  setEndDate(dateStr); 
                                  setShowEndCalendar(false); 
                                }}
                              >
                                {day}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.filterActions}>
                <button 
                  onClick={() => {
                    setFilterDifficulty('All');
                    setStartDate('');
                    setEndDate('');
                    setActiveFilterDifficulty('All');
                    setActiveStartDate('');
                    setActiveEndDate('');
                    setShowFilterBlob(false);
                    setShowStartCalendar(false);
                    setShowEndCalendar(false);
                  }} 
                  className={styles.clearAllBtn}
                >
                  Clear All
                </button>
                <button 
                  onClick={() => {
                    setActiveFilterDifficulty(filterDifficulty);
                    setActiveStartDate(startDate);
                    setActiveEndDate(endDate);
                    setShowFilterBlob(false);
                  }} 
                  className={styles.applyBtn}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} size={18} />
          <input 
            type="text" 
            placeholder="Search Assignment" 
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.grid}>
        {filteredAssignments.map((assignment) => (
          <Link href={`/assignments/${assignment._id}`} key={assignment._id} className={styles.cardLink}>
            <div className={styles.card}>
              <div className={`${styles.cardHeader} ${styles.relative}`}>
                <div className={styles.cardHeaderFlex}>
                  <h3>{assignment.title}</h3>
                  {assignment.difficulty && (
                    <span className={`${styles.difficultyPill} ${
                      assignment.difficulty === 'Easy' ? styles.diffEasy :
                      assignment.difficulty === 'Medium' ? styles.diffMedium :
                      assignment.difficulty === 'Hard' ? styles.diffHard :
                      styles.diffMixed
                    }`}>
                      {assignment.difficulty}
                    </span>
                  )}
                </div>
                <button 
                  className={styles.moreBtn} 
                  onClick={(e) => {
                    e.preventDefault();
                    setOpenMenuId(openMenuId === assignment._id ? null : assignment._id);
                  }}
                >
                  <MoreVertical size={24} />
                </button>
                {openMenuId === assignment._id && (
                  <div className={styles.dropdownMenu}>
                    <div className={styles.dropdownItem} onClick={(e) => { e.preventDefault(); router.push(`/assignments/${assignment._id}`); }}>View Assignment</div>
                    <div className={`${styles.dropdownItem} ${styles.dropdownItemRed}`} onClick={(e) => handleDelete(e, assignment._id)}>Delete</div>
                  </div>
                )}
              </div>
              <div className={styles.cardFooter}>
                <div><span>Assigned on :</span> {new Date(assignment.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-')}</div>
                <div><span>Due :</span> {new Date(assignment.dueDate).toLocaleDateString('en-GB').replace(/\//g, '-')}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className={styles.fabContainer}>
        <Link href="/assignments/new" className={styles.newAssignmentBtn}>
          <button className={styles.fab}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Create Assignment</span>
          </button>
        </Link>
      </div>
    </div>
  );
}
