'use client';

import React, { useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import styles from './Settings.module.css';

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [formData, setFormData] = useState(settings);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updateSettings(formData);
    alert('Settings saved successfully!');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <div className={styles.greenDot}></div>
          <h2>Settings</h2>
        </div>
        <p className={styles.subtitle}>Manage your profile and school information</p>
      </div>
      
      <div className={styles.formCard}>
        <h3>Profile Details</h3>
        <p className={`${styles.subtitle} ${styles.formSubtitle}`}>This information will be displayed on your generated assignments.</p>
        
        <div className={styles.inputGroup}>
          <label>School Name</label>
          <input 
            type="text" 
            name="schoolName"
            value={formData.schoolName} 
            onChange={handleChange}
            className={styles.input}
          />
        </div>

        <div className={styles.inputGroup}>
          <label>School Location (Subtitle)</label>
          <input 
            type="text" 
            name="schoolLocation"
            value={formData.schoolLocation} 
            onChange={handleChange}
            className={styles.input}
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Your Name</label>
          <input 
            type="text" 
            name="userName"
            value={formData.userName} 
            onChange={handleChange}
            className={styles.input}
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Avatar URL</label>
          <input 
            type="text" 
            name="avatarUrl"
            value={formData.avatarUrl} 
            onChange={handleChange}
            className={styles.input}
            placeholder="https://example.com/avatar.png"
          />
        </div>

        <div className={styles.actions}>
          <button 
            onClick={handleSave}
            className={styles.saveBtn}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
