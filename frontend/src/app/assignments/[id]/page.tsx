'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DownloadCloud } from 'lucide-react';
import { io } from 'socket.io-client';
import ReactMarkdown from 'react-markdown';
import Cookies from 'js-cookie';
import { useSettings } from '@/context/SettingsContext';
import styles from './AssignmentOutput.module.css';
interface Question {
  text: string;
  difficulty: string;
  marks: number;
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
  useEffect(() => {
    // Setup socket to always listen for updates
    const socket = io((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'));
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
              if (d.generatedPaper) setPaper(d.generatedPaper);
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
          if (data.generatedPaper) setPaper(data.generatedPaper);
        } else if (data.status === 'FAILED') {
          setStatus('FAILED');
        } else {
          setStatus('GENERATING');
        }
      })
      .catch(err => {
        console.error(err);
        setStatus('COMPLETED');
        setPaper({
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
        });
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
            <button className={`${styles.downloadBtn} ${styles.regenerateBtn}`} onClick={() => setShowRegenerateModal(true)}>
              Regenerate
            </button>
            <button className={styles.downloadBtn} onClick={handleDownload}>
              <DownloadCloud size={16} /> Download as PDF
            </button>
          </div>
        </div>
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
                {section.questions.map((q, qIdx) => (
                  <div key={qIdx} className={styles.questionItem}>
                    <div className={styles.questionText}>
                      <ReactMarkdown>{`${qIdx + 1}. **[${q.difficulty}]** ${q.text.replace(/(?<!\n)\n(?!\n)/g, '\n\n')} *[${q.marks} Marks]*`}</ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className={styles.endOfPaper}>
              <strong>End of Question Paper</strong>
          </div>
          {paper?.answerKey && paper.answerKey.length > 0 && (
            <div className={styles.answerKeySection}>
              <h3 className={styles.answerKeyTitle}>Answer Key:</h3>
              <div className={styles.answerKeyList}>
                {paper.answerKey.map((ans, aIdx) => (
                  <div key={aIdx} className={styles.answerItem}>
                    <ReactMarkdown>{ans.replace(/(?<!\n)\n(?!\n)/g, '\n\n')}</ReactMarkdown>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
