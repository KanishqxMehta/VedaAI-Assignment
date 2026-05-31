'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { UploadCloud, Plus, X, Calendar, Mic } from 'lucide-react';
import styles from './NewAssignment.module.css';
interface QuestionType {
  id: string;
  type: string;
  count: number;
  marks: number;
  note?: string;
  showNote?: boolean;
}
export default function NewAssignmentPage() {
  const getLocalDateString = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [assignmentName, setAssignmentName] = useState('');
  const [subject, setSubject] = useState('');
  const [classLevel, setClassLevel] = useState('8');
  const [duration, setDuration] = useState('1 Hour');
  const [difficulty, setDifficulty] = useState('Mixed');
  const [dueDate, setDueDate] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImage, setUploadedImage] = useState<{ data: string, mimeType: string } | null>(null);
  // Calendar state
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
    const calendarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleCalendarClickOutside(event: MouseEvent) {
      if (showCalendar && calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    }
    document.addEventListener('mousedown', handleCalendarClickOutside);
    return () => document.removeEventListener('mousedown', handleCalendarClickOutside);
  }, [showCalendar]);
  const today = getLocalDateString(new Date());
  const totalQuestions = questionTypes.reduce((acc, curr) => acc + curr.count, 0);
  const totalMarks = questionTypes.reduce((acc, curr) => acc + (curr.count * curr.marks), 0);
  const handleUpdateType = (id: string, field: string, value: string | number | boolean) => {
    if ((field === 'count' || field === 'marks') && (value as number) < 0) return;
    setQuestionTypes(types => types.map(t => t.id === id ? { ...t, [field]: value } : t));
  };
  const handleRemoveType = (id: string) => {
    setQuestionTypes(types => types.filter(t => t.id !== id));
  };
  const handleAddType = () => {
    setQuestionTypes([...questionTypes, { id: Date.now().toString(), type: 'Multiple Choice Questions', count: 1, marks: 1 }]);
  };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
            setAdditionalInfo(prev => prev + '\n\n[Uploaded Text]:\n' + e.target?.result);
        };
        reader.readAsText(file);
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = (e.target?.result as string).split(',')[1];
            setUploadedImage({ data: base64, mimeType: file.type });
        };
        reader.readAsDataURL(file);
      }
    }
  };
  const isStep1Valid = Boolean(assignmentName && subject && classLevel && duration && difficulty);
  const isStep2Valid = questionTypes.length > 0 && totalQuestions > 0 && totalMarks > 0;
  const handleNextStep = () => {
    setError('');
    if (!isStep1Valid) {
      setError('Please fill in all basic details.');
      return;
    }
    setStep(2);
  };
  const handleSubmit = async () => {
    setError('');
    if (!isStep2Valid) {
      setError('Please add at least one question type with valid counts.');
      return;
    }
    // Validation
    if (!dueDate) {
      setError('Please select a due date.');
      return;
    }
    if (new Date(dueDate) < new Date(today)) {
      setError('Due date cannot be in the past.');
      return;
    }
    if (questionTypes.length === 0) {
      setError('Please add at least one question type.');
      return;
    }
    if (totalQuestions === 0 || totalMarks === 0) {
      setError('Total questions and marks must be greater than 0.');
      return;
    }
    setLoading(true);
    try {
      const token = Cookies.get('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: assignmentName,
          subject,
          classLevel,
          duration,
          difficulty,
          dueDate,
          questionsConfig: questionTypes,
          additionalInfo,
          uploadedImage
        })
      });
      if (!response.ok) {
        throw new Error(`Failed to create assignment (Status: ${response.status})`);
      }
      const data = await response.json();
      router.push(`/assignments/${data._id}`);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An error occurred while creating the assignment.');
    }
    setLoading(false);
  };
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <div className={styles.greenDot}></div>
          <h2>Create Assignment</h2>
        </div>
        <p className={styles.subtitle}>Set up a new assignment for your students</p>
        <div className={styles.progressContainer}>
          <div className={`${styles.progressBar} ${step >= 1 ? styles.progressActive : styles.progressInactive}`}></div>
          <div className={`${styles.progressBar} ${step >= 2 ? styles.progressActive : styles.progressInactive}`}></div>
        </div>
      </div>
      {step === 1 && (
        <>
        <div className={styles.formCard}>
          <h3>Assignment Details</h3>
          <p className={styles.subtitle}>Basic information about your assignment</p>
          <div className={`${styles.inputGroup} ${styles.marginTop24}`}>
            <label>Assignment Name <span className={styles.requiredAsterisk}>*</span></label>
            <input 
              type="text" 
              placeholder="e.g., Mid-Term Science Test" 
              className={styles.input} 
              value={assignmentName}
              onChange={e => setAssignmentName(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Subject <span className={styles.requiredAsterisk}>*</span></label>
            <input 
              type="text" 
              placeholder="e.g., Science, Mathematics" 
              className={styles.input} 
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Class/Standard <span className={styles.requiredAsterisk}>*</span></label>
            <select 
              className={styles.input} 
              value={classLevel}
              onChange={e => setClassLevel(e.target.value)}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                <option key={n} value={n.toString()}>Class {n}</option>
              ))}
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label>Duration <span className={styles.requiredAsterisk}>*</span></label>
            <select 
              className={styles.input} 
              value={duration}
              onChange={e => setDuration(e.target.value)}
            >
              <option value="30 Minutes">30 Minutes</option>
              <option value="45 Minutes">45 Minutes</option>
              <option value="1 Hour">1 Hour</option>
              <option value="1.5 Hours">1.5 Hours</option>
              <option value="2 Hours">2 Hours</option>
              <option value="3 Hours">3 Hours</option>
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label>Difficulty <span className={styles.requiredAsterisk}>*</span></label>
            <select 
              className={styles.input} 
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
              <option value="Mixed">Mixed (Default)</option>
            </select>
          </div>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
        </div>
        <div className={styles.actions}>
          <button className={styles.prevBtn} onClick={() => router.back()}>Cancel</button>
          <button 
            className={`${styles.nextBtn} ${!isStep1Valid ? styles.btnDisabled : ''}`} 
            onClick={handleNextStep}
            disabled={!isStep1Valid}
          >
            Next →
          </button>
        </div>
        </>
      )}
      {step === 2 && (
        <>
        <div className={styles.formCard}>
          <h3>Upload Material - Selector</h3>
          <p className={styles.subtitle}>Upload base document and configure questions</p>
          <div className={`${styles.uploadArea} ${styles.pointerCursor}`} onClick={() => fileInputRef.current?.click()}>
            <input 
              type="file" 
              ref={fileInputRef} 
              className={styles.hiddenInput} 
              onChange={handleFileUpload} 
              accept="image/jpeg,image/png,text/plain,application/pdf" 
            />
            {uploadedFile ? (
               <div className={styles.flexColCenter}>
                  <UploadCloud size={32} className={`${styles.uploadIcon} ${styles.uploadIconSuccess}`} />
                  <p className={styles.uploadText}>{uploadedFile.name}</p>
                  <p className={styles.uploadSubtext}>{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button className={styles.browseBtn} onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}>Remove File</button>
               </div>
            ) : (
               <div className={styles.flexColCenter}>
                 <UploadCloud size={32} className={styles.uploadIcon} />
                 <p className={styles.uploadText}>Choose a file or drag & drop it here</p>
                 <p className={styles.uploadSubtext}>JPEG, PNG, upto 10MB</p>
                 <button className={styles.browseBtn} onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>Browse Files</button>
               </div>
            )}
          </div>
          <p className={styles.uploadHelp}>Upload images of your preferred document/image</p>
          <div className={`${styles.inputGroup} ${styles.relative}`}>
            <label>Due Date <span className={styles.requiredAsterisk}>*</span></label>
            <div className={styles.dateInputWrapper} onClick={() => setShowCalendar(!showCalendar)}>
              <input 
                type="text"
                placeholder="DD-MM-YYYY"
                value={dueDate ? new Date(dueDate).toLocaleDateString('en-GB').replace(/\//g, '-') : ''}
                readOnly
                className={`${styles.input} ${styles.pointerCursor}`}
              />
              <Calendar className={styles.calendarIcon} size={18} />
            </div>
            {showCalendar && (
              <div className={styles.customCalendar} ref={calendarRef}>
                <div className={styles.calendarHeader}>
                  <button onClick={(e) => { e.preventDefault(); setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)) }}>&lt;</button>
                  <span>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                  <button onClick={(e) => { e.preventDefault(); setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)) }}>&gt;</button>
                </div>
                <div className={styles.calendarGrid}>
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className={styles.calDayHeader}>{d}</div>)}
                  {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, i) => <div key={`empty-${i}`} />)}
                  {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = getLocalDateString(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
                    const isPast = new Date(dateStr) < new Date(today);
                    return (
                      <div 
                        key={day} 
                        className={`${styles.calDay} ${isPast ? styles.calDayPast : ''} ${dueDate === dateStr ? styles.calDaySelected : ''}`}
                        onClick={(e) => { 
                          e.preventDefault(); 
                          if (!isPast) { 
                            setDueDate(dateStr); 
                            setShowCalendar(false); 
                          }
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
          <div className={styles.questionTypesSection}>
            <div className={styles.questionTypesHeader}>
              <label>Question Type</label>
              <div className={styles.headerLabels}>
                <span>No. of Questions</span>
                <span>Marks</span>
              </div>
            </div>
            {questionTypes.map((qt) => (
              <div key={qt.id} className={styles.questionTypeRowWrapper}>
                <div className={styles.questionTypeRow}>
                  <div className={styles.typeSelect}>
                    <select value={qt.type} onChange={e => setQuestionTypes(types => types.map(t => t.id === qt.id ? { ...t, type: e.target.value } : t))}>
                      <option value="Multiple Choice Questions">Multiple Choice Questions</option>
                      <option value="Short Questions">Short Questions</option>
                      <option value="Diagram/Graph-Based Questions">Diagram/Graph-Based Questions</option>
                      <option value="Numerical Problems">Numerical Problems</option>
                      <option value="Long Answer Questions">Long Answer Questions</option>
                    </select>
                  </div>
                  <button className={styles.removeBtn} onClick={() => handleRemoveType(qt.id)}>
                    <X size={16} />
                  </button>
                  <div className={styles.countSelect}>
                    <button onClick={() => handleUpdateType(qt.id, 'count', qt.count - 1)}>-</button>
                    <input 
                      type="number" 
                      value={qt.count} 
                      onChange={e => handleUpdateType(qt.id, 'count', parseInt(e.target.value) || 0)} 
                      onKeyDown={(e) => { if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault(); }}
                      min="0"
                    />
                    <button onClick={() => handleUpdateType(qt.id, 'count', qt.count + 1)}>+</button>
                  </div>
                  <div className={styles.markSelect}>
                    <button onClick={() => handleUpdateType(qt.id, 'marks', qt.marks - 1)}>-</button>
                    <input 
                      type="number" 
                      value={qt.marks} 
                      onChange={e => handleUpdateType(qt.id, 'marks', parseInt(e.target.value) || 0)} 
                      onKeyDown={(e) => { if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault(); }}
                      min="0"
                    />
                    <button onClick={() => handleUpdateType(qt.id, 'marks', qt.marks + 1)}>+</button>
                  </div>
                </div>
                {!qt.showNote && (
                  <button 
                    className={styles.addNoteBtnText} 
                    onClick={() => handleUpdateType(qt.id, 'showNote', true)}
                  >
                    + Add Note
                  </button>
                )}
                {qt.showNote && (
                  <div className={styles.noteContainer}>
                    <div className={styles.relative}>
                      <textarea 
                        placeholder="Add specific instructions for this category (e.g., 'Make all multiple choice questions scenario-based')"
                        value={qt.note || ''}
                        onChange={(e) => handleUpdateType(qt.id, 'note', e.target.value)}
                        className={styles.noteTextarea}
                        rows={2}
                      />
                      <button 
                        onClick={() => {
                          handleUpdateType(qt.id, 'note', '');
                          handleUpdateType(qt.id, 'showNote', false);
                        }}
                        className={styles.cancelNoteBtn}
                        title="Cancel Note"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <button className={styles.addTypeBtn} onClick={handleAddType}>
              <div className={styles.addIcon}><Plus size={20} /></div> Add Question Type
            </button>
          </div>
          <div className={styles.totals}>
            <div>Total Questions: {totalQuestions}</div>
            <div>Total Marks: {totalMarks}</div>
          </div>
          <div className={styles.inputGroup}>
            <label>Additional Information (For better output)</label>
            <div className={styles.textareaWrapper}>
              <textarea 
                placeholder="e.g Generate a question paper for 3 hour exam duration..."
                className={styles.textarea}
                value={additionalInfo}
                onChange={e => setAdditionalInfo(e.target.value)}
              ></textarea>
              <Mic className={styles.micIcon} size={18} />
            </div>
          </div>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
        </div>
        <div className={styles.actions}>
          <button className={styles.prevBtn} onClick={() => setStep(1)}>← Previous</button>
          <button 
            className={`${styles.nextBtn} ${!isStep2Valid || loading ? styles.btnDisabled : ''}`} 
            onClick={handleSubmit} 
            disabled={!isStep2Valid || loading}
          >
            {loading ? 'Generating...' : 'Next →'}
          </button>
        </div>
        </>
      )}
    </div>
  );
}
