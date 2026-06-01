'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DownloadCloud } from 'lucide-react';
import { io } from 'socket.io-client';
import ReactMarkdown from 'react-markdown';
import Cookies from 'js-cookie';
import { useSettings } from '@/context/SettingsContext';
import styles from './AssignmentOutput.module.css';
interface Question {
  id?: string;
  text: string;
  difficulty: string;
  marks: number;
  answerText?: string;
}
interface Section {
  title: string;
  instruction: string;
  questions: Question[];
}
interface GeneratedPaper {
  aiMessage?: string;
  metadata?: {
    subject?: string;
    class?: string;
    timeAllowed?: string;
    totalMarks?: number;
  };
  sections: Section[];
  answerKey?: string[];
}
export default function AssignmentOutputPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { settings } = useSettings();
  const [status, setStatus] = useState('GENERATING');
  const [paper, setPaper] = useState<GeneratedPaper | null>(null);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [questionModalTab, setQuestionModalTab] = useState<'ai' | 'manual'>('ai');
  const [questionFeedback, setQuestionFeedback] = useState('');
  const [manualQuestionText, setManualQuestionText] = useState('');
  const [regeneratingQuestions, setRegeneratingQuestions] = useState<Record<string, boolean>>({});
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [anchorPos, setAnchorPos] = useState<{x: number, y: number} | null>(null);
  const hoveredElRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number>(0);

  const recalcAnchor = useCallback(() => {
    if (hoveredElRef.current) {
      const rect = hoveredElRef.current.getBoundingClientRect();
      setAnchorPos({ x: rect.left + 12, y: rect.top + rect.height / 2 });
    }
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      setAnchorPos(null);
      hoveredElRef.current = null;
      return;
    }
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      recalcAnchor();
    };
    const handleScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(recalcAnchor);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll, true);
      cancelAnimationFrame(rafRef.current);
    };
  }, [isEditMode, recalcAnchor]);

  useEffect(() => {
    // Setup socket to always listen for updates
    const ensureIds = (p: GeneratedPaper | null) => {
      if (!p || !p.sections) return p;
      p.sections.forEach((s: Section, sIdx: number) => {
        if (s.questions) {
          s.questions.forEach((q: Question, qIdx: number) => {
            if (!q.id) q.id = `q_${sIdx}_${qIdx}`;
          });
        }
      });
      return p;
    };

    const socket = io((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'));
    socket.on('questionUpdated', (data) => {
      if (data.assignmentId === id) {
        setPaper((prev: GeneratedPaper | null) => {
          if (!prev) return prev;
          const newPaper = { ...prev };
          for (const sec of newPaper.sections) {
            if (!sec.questions) continue;
            const qIdx = sec.questions.findIndex((q: Question) => q.id === data.questionId);
            if (qIdx !== -1) {
              sec.questions[qIdx] = data.newQuestion;
              break;
            }
          }
          return newPaper;
        });
        setRegeneratingQuestions(prev => ({ ...prev, [data.questionId]: false }));
      }
    });

    socket.on('questionUpdateFailed', (data) => {
      if (data.assignmentId === id) {
        setRegeneratingQuestions(prev => ({ ...prev, [data.questionId]: false }));
        alert("Failed to regenerate question. Please try again.");
      }
    });
    socket.on('assignmentUpdate', (update) => {
      if (update.assignmentId === id) {
        if (update.status === 'COMPLETED') {
          setStatus('COMPLETED');
          const token = Cookies.get('token');
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/assignments/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
            .then(r => r.json())
            .then(d => {
              if (d.generatedPaper) setPaper(ensureIds(d.generatedPaper));
            });
        } else if (update.status === 'FAILED') {
          setStatus('FAILED');
        }
      }
    });
    const token = Cookies.get('token');
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/assignments/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'COMPLETED') {
          setStatus('COMPLETED');
          if (data.generatedPaper) setPaper(ensureIds(data.generatedPaper));
        } else if (data.status === 'FAILED') {
          setStatus('FAILED');
        } else {
          setStatus('GENERATING');
        }
      })
      .catch(err => {
        console.error(err);
        setStatus('COMPLETED');
        setPaper(ensureIds({
          sections: [
            {
              title: 'Section A',
              instruction: 'Short Answer Questions\nAttempt all questions. Each question carries 2 marks',
              questions: [
                { text: 'Define electroplating. Explain its purpose.', difficulty: 'Easy', marks: 2 },
                { text: 'What is the role of a conductor in the process of electrolysis?', difficulty: 'Moderate', marks: 2 },
                { text: 'Why does a solution of copper sulfate conduct electricity?', difficulty: 'Easy', marks: 2 },
                { text: 'Describe one example of the chemical effect of electric current in daily life.', difficulty: 'Moderate', marks: 2 },
                { text: 'Explain why electric current is said to have chemical effects.', difficulty: 'Moderate', marks: 2 },
                { text: 'How is sodium hydroxide prepared during the electrolysis of brine? Write the chemical reaction involved.', difficulty: 'Challenging', marks: 2 },
                { text: 'What happens at the cathode and anode during the electrolysis of water? Name the gases evolved.', difficulty: 'Challenging', marks: 2 },
                { text: 'Mention the type of current used in electroplating and justify why it is used.', difficulty: 'Easy', marks: 2 },
                { text: 'What is the importance of electric current in the field of metallurgy?', difficulty: 'Moderate', marks: 2 },
                { text: 'Explain with a chemical equation how copper is deposited during the electroplating of an object.', difficulty: 'Challenging', marks: 2 },
              ]
            }
          ]
        }));
      });
    return () => {
      socket.disconnect();
    };
  }, [id]);
  if (status === 'GENERATING') {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <h2>Generating Assignment...</h2>
        <p>Our AI is crafting the perfect questions based on your requirements.</p>
      </div>
    );
  }
  if (status === 'FAILED') {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.errorIconContainer}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        </div>
        <h2>Generation Failed</h2>
        <p>There was an error generating the assignment. The AI service might be unavailable or encountered an error.</p>
        <button className={`${styles.downloadBtn} ${styles.tryAgainBtn}`} onClick={() => router.push('/assignments/new')}>
          Try Again
        </button>
      </div>
    );
  }
  const totalMarks = paper?.sections.reduce((acc, section) => 
    acc + section.questions.reduce((qAcc, q) => qAcc + q.marks, 0), 0) || 0;
  const handleDownload = async () => {
    try {
        const html2pdf = (await import('html2pdf.js')).default;
        const element = document.getElementById('paper-preview');
        if (element) {
            const opt = {
                margin:       10,
                filename:     'Assignment.pdf',
                image:        { type: 'jpeg' as const, quality: 0.98 },
                html2canvas:  { scale: 2 },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
            };
            html2pdf().set(opt).from(element).save();
        }
    } catch (err) {
        console.error('Failed to generate PDF', err);
    }
  };
  const handleRegenerateQuestion = async (action: 'regenerate' | 'enhance' = 'regenerate') => {
    if (!selectedQuestion) return;
    const qId = selectedQuestion.id || '';
    setSelectedQuestion(null);
    setRegeneratingQuestions(prev => ({ ...prev, [qId]: true }));
    
    try {
      const token = Cookies.get('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/assignments/${id}/questions/${qId}/regenerate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ feedback: action === 'enhance' ? manualQuestionText : questionFeedback, action })
      });
    } catch (err) {
      console.error(err);
      setRegeneratingQuestions(prev => ({ ...prev, [qId]: false }));
    }
  };

  const handleManualSave = async () => {
    if (!selectedQuestion) return;
    const qId = selectedQuestion.id || '';
    const updatedQ = { ...selectedQuestion, text: manualQuestionText };
    setSelectedQuestion(null);
    setRegeneratingQuestions(prev => ({ ...prev, [qId]: true }));
    
    try {
      const token = Cookies.get('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/assignments/${id}/questions/${qId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question: updatedQ })
      });
      const data = await res.json();
      if (data.success) {
         setPaper(data.generatedPaper);
      }
      setRegeneratingQuestions(prev => ({ ...prev, [qId]: false }));
    } catch (err) {
      console.error(err);
      setRegeneratingQuestions(prev => ({ ...prev, [qId]: false }));
    }
  };

  const handleRegenerate = async () => {
    setShowRegenerateModal(false);
    setStatus('GENERATING');
    try {
      const token = Cookies.get('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/assignments/${id}/regenerate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ feedback })
      });
    } catch (err) {
      console.error(err);
      setStatus('FAILED');
    }
  };
  return (
    <div className={styles.scrollWrapper}>
      <div className={styles.container}>
        <div className={styles.aiBanner}>
          <div className={styles.aiMessage}>
            <span>{paper?.aiMessage || "Certainly! Here is the customized Question Paper based on your instructions:"}</span>
          </div>
          <div className={styles.bannerActions}>
            <button className={`${styles.downloadBtn} ${styles.regenerateBtn}`} onClick={() => setIsEditMode(!isEditMode)}>
              {isEditMode ? 'Exit Edit Mode' : 'Edit Paper'}
            </button>
            <button className={`${styles.downloadBtn} ${styles.regenerateBtn}`} onClick={() => setShowRegenerateModal(true)}>
              Regenerate All
            </button>
            <button className={styles.downloadBtn} onClick={handleDownload}>
              <DownloadCloud size={16} /> Download as PDF
            </button>
          </div>
        </div>
        {selectedQuestion && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalTabs}>
                <button className={questionModalTab === 'ai' ? styles.activeTab : ''} onClick={() => setQuestionModalTab('ai')}>AI Edit</button>
                <button className={questionModalTab === 'manual' ? styles.activeTab : ''} onClick={() => setQuestionModalTab('manual')}>Manual Edit</button>
              </div>
              
              {questionModalTab === 'ai' ? (
                <>
                  <h3>Regenerate Question</h3>
                  <p>Tell the AI how to improve this specific question.</p>
                  <textarea 
                    value={questionFeedback}
                    onChange={(e) => setQuestionFeedback(e.target.value)}
                    placeholder="e.g. Make it a multiple choice question..."
                    className={styles.feedbackInput}
                    rows={4}
                  />
                  <div className={styles.modalActions}>
                    <button onClick={() => setSelectedQuestion(null)} className={styles.cancelBtn}>Cancel</button>
                    <button onClick={() => handleRegenerateQuestion('regenerate')} className={styles.confirmBtn}>Generate</button>
                  </div>
                </>
              ) : (
                <>
                  <h3>Manual Edit</h3>
                  <p>Directly edit the text of the question.</p>
                  <textarea 
                    value={manualQuestionText}
                    onChange={(e) => setManualQuestionText(e.target.value)}
                    className={styles.feedbackInput}
                    rows={4}
                  />
                  <div className={styles.modalActions}>
                    <button onClick={() => setSelectedQuestion(null)} className={styles.cancelBtn}>Cancel</button>
                    <button onClick={() => handleRegenerateQuestion('enhance')} className={styles.cancelBtn}>Enhance with AI</button>
                    <button onClick={handleManualSave} className={styles.confirmBtn}>Save Directly</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        {showRegenerateModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h3>Regenerate Assignment</h3>
              <p>Don&apos;t like the current output? Tell the AI what changes you&apos;d like to make.</p>
              <textarea 
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="e.g. Make Section A harder, or add more variety to short questions..."
                className={styles.feedbackInput}
                rows={4}
              />
              <div className={styles.modalActions}>
                <button onClick={() => setShowRegenerateModal(false)} className={styles.cancelBtn}>Cancel</button>
                <button onClick={handleRegenerate} className={styles.confirmBtn}>Regenerate</button>
              </div>
            </div>
          </div>
        )}
        <div className={styles.paperPreview} id="paper-preview">
          <div className={styles.paperHeader}>
            <h1><span>{settings.schoolName}, {settings.schoolLocation}</span></h1>
            <h2><span>Subject: {paper?.metadata?.subject || 'English'}</span></h2>
            <h3><span>Class: {paper?.metadata?.class || '5th'}</span></h3>
          </div>
          <div className={styles.paperMeta}>
            <div><span>Time Allowed: {paper?.metadata?.timeAllowed || '45 minutes'}</span></div>
            <div><span>Maximum Marks: {totalMarks}</span></div>
          </div>
          <div className={styles.compulsoryText}>
            All questions are compulsory unless stated otherwise.
          </div>
          <div className={styles.studentInfo}>
            <div><span>Name: ____________________</span></div>
            <div><span>Roll Number: ____________________</span></div>
            <div><span>Class: {paper?.metadata?.class || '5th'} Section: ____________________</span></div>
          </div>
          {paper?.sections.map((section, sIdx) => (
            <div key={sIdx} className={styles.section}>
              <h4 className={styles.sectionTitle}>{section.title}</h4>
              <div className={styles.sectionInstruction}>
                  <ReactMarkdown>{section.instruction.replace(/(?<!\n)\n(?!\n)/g, '\n\n')}</ReactMarkdown>
              </div>
              <div className={styles.questionsList}>
                {section.questions.map((q: Question, qIdx: number) => {
                  const isRegenerating = q.id ? regeneratingQuestions[q.id] : false;
                  return (
                    <div 
                      key={q.id || qIdx} 
                      className={`${styles.questionItem} ${isEditMode ? styles.questionItemEditable : ''}`}
                      onMouseEnter={(e) => {
                        if (isEditMode && !isRegenerating) {
                          hoveredElRef.current = e.currentTarget;
                          recalcAnchor();
                        }
                      }}
                      onMouseLeave={() => {
                        if (isEditMode) {
                          hoveredElRef.current = null;
                          setAnchorPos(null);
                        }
                      }}
                      onClick={() => {
                        if (isEditMode && !isRegenerating) {
                          setSelectedQuestion(q);
                          setQuestionFeedback('');
                          setManualQuestionText(q.text);
                        }
                      }}
                    >
                      {isRegenerating ? (
                        <div className={styles.skeletonLoader}>
                          <div className={styles.skeletonLine}></div>
                          <div className={styles.skeletonLine} style={{ width: '80%' }}></div>
                          <div className={styles.skeletonLine} style={{ width: '60%' }}></div>
                        </div>
                      ) : (() => {
                        const lines = q.text.split('\n');
                        let firstLine = lines[0] || '';
                        firstLine = firstLine.replace(/^\**\d+\.\**\s*/, '');
                        const newText = `${qIdx + 1}. **[${q.difficulty}]** ${firstLine} *[${q.marks} Marks]*\n${lines.slice(1).join('\n')}`;
                        return (
                          <div className={styles.questionText}>
                            <ReactMarkdown>{newText.replace(/(?<!\n)\n(?!\n)/g, '\n\n')}</ReactMarkdown>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}

              </div>
            </div>
          ))}
          <div className={styles.endOfPaper}>
              <strong>End of Question Paper</strong>
          </div>
          {((paper?.answerKey && paper.answerKey.length > 0) || (paper?.sections.some(s => s.questions.some(q => q.answerText)))) && (
            <div className={styles.answerKeySection}>
              <h3 className={styles.answerKeyTitle}>Answer Key:</h3>
              <div className={styles.answerKeyList}>
                {paper.sections.flatMap(s => s.questions).map((q: Question, absoluteIdx: number) => {
                  const ansText = q.answerText || (paper.answerKey ? paper.answerKey[absoluteIdx] : null);
                  if (!ansText) return null;
                  const cleanAns = ansText.replace(/^\**\d+\.\**\s*/, '');
                  return (
                    <div key={q.id || absoluteIdx} className={styles.answerItem}>
                      <ReactMarkdown>{`**${absoluteIdx + 1}.** ${cleanAns}`}</ReactMarkdown>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      {isEditMode && anchorPos && (
        <svg style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 9999 }}>
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#111827" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#111827" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          <path
            d={`M ${anchorPos.x} ${anchorPos.y} C ${anchorPos.x + (mousePos.x - anchorPos.x) * 0.4} ${anchorPos.y}, ${mousePos.x - (mousePos.x - anchorPos.x) * 0.4} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`}
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="1.5"
            strokeDasharray="5,4"
          />
          <circle cx={anchorPos.x} cy={anchorPos.y} r="3" fill="#111827" fillOpacity="0.5" />
          <circle cx={mousePos.x} cy={mousePos.y} r="8" fill="none" stroke="#111827" strokeWidth="1" strokeOpacity="0.2" />
          <circle cx={mousePos.x} cy={mousePos.y} r="3" fill="none" stroke="#111827" strokeWidth="1.5" strokeOpacity="0.4" />
          <circle cx={mousePos.x} cy={mousePos.y} r="1.5" fill="#111827" fillOpacity="0.6" />
        </svg>
      )}
    </div>
  );
}
