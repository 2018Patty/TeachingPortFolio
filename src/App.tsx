/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit, 
  FileText, 
  Video, 
  Presentation, 
  ExternalLink, 
  ChevronRight, 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Lock, 
  Sparkles, 
  X, 
  GraduationCap, 
  BookMarked,
  Layers,
  Paperclip,
  Eye,
  MessageCircle,
  Send,
  Zap,
  NotebookPen,
  Timer,
  ImageIcon,
  KeyRound,
  ShieldCheck,
  Eye as EyeIcon,
  EyeOff,
  RefreshCw,
  Upload,
  CheckCircle2,
  AlertCircle as AlertCircleIcon,
  Loader2,
  File as FileIcon,
  Users as UsersIcon,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

import { Role, StudentProfile, StudentCourseVisit, AssignmentSubmission, Course, Material, Assignment, MaterialType, AssignmentStatus, SiteProfile, Question, Reply, ActiveLearning, TeachingReflection, AL_TYPES, SemesterSchedule } from './types';
import { TeachingPlanTab } from './components/TeachingPlanTab';
import { Navbar } from './components/Navbar';
import { SemesterSelector } from './components/SemesterSelector';
import { Footer } from './components/Footer';
import { ProfilePage } from './components/ProfilePage';
import { DashboardPage } from './components/DashboardPage';
import { StudentAuthModal } from './components/StudentAuthModal';
import {
  courseHasCode, matchGroupCode, makeVisitId, groupCount, generateEnrollCode,
  parseGroupCodes, joinGroupCodes, codesIdentifyGroup, withGroupInVisitId, makeAddedVisitId,
} from './utils/enrollGroups';
import { StudentProfilePage } from './components/StudentProfilePage';
import { AssignmentAttachments } from './components/AssignmentAttachments';
import { parseAttachments, serializeAttachments, looksLikeVideo, splitActivityFileUrl, buildActivityFileUrl, isActivityAnchorId, type AttachmentLink } from './utils/assignmentLinks';
import { ActivityVideos } from './components/AssignmentAttachments';
import { MySubmission } from './components/MySubmission';
import { buildGradeNote, attemptsOf, type SubmissionGrade } from './utils/grading';
import { BackOffice } from './components/BackOffice';
import { PDPAConsentBanner } from './components/PDPAConsentBanner';
import { PDPAPrivacyModal } from './components/PDPAPrivacyModal';

import { supabase } from '@/lib/supabase';

const DEFAULT_PROFILE: SiteProfile = {
  profile_name: 'ผศ.ดร.ภัทราพร วรินทรเวช',
  profile_title: 'ผู้ช่วยศาสตราจารย์ ดร.',
  profile_department: 'สาขาวิชาเทคโนโลยีสารสนเทศและการจัดการ',
  profile_faculty: 'คณะวิทยาการจัดการ',
  profile_university: 'มหาวิทยาลัยสงขลานครินทร์ วิทยาเขตหาดใหญ่',
  profile_bio: '',
  profile_email: 'pattaraporn.w@psu.ac.th',
  profile_photo_url: '',
  profile_link_url: '',
  admin_password: 'admin123',
};

export default function App() {
  // 1. Core Reactive States
  const [role, setRole] = useState<Role>('guest');
  const [currentPage, setCurrentPage] = useState<'courses' | 'profile' | 'dashboard' | 'student-profile' | 'admin-panel'>('courses');
  const [siteProfile, setSiteProfile] = useState<SiteProfile>(DEFAULT_PROFILE);
  const [courses, setCourses] = useState<Course[]>([]);
  const [dbError, setDbError] = useState<string>('');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  
  // 2. URL and Filtering parameters state
  const [semester, setSemester] = useState<number>(1);
  const [year, setYear] = useState<number>(2026);
  const [yearsList, setYearsList] = useState<number[]>([2026, 2027, 2028]);

  // 3. Navigation state
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courseDetailTab, setCourseDetailTab] = useState<'info' | 'materials' | 'assignments' | 'qa' | 'active_learning' | 'reflection' | 'plan'>('info');
  // Item (material / assignment / activity id) to scroll to and highlight after opening a course tab.
  const [focusItemId, setFocusItemId] = useState<string | null>(null);
  useEffect(() => {
    if (!focusItemId) return;
    let tries = 0;
    let timer: number | undefined;
    const find = () => {
      const el = document.getElementById(`item-${focusItemId}`);
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        el.classList.add('ring-4', 'ring-indigo-300', 'ring-offset-2');
        timer = window.setTimeout(() => el.classList.remove('ring-4', 'ring-indigo-300', 'ring-offset-2'), 2500);
        setFocusItemId(null);
      } else if (++tries < 40) {
        timer = window.setTimeout(find, 100);   // wait for the tab / data to render
      } else {
        setFocusItemId(null);
      }
    };
    timer = window.setTimeout(find, 50);
    return () => window.clearTimeout(timer);
  }, [focusItemId, courseDetailTab, selectedCourseId, currentPage]);
  /** Open a tab of the current course and jump to one item in it. */
  const openCourseItem = (tab: 'materials' | 'assignments' | 'active_learning', itemId: string) => {
    setCourseDetailTab(tab);
    setFocusItemId(itemId);
  };

  // 4. Modals and Forms states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // PDPA state
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Semester schedules
  const [semesterSchedules, setSemesterSchedules] = useState<SemesterSchedule[]>([]);

  // Student auth state
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [showStudentAuthModal, setShowStudentAuthModal] = useState(false);
  const roleRef = useRef<Role>('guest');

  // Course access gate: track which course the guest tried to open before login
  const [pendingCourseId, setPendingCourseId] = useState<string | null>(null);
  const pendingCourseIdRef = useRef<string | null>(null);
  const [studentAuthInitialTab, setStudentAuthInitialTab] = useState<'login' | 'register'>('register');

  // Enrollment code gate modal
  const [showEnrollCodeModal, setShowEnrollCodeModal] = useState(false);
  const [enrollCodeInput, setEnrollCodeInput] = useState('');
  const [enrollCodeError, setEnrollCodeError] = useState('');
  const [showEnrollCodePassword, setShowEnrollCodePassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  // Course with several groups but no per-group codes → student picks their group
  const [pendingGroupCourseId, setPendingGroupCourseId] = useState<string | null>(null);
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);
  const [pendingEnrollCourseId, setPendingEnrollCourseId] = useState<string | null>(null);

  // Student tracking state
  const [visits, setVisits] = useState<StudentCourseVisit[]>([]);
  // Student log-in records: rows in student_course_visits with course_id = NULL
  const [loginLogs, setLoginLogs] = useState<StudentCourseVisit[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [allStudents, setAllStudents] = useState<StudentProfile[]>([]);

  // Submit Assignment Modal state (student)
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null);
  const [submitForm, setSubmitForm] = useState({ answer_text: '', link_url: '' });
  const [submitFiles, setSubmitFiles] = useState<File[]>([]);
  // Editing a submission: files of the previous attempt to carry over, and that attempt.
  const [submitKeptFiles, setSubmitKeptFiles] = useState<string[]>([]);
  const [resubmitOf, setResubmitOf] = useState<AssignmentSubmission | null>(null);
  const [submitUploading, setSubmitUploading] = useState(false);
  const [submitUploadError, setSubmitUploadError] = useState('');

  // Course Form Modal state
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseFormError, setCourseFormError] = useState('');
  const [courseForm, setCourseForm] = useState({
    course_code: '',
    course_name_th: '',
    course_name_en: '',
    description: '',
    objectivesInput: '',
    semester_id: 1,
    year: 2026,
    credit: '3((3)-0-6)',
    section: '01',
    theory_hours: 0,
    practice_hours: 0,
    total_weeks: 15,
    enrollment_code: '',
  });

  // Material Form Modal state
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [materialForm, setMaterialForm] = useState({
    title: '',
    type: 'slides' as MaterialType,
    week_number: 1,
    file_url: '',
    description: ''
  });

  const [materialUploadMode, setMaterialUploadMode] = useState<'url' | 'file'>('url');
  const [materialFiles, setMaterialFiles] = useState<File[]>([]);
  const [materialUploading, setMaterialUploading] = useState(false);
  const [materialUploadProgress, setMaterialUploadProgress] = useState<{name: string; status: 'pending' | 'uploading' | 'done' | 'error'; error?: string}[]>([]);

  // Assignment Form Modal state
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  // Active Learning state
  const [activities, setActivities] = useState<ActiveLearning[]>([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActiveLearning | null>(null);
  const [activityForm, setActivityForm] = useState({ type_id: '', title: '', description: '', duration: '', file_url: '' });
  const [activityVideos, setActivityVideos] = useState<AttachmentLink[]>([]);
  const [activityFiles, setActivityFiles] = useState<File[]>([]);
  const [activityUploading, setActivityUploading] = useState(false);
  const [activityUploadError, setActivityUploadError] = useState('');
  const [activityIsAssignment, setActivityIsAssignment] = useState(false);
  const [activityDueDate, setActivityDueDate] = useState('');


  // Teaching Reflection state
  const [reflections, setReflections] = useState<TeachingReflection[]>([]);
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [editingReflection, setEditingReflection] = useState<TeachingReflection | null>(null);
  const [reflectionForm, setReflectionForm] = useState({ week_number: 1, content: '', image_url: '' });
  const [reflectionImageUploading, setReflectionImageUploading] = useState(false);

  // Q&A state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [questionForm, setQuestionForm] = useState({ author_name: '', content: '' });
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyForm, setReplyForm] = useState({ author_name: '', content: '' });
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    due_date: '2026-06-30',
    week_number: 1,
    attachment_url: '',
    status: 'open' as AssignmentStatus
  });
  // Attachment links (files / videos) edited in the assignment form
  const [assignmentLinks, setAssignmentLinks] = useState<AttachmentLink[]>([]);

  // 5. Initialize lists and sync with URL Parameters
  const loadAllData = async () => {
    const [coursesRes, materialsRes, assignmentsRes, questionsRes, repliesRes, activitiesRes, profileRes, visitsRes, submissionsRes, studentsRes] = await Promise.all([
      supabase.from('courses').select('*').order('year', { ascending: false }),
      supabase.from('materials').select('*'),
      supabase.from('assignments').select('*'),
      supabase.from('questions').select('*').order('created_at', { ascending: true }),
      supabase.from('replies').select('*').order('created_at', { ascending: true }),
      supabase.from('active_learning').select('*').order('created_at', { ascending: true }),
      supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('student_course_visits').select('*').order('visited_at', { ascending: false }),
      supabase.from('assignment_submissions').select('*').order('submitted_at', { ascending: false }),
      supabase.from('students').select('*'),
    ]);
    if (coursesRes.error) {
      console.error('[DB] courses error:', coursesRes.error.message, coursesRes.error);
      setDbError(`DB Error: ${coursesRes.error.message}`);
    } else if (coursesRes.data) {
      console.log('[DB] courses loaded:', coursesRes.data.length);
      setDbError('');
      setCourses(coursesRes.data as Course[]);
    } else {
      setDbError('DB returned null (check RLS policies)');
    }
    if (!materialsRes.error && materialsRes.data) {
      setMaterials(materialsRes.data as Material[]);
    }
    if (!assignmentsRes.error && assignmentsRes.data) {
      // Rows whose id is an activity id only anchor Active Learning submissions (FK); hide them.
      setAssignments((assignmentsRes.data as Assignment[]).filter(a => !isActivityAnchorId(a.assignment_id)));
    }
    if (!questionsRes.error && questionsRes.data) {
      setQuestions(questionsRes.data as Question[]);
    }
    if (!repliesRes.error && repliesRes.data) {
      setReplies(repliesRes.data as Reply[]);
    }
    if (!activitiesRes.error && activitiesRes.data) {
      setActivities(activitiesRes.data as ActiveLearning[]);
    }
    if (!profileRes.error && profileRes.data) {
      const p = profileRes.data as SiteProfile;
      setSiteProfile({ ...DEFAULT_PROFILE, ...p });
      if (p.semester_schedules) {
        try { setSemesterSchedules(JSON.parse(p.semester_schedules)); } catch { /* ignore */ }
      }
    }
    if (!visitsRes.error && visitsRes.data) {
      const rows = visitsRes.data as StudentCourseVisit[];
      setVisits(rows.filter(v => v.course_id));
      setLoginLogs(rows.filter(v => !v.course_id));
    }
    if (!submissionsRes.error && submissionsRes.data) {
      setSubmissions(submissionsRes.data as AssignmentSubmission[]);
    }
    if (!studentsRes.error && studentsRes.data) {
      setAllStudents(studentsRes.data as StudentProfile[]);
    }
  };

  const handleSaveProfile = async (data: Partial<SiteProfile>) => {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ id: 1, ...data }, { onConflict: 'id' });
    if (error) throw new Error(error.message);
    setSiteProfile((prev: SiteProfile) => ({ ...prev, ...data }));
  };

  const handleSavePdpa = async (data: Pick<SiteProfile, 'pdpa_purposes' | 'pdpa_retention' | 'pdpa_third_party' | 'pdpa_updated_at' | 'pdpa_effective_date' | 'pdpa_version'>) => {
    // Bump version on every policy save so all users see the consent banner again
    await handleSaveProfile({ ...data, pdpa_version: new Date().toISOString() });
  };

  // Admin moves a student to another group: rewrite the group part of that
  // student's visit ids for the course (the group is encoded in visit_id).
  const handleChangeStudentGroup = async (studentId: string, courseId: string, group: number | null) => {
    const rows = visits.filter(v => v.student_id === studentId && v.course_id === courseId);
    const changes = rows
      .map(v => ({ from: v.visit_id, to: withGroupInVisitId(v.visit_id, group) }))
      .filter(c => c.from !== c.to);
    for (const c of changes) {
      const { error } = await supabase.from('student_course_visits').update({ visit_id: c.to }).eq('visit_id', c.from);
      if (error) throw new Error(error.message);
      setVisits(prev => prev.map(v => (v.visit_id === c.from ? { ...v, visit_id: c.to } : v)));
    }
  };

  // ── Admin: add / edit / remove students ────────────────────────────────────
  type StudentFields = Pick<StudentProfile, 'student_id' | 'first_name' | 'last_name' | 'email'>;

  // Add a student to a course. Either an existing account (existingId) or a new
  // record typed in by the teacher. A new record has no Google account yet; when
  // the student later logs in with the same email it is linked to their account.
  const handleAddStudentToCourse = async (
    courseId: string,
    input: { existingId: string } | { profile: StudentFields },
    group: number | null,
  ) => {
    let studentId: string;
    if ('existingId' in input) {
      studentId = input.existingId;
    } else {
      const profile: StudentProfile = {
        id: crypto.randomUUID(),
        student_id: input.profile.student_id.trim(),
        first_name: input.profile.first_name.trim(),
        last_name: input.profile.last_name.trim(),
        email: input.profile.email.trim().toLowerCase(),
        avatar_url: '',
      };
      const { data, error } = await supabase.from('students').insert(profile).select().single();
      if (error) throw new Error(error.message);
      setAllStudents(prev => [...prev, (data as StudentProfile) || profile]);
      studentId = profile.id;
    }
    const visit: StudentCourseVisit = {
      visit_id: makeAddedVisitId(group),
      student_id: studentId,
      course_id: courseId,
      visited_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('student_course_visits').insert(visit);
    if (error) throw new Error(error.message);
    setVisits(prev => [visit, ...prev]);
  };

  const handleUpdateStudent = async (id: string, fields: StudentFields) => {
    const clean: StudentFields = {
      student_id: fields.student_id.trim(),
      first_name: fields.first_name.trim(),
      last_name: fields.last_name.trim(),
      email: fields.email.trim().toLowerCase(),
    };
    const { error } = await supabase.from('students').update(clean).eq('id', id);
    if (error) throw new Error(error.message);
    setAllStudents(prev => prev.map(s => (s.id === id ? { ...s, ...clean } : s)));
    if (studentProfile?.id === id) setStudentProfile(prev => (prev ? { ...prev, ...clean } : prev));
  };

  // Remove a student from one course (their account and submissions stay).
  const handleRemoveStudentFromCourse = async (studentId: string, courseId: string) => {
    const { error } = await supabase.from('student_course_visits').delete()
      .eq('student_id', studentId).eq('course_id', courseId);
    if (error) throw new Error(error.message);
    setVisits(prev => prev.filter(v => !(v.student_id === studentId && v.course_id === courseId)));
  };

  // Delete the student record and all its visit / login rows.
  // Score + feedback for a submission (stored as JSON in assignment_submissions.note).
  const handleSaveGrade = async (submissionId: string, grade: SubmissionGrade | null) => {
    const current = submissions.find(s => s.submission_id === submissionId);
    const note = buildGradeNote(grade, current?.note);
    const { error } = await supabase.from('assignment_submissions').update({ note }).eq('submission_id', submissionId);
    if (error) throw new Error(error.message);
    setSubmissions(prev => prev.map(s => s.submission_id === submissionId ? { ...s, note } : s));
  };

  const handleDeleteStudentAccount = async (studentId: string) => {
    const v = await supabase.from('student_course_visits').delete().eq('student_id', studentId);
    if (v.error) throw new Error(v.error.message);
    const s = await supabase.from('students').delete().eq('id', studentId);
    if (s.error) throw new Error(s.error.message);
    setVisits(prev => prev.filter(x => x.student_id !== studentId));
    setLoginLogs(prev => prev.filter(x => x.student_id !== studentId));
    setAllStudents(prev => prev.filter(x => x.id !== studentId));
  };

  const handleSaveSchedules = async (schedules: SemesterSchedule[]) => {
    await handleSaveProfile({ semester_schedules: JSON.stringify(schedules) });
    setSemesterSchedules(schedules);
  };

  const handlePasswordChange = async (oldPw: string, newPw: string): Promise<{ success: boolean; message: string }> => {
    if (oldPw !== siteProfile.admin_password) {
      return { success: false, message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง กรุณาลองใหม่' };
    }
    const { error } = await supabase
      .from('site_settings')
      .upsert({ id: 1, admin_password: newPw }, { onConflict: 'id' });
    if (error) return { success: false, message: `เกิดข้อผิดพลาด: ${error.message}` };
    setSiteProfile((prev: SiteProfile) => ({ ...prev, admin_password: newPw }));
    return { success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จแล้ว!' };
  };

  // Profile photo goes to Storage; only its URL is kept in site_settings, which every
  // visitor loads on page open (a base64 image there added ~90 KB to each load).
  const handlePhotoUpload = async (file: File): Promise<string> => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `profile/${Date.now()}_${safeName}`;
    const { error } = await supabase.storage.from('course-materials').upload(path, file, { upsert: false });
    if (error) throw new Error(`อัปโหลดรูปไม่สำเร็จ: ${error.message}`);
    return supabase.storage.from('course-materials').getPublicUrl(path).data.publicUrl;
  };

  useEffect(() => {
    // Sync state with URL params on mount
    const params = new URLSearchParams(window.location.search);
    const semParam = params.get('semester');
    const yrParam = params.get('year');

    if (semParam) {
      const parsedSem = parseInt(semParam, 10);
      if (parsedSem === 1 || parsedSem === 2) setSemester(parsedSem);
    }
    if (yrParam) {
      const parsedYr = parseInt(yrParam, 10);
      if (parsedYr >= 2026) setYear(parsedYr);
    }

    loadAllData();
  }, []);

  // Keep roleRef in sync for use in onAuthStateChange closure
  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  // Teaching reflections are teacher-only and may contain large images, so they are
  // loaded only after the teacher logs in (not for every student on every page load).
  useEffect(() => {
    if (role !== 'admin') return;
    supabase.from('teaching_reflections').select('*').order('week_number', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setReflections(data as TeachingReflection[]);
      });
  }, [role]);

  // ── Student login progress (after returning from Google) ──────────────────
  // 'pending': back from the OAuth redirect, session not applied yet.
  const [authStatus, setAuthStatus] = useState<'idle' | 'pending' | 'error'>(() => {
    const h = window.location.hash, q = window.location.search;
    if (/error_description=/.test(h) || /error_description=/.test(q)) return 'error';
    return /access_token=/.test(h) || /[?&]code=/.test(q) ? 'pending' : 'idle';
  });
  const [authError, setAuthError] = useState(() => {
    const raw = new URLSearchParams(window.location.hash.slice(1)).get('error_description')
      || new URLSearchParams(window.location.search).get('error_description');
    return raw ? raw.replace(/\+/g, ' ') : '';
  });
  useEffect(() => {
    if (role === 'student' && authStatus !== 'idle') { setAuthStatus('idle'); setAuthError(''); }
  }, [role, authStatus]);
  useEffect(() => {
    if (authStatus !== 'pending') return;
    const t = setTimeout(() => {
      setAuthStatus(s => (s === 'pending' ? 'error' : s));
      setAuthError(e => e || 'timeout');
    }, 25000);
    return () => clearTimeout(t);
  }, [authStatus]);

  // Student login → jump to the latest semester (handled in the courses effect below)
  const [latestTermRequest, setLatestTermRequest] = useState(0);
  const studentLatestTermAppliedRef = useRef(false);
  const loginRecordedRef = useRef(false);

  // Supabase Auth listener for student sessions
  useEffect(() => {
    let mounted = true;

    // Log when a student enters the system (once per browser tab session)
    const recordStudentLogin = (studentUuid: string) => {
      if (loginRecordedRef.current) return;
      loginRecordedRef.current = true;
      const key = `login-logged-${studentUuid}`;
      try {
        if (sessionStorage.getItem(key)) return; // already logged in this tab (e.g. page refresh)
        sessionStorage.setItem(key, '1');
      } catch { /* storage unavailable — fall back to once per page load */ }
      const log: StudentCourseVisit = {
        visit_id: `login-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        student_id: studentUuid,
        course_id: null,
        visited_at: new Date().toISOString(),
      };
      supabase.from('student_course_visits').insert(log).then(({ error }) => {
        if (error) console.error('[DB] login log insert error:', error.message);
      });
      setLoginLogs(prev => [log, ...prev]);
    };

    // Build/fetch student profile and set role — wrapped in try/catch so
    // setRole('student') is ALWAYS called even if DB operations fail.
    const applyStudentSession = async (user: { id: string; email?: string; user_metadata?: Record<string, string> }) => {
      if (!mounted || roleRef.current === 'admin') return;

      let profile: StudentProfile;
      try {
        const { data } = await supabase
          .from('students')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        // A record the teacher added by hand (same email, no account yet)?
        // Link it to this account so the student keeps their course and group.
        let preAdded: StudentProfile | null = null;
        if (!data && user.email) {
          const { data: byEmail } = await supabase
            .from('students')
            .select('*')
            .eq('email', user.email.toLowerCase())
            .neq('id', user.id)
            .limit(1)
            .maybeSingle();
          if (byEmail) {
            const oldId = (byEmail as StudentProfile).id;
            const { error: linkErr } = await supabase.from('students').update({
              id: user.id,
              avatar_url: (byEmail as StudentProfile).avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
            }).eq('id', oldId);
            if (!linkErr) {
              await supabase.from('student_course_visits').update({ student_id: user.id }).eq('student_id', oldId);
              preAdded = { ...(byEmail as StudentProfile), id: user.id };
            }
          }
        }

        if (data) {
          profile = data as StudentProfile;
        } else if (preAdded) {
          profile = preAdded;
        } else {
          profile = {
            id: user.id,
            student_id: user.user_metadata?.student_id || '',
            first_name: user.user_metadata?.first_name || user.user_metadata?.given_name || '',
            last_name: user.user_metadata?.last_name || user.user_metadata?.family_name || '',
            email: user.email || '',
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
          };
          await supabase.from('students').insert(profile);
        }
      } catch {
        // DB unavailable — still allow login with session data
        profile = {
          id: user.id,
          student_id: '',
          first_name: user.user_metadata?.given_name || '',
          last_name: user.user_metadata?.family_name || '',
          email: user.email || '',
          avatar_url: user.user_metadata?.picture || '',
        };
      }

      if (!mounted) return;
      setStudentProfile(profile);
      setRole('student');
      recordStudentLogin(user.id);

      // Reload this student's visits so enrollment-code gate works correctly across sessions
      supabase
        .from('student_course_visits')
        .select('*')
        .eq('student_id', user.id)
        .not('course_id', 'is', null)
        .order('visited_at', { ascending: false })
        .then(({ data }) => {
          if (data && mounted) {
            setVisits(prev => {
              const existingIds = new Set(data.map((v: StudentCourseVisit) => v.visit_id));
              const merged = [...data, ...prev.filter((v: StudentCourseVisit) => !existingIds.has(v.visit_id))];
              return merged as StudentCourseVisit[];
            });
          }
        });

      if (!profile.student_id && !pendingCourseIdRef.current) {
        setCurrentPage('student-profile');
      }

      // Every time a student enters (once per page load), show the latest semester —
      // unless they logged in to open a specific course.
      if (!studentLatestTermAppliedRef.current && !pendingCourseIdRef.current) {
        studentLatestTermAppliedRef.current = true;
        setLatestTermRequest(n => n + 1);
      }
    };

    // Explicit session check: catches OAuth redirect sessions where
    // onAuthStateChange INITIAL_SESSION might fire before tokens are processed.
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (session?.user && roleRef.current !== 'admin') {
        applyStudentSession(session.user);
      } else if (mounted) {
        setAuthStatus(s => (s === 'pending' ? 'error' : s));
        if (error) setAuthError(e => e || error.message);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          // Never await Supabase calls inside this callback — supabase-js holds its
          // auth lock while the callback runs, so every later query (e.g. the admin
          // password check) would hang. Defer the work until the lock is released.
          const user = session.user;
          setTimeout(() => { applyStudentSession(user); }, 0);
        } else if (event === 'SIGNED_OUT') {
          // Only reset to guest if WE are not in the middle of an admin login
          if (mounted && roleRef.current !== 'admin') {
            setStudentProfile(null);
            setRole('guest');
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update dynamic academic years from course dataset; auto-select the most recent year/semester
  const initialTermAppliedRef = useRef(false);
  const handledLatestTermRequestRef = useRef(0);
  useEffect(() => {
    if (courses.length === 0) return;
    const yearsInDB = courses.map(c => c.year);
    const uniqueYears = Array.from(new Set([...yearsInDB])).sort((a, b) => a - b);
    setYearsList(uniqueYears);

    // On first load (no ?semester/?year in URL), always show the most recent semester.
    // Afterwards, only jump when the selected year/semester has no courses.
    const isFirstLoad = !initialTermAppliedRef.current;
    initialTermAppliedRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const hasUrlTerm = params.has('semester') || params.has('year');
    const hasMatch = courses.some(c => c.semester_id === semester && c.year === year);
    const studentLoginRequest = latestTermRequest !== handledLatestTermRequestRef.current;
    handledLatestTermRequestRef.current = latestTermRequest;
    if (studentLoginRequest && hasUrlTerm) {
      // Drop a stale ?semester=&year= so the address bar matches the latest term
      const url = new URL(window.location.href);
      url.searchParams.delete('semester');
      url.searchParams.delete('year');
      window.history.replaceState({}, '', url.toString());
    }
    if ((isFirstLoad && !hasUrlTerm) || studentLoginRequest || !hasMatch) {
      const sorted = [...courses].sort((a, b) =>
        b.year !== a.year ? b.year - a.year : b.semester_id - a.semester_id
      );
      setSemester(sorted[0].semester_id);
      setYear(sorted[0].year);
    }
  }, [courses, latestTermRequest]); // eslint-disable-line react-hooks/exhaustive-deps

  // After login, navigate to the course that triggered the login prompt (with enrollment code gate)
  useEffect(() => {
    if (role !== 'student' || !pendingCourseId) return;
    const cid = pendingCourseId;
    setPendingCourseId(null);
    pendingCourseIdRef.current = null;
    openCourseOrPromptCode(cid, visits, studentProfile?.id);
  }, [role, pendingCourseId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync state back to Browser URL address bar
  const handleSemesterYearChange = (newSemester: number, newYear: number) => {
    setSemester(newSemester);
    setYear(newYear);

    const url = new URL(window.location.href);
    url.searchParams.set('semester', newSemester.toString());
    url.searchParams.set('year', newYear.toString());
    // Also reset any open course detail to prevent displaying a course in the wrong sem unless clicked
    setSelectedCourseId(null);
    window.history.pushState({}, '', url.toString());
  };

  // Back button for course detail
  const handleBackToList = () => {
    setSelectedCourseId(null);
  };

  // Select a course and increment its view count; track student visit
  // Navigate to course and record the first visit (called after all gates pass)
  const proceedToCourse = (courseId: string, group: number | null = null) => {
    setCurrentPage('courses');
    setSelectedCourseId(courseId);
    setCourseDetailTab('info');
    setCourses(prevCourses =>
      prevCourses.map((c: Course) => {
        if (c.course_id !== courseId) return c;
        const newViews = (c.views || 0) + 1;
        supabase.from('courses').update({ views: newViews }).eq('course_id', courseId);
        return { ...c, views: newViews };
      })
    );
    if (roleRef.current === 'student' && studentProfile?.id) {
      const alreadyHasVisit = visits.some(v => v.student_id === studentProfile.id && v.course_id === courseId);
      if (!alreadyHasVisit) {
        const visit_id = makeVisitId(group);
        const visit: StudentCourseVisit = {
          visit_id,
          student_id: studentProfile.id,
          course_id: courseId,
          visited_at: new Date().toISOString(),
        };
        supabase.from('student_course_visits').insert(visit).then(({ error }) => {
          if (error) console.error('[DB] visit insert error:', error.message);
        });
        setVisits(prev => [visit, ...prev]);
      }
    }
  };

  // Check if enrollment code is required, then open or prompt
  const openCourseOrPromptCode = (courseId: string, currentVisits: StudentCourseVisit[], currentStudentId?: string) => {
    // Use the latest visits from state to avoid stale closure
    const latestVisits = visits.length >= currentVisits.length ? visits : currentVisits;
    const latestStudentId = studentProfile?.id || currentStudentId;
    const alreadyEnrolled = latestVisits.some(v => v.student_id === latestStudentId && v.course_id === courseId);
    if (alreadyEnrolled) {
      setCurrentPage('courses');
      setSelectedCourseId(courseId);
      setCourseDetailTab('info');
      return;
    }
    const course = courses.find(c => c.course_id === courseId);
    if (courseHasCode(course)) {
      setPendingEnrollCourseId(courseId);
      setEnrollCodeInput('');
      setEnrollCodeError('');
      setShowEnrollCodePassword(false);
      setShowEnrollCodeModal(true);
    } else {
      enterWithGroup(courseId, null);
    }
  };

  // Enter a course; if the group is still unknown and the course has several groups,
  // ask the student to pick theirs first.
  const enterWithGroup = (courseId: string, group: number | null) => {
    const course = courses.find(c => c.course_id === courseId);
    if (group === null && course && groupCount(course) > 1) {
      setPendingGroupCourseId(courseId);
      return;
    }
    proceedToCourse(courseId, group);
  };

  const handleEnrollCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingEnrollCourseId) return;
    const course = courses.find(c => c.course_id === pendingEnrollCourseId);
    if (!course) return;
    const group = matchGroupCode(course, enrollCodeInput);
    if (group !== null) {
      setShowEnrollCodeModal(false);
      setEnrollCodeInput('');
      setEnrollCodeError('');
      const cid = pendingEnrollCourseId;
      setPendingEnrollCourseId(null);
      // Per-group codes decide the group; a shared code means the student picks it
      enterWithGroup(cid, codesIdentifyGroup(course) ? group : null);
    } else {
      setEnrollCodeError('รหัสลงทะเบียนไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleSelectCourse = (courseId: string) => {
    if (role === 'guest') {
      pendingCourseIdRef.current = courseId;
      setPendingCourseId(courseId);
      setStudentAuthInitialTab('register');
      setShowStudentAuthModal(true);
      return;
    }
    if (role === 'student') {
      openCourseOrPromptCode(courseId, visits, studentProfile?.id);
      return;
    }
    // admin: open directly without enrollment gate
    proceedToCourse(courseId);
  };

  // Q&A Handlers
  const handlePostQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCourseId || !questionForm.author_name.trim() || !questionForm.content.trim()) return;
    const question_id = `q-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newQ: Question = {
      question_id,
      course_id: selectedCourseId,
      author_name: questionForm.author_name.trim(),
      content: questionForm.content.trim(),
    };
    const { error } = await supabase.from('questions').insert(newQ);
    if (error) { alert(`ไม่สามารถส่งคำถามได้: ${error.message}`); return; }
    setQuestions([...questions, newQ]);
    setQuestionForm({ author_name: '', content: '' });
    setShowQuestionForm(false);
  };

  const handlePostReply = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!replyTargetId || !replyForm.author_name.trim() || !replyForm.content.trim()) return;
    const reply_id = `r-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newReply: Reply = {
      reply_id,
      question_id: replyTargetId,
      author_name: replyForm.author_name.trim(),
      content: replyForm.content.trim(),
      is_instructor: role === 'admin',
    };
    const { error } = await supabase.from('replies').insert(newReply);
    if (error) { alert(`ไม่สามารถส่งคำตอบได้: ${error.message}`); return; }
    setReplies([...replies, newReply]);
    setReplyForm({ author_name: '', content: '' });
    setReplyTargetId(null);
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('ลบการตอบกลับนี้?')) return;
    const { error } = await supabase.from('replies').delete().eq('reply_id', replyId);
    if (error) { alert(`ไม่สามารถลบได้: ${error.message}`); return; }
    setReplies(replies.filter((r: Reply) => r.reply_id !== replyId));
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('ลบกระทู้นี้และการตอบกลับทั้งหมด?')) return;
    const { error } = await supabase.from('questions').delete().eq('question_id', questionId);
    if (error) { alert(`ไม่สามารถลบคำถามได้: ${error.message}`); return; }
    setQuestions(questions.filter((q: Question) => q.question_id !== questionId));
    setReplies(replies.filter((r: Reply) => r.question_id !== questionId));
  };

  const resetActivityModal = () => {
    setShowActivityModal(false);
    setEditingActivity(null);
    setActivityForm({ type_id: '', title: '', description: '', duration: '', week_number: 1, file_url: '' });
    setActivityVideos([]);
    setActivityFiles([]);
    setActivityUploading(false);
    setActivityUploadError('');
    setActivityIsAssignment(false);
    setActivityDueDate('');
  };

  // Active Learning Handlers
  const handleSaveActivity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    const selectedType = AL_TYPES.find(t => t.type_id === activityForm.type_id);
    const resolvedTitle = activityForm.title.trim() || selectedType?.name || '';
    if (!resolvedTitle) { alert('กรุณาเลือกประเภทกิจกรรมหรือระบุชื่อกิจกรรม'); return; }

    const badVideo = activityVideos.find(l => l.url.trim() && !/^https?:\/\//i.test(l.url.trim()));
    if (badVideo) { alert(`ลิงก์วีดีโอต้องขึ้นต้นด้วย http:// หรือ https://\n${badVideo.url}`); return; }
    let fileList = splitActivityFileUrl(activityForm.file_url).files;

    if (activityFiles.length > 0) {
      setActivityUploading(true);
      setActivityUploadError('');
      const uploadedUrls: string[] = [];
      for (const file of activityFiles) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${selectedCourseId}/al-${Date.now()}_${safeName}`;
        const { error: uploadError } = await supabase.storage.from('course-materials').upload(storagePath, file, { upsert: false });
        if (uploadError) {
          setActivityUploadError(uploadError.message);
          setActivityUploading(false);
          return;
        }
        const { data: urlData } = supabase.storage.from('course-materials').getPublicUrl(storagePath);
        uploadedUrls.push(urlData.publicUrl);
      }
      fileList = uploadedUrls;
      setActivityUploading(false);
    }
    const fileUrl = buildActivityFileUrl(fileList, activityVideos);

    if (editingActivity) {
      const updateData = { type_id: activityForm.type_id, title: resolvedTitle, description: activityForm.description.trim(), duration: activityForm.duration.trim(), week_number: Number(activityForm.week_number) || 1, file_url: fileUrl, is_assignment: activityIsAssignment, due_date: activityIsAssignment ? activityDueDate.trim() : null };
      const { error } = await supabase.from('active_learning').update(updateData).eq('activity_id', editingActivity.activity_id);
      if (error) { alert(`ไม่สามารถแก้ไขกิจกรรมได้: ${error.message}`); return; }
      setActivities(activities.map((a: ActiveLearning) => a.activity_id === editingActivity.activity_id ? { ...a, ...updateData } : a));
    } else {
      const activity_id = `al-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const newActivity: ActiveLearning = { activity_id, course_id: selectedCourseId, type_id: activityForm.type_id, title: resolvedTitle, description: activityForm.description.trim(), duration: activityForm.duration.trim(), week_number: Number(activityForm.week_number) || 1, file_url: fileUrl, is_assignment: activityIsAssignment, due_date: activityIsAssignment ? activityDueDate.trim() : undefined };
      const { error } = await supabase.from('active_learning').insert(newActivity);
      if (error) { alert(`ไม่สามารถเพิ่มกิจกรรมได้: ${error.message}`); return; }
      setActivities([...activities, newActivity]);
    }
    resetActivityModal();
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('ลบกิจกรรม Active Learning นี้?')) return;
    const { error } = await supabase.from('active_learning').delete().eq('activity_id', activityId);
    if (error) { alert(`ไม่สามารถลบได้: ${error.message}`); return; }
    // Clean up submissions and the hidden anchor row used by activity submissions.
    await supabase.from('assignment_submissions').delete().eq('assignment_id', activityId);
    await supabase.from('assignments').delete().eq('assignment_id', activityId);
    setSubmissions(prev => prev.filter(s => s.assignment_id !== activityId));
    setActivities(activities.filter((a: ActiveLearning) => a.activity_id !== activityId));
  };

  const handleEditActivityClick = (activity: ActiveLearning) => {
    setEditingActivity(activity);
    setActivityForm({ type_id: activity.type_id || '', title: activity.title, description: activity.description, duration: activity.duration, week_number: activity.week_number ?? 1, file_url: activity.file_url || '' });
    setActivityVideos(splitActivityFileUrl(activity.file_url).videos);
    setActivityFiles([]);
    setActivityUploadError('');
    setActivityIsAssignment(activity.is_assignment || false);
    setActivityDueDate(activity.due_date || '');
    setShowActivityModal(true);
  };

  // Teaching Reflection Handlers
  const handleSaveReflection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    if (editingReflection) {
      const updateData = { week_number: Number(reflectionForm.week_number), content: reflectionForm.content.trim(), image_url: reflectionForm.image_url || undefined };
      const { error } = await supabase.from('teaching_reflections').update(updateData).eq('reflection_id', editingReflection.reflection_id);
      if (error) { alert(`ไม่สามารถแก้ไขบันทึกได้: ${error.message}`); return; }
      setReflections(reflections.map((r: TeachingReflection) => r.reflection_id === editingReflection.reflection_id ? { ...r, ...updateData } : r));
      setEditingReflection(null);
    } else {
      const reflection_id = `ref-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const newRef: TeachingReflection = { reflection_id, course_id: selectedCourseId, week_number: Number(reflectionForm.week_number), content: reflectionForm.content.trim(), image_url: reflectionForm.image_url || undefined };
      const { error } = await supabase.from('teaching_reflections').insert(newRef);
      if (error) { alert(`ไม่สามารถบันทึกได้: ${error.message}`); return; }
      setReflections([...reflections, newRef]);
    }
    setShowReflectionModal(false);
    setReflectionForm({ week_number: 1, content: '', image_url: '' });
  };

  const handleDeleteReflection = async (reflectionId: string) => {
    if (!confirm('ลบบันทึกหลังสอนนี้?')) return;
    const { error } = await supabase.from('teaching_reflections').delete().eq('reflection_id', reflectionId);
    if (error) { alert(`ไม่สามารถลบได้: ${error.message}`); return; }
    setReflections(reflections.filter((r: TeachingReflection) => r.reflection_id !== reflectionId));
  };

  const handleEditReflectionClick = (reflection: TeachingReflection) => {
    setEditingReflection(reflection);
    setReflectionForm({ week_number: reflection.week_number, content: reflection.content, image_url: reflection.image_url || '' });
    setShowReflectionModal(true);
  };

  // 6. Pastel Colors Palette definition per course position (Index modulo 4)
  const getCourseColors = (index: number) => {
    const palette = [
      {
        bg: 'bg-[#DBEAFE]/95 border-[#93C5FD]',
        text: 'text-[#1D4ED8]',
        badge: 'bg-[#1D4ED8]/10 text-[#1D4ED8] border-[#1D4ED8]/25',
        button: 'bg-[#1D4ED8] hover:bg-[#153eb2] text-white',
        border: 'border-[#DBEAFE]'
      },
      {
        bg: 'bg-[#FCE7F3]/95 border-[#FBCFE8]',
        text: 'text-[#9D174D]',
        badge: 'bg-[#9D174D]/10 text-[#9D174D] border-[#9D174D]/25',
        button: 'bg-[#9D174D] hover:bg-[#7e0f3b] text-white',
        border: 'border-[#FCE7F3]'
      },
      {
        bg: 'bg-[#DCFCE7]/95 border-[#86EFAC]',
        text: 'text-[#15803D]',
        badge: 'bg-[#15803D]/10 text-[#15803D] border-[#15803D]/25',
        button: 'bg-[#15803D] hover:bg-[#0f602c] text-white',
        border: 'border-[#DCFCE7]'
      },
      {
        bg: 'bg-[#F3E8FF]/95 border-[#D8B4FE]',
        text: 'text-[#7E22CE]',
        badge: 'bg-[#7E22CE]/10 text-[#7E22CE] border-[#7E22CE]/25',
        button: 'bg-[#7E22CE] hover:bg-[#6219a1] text-white',
        border: 'border-[#F3E8FF]'
      }
    ];
    return palette[index % 4];
  };

  // Helper: parse file_url that may be JSON array or a single URL string
  // (file URLs only — video links of activities are read with splitActivityFileUrl)
  const parseFileUrls = (fileUrl?: string | null): string[] => splitActivityFileUrl(fileUrl).files;

  // Filtered course items
  const filteredCourses = courses.filter(
    (c) => c.semester_id === semester && c.year === year
  );

  const activeCourse = courses.find((c) => c.course_id === selectedCourseId);
  const activeCourseMaterials = materials.filter((m) => m.course_id === selectedCourseId);
  const activeCourseAssignments = assignments.filter((a) => a.course_id === selectedCourseId);
  const activeCourseQuestions = questions.filter((q: Question) => q.course_id === selectedCourseId);
  const activeCourseActivities = activities.filter((a: ActiveLearning) => a.course_id === selectedCourseId);
  const activeCourseReflections = reflections.filter((r: TeachingReflection) => r.course_id === selectedCourseId);

  // 7. Security and Authentication handlers
  const handleAdminLogin = async () => {
    // Always compare with the latest password in the DB — the copy loaded with the
    // page can be stale (e.g. password was reset while the page was open).
    if (adminLoggingIn) return;
    setAdminLoggingIn(true);
    setLoginError('');
    let storedPw = siteProfile.admin_password || 'admin123';
    try {
      const fetchPw = supabase.from('site_settings').select('admin_password').eq('id', 1).maybeSingle();
      // Give up after 5 s and use the value loaded with the page
      const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 5000));
      const res = await Promise.race([fetchPw, timeout]);
      const fresh = res && 'data' in res ? res.data?.admin_password : undefined;
      if (fresh) {
        storedPw = fresh;
        setSiteProfile((prev: SiteProfile) => ({ ...prev, admin_password: fresh }));
      }
    } catch { /* offline — fall back to the loaded value */ }
    setAdminLoggingIn(false);
    if (adminPassword.trim() === storedPw.trim()) {
      setShowAdminPassword(false);
      // Guard ref immediately so SIGNED_OUT callback cannot override admin role
      roleRef.current = 'admin';
      // Fire-and-forget: clear any student OAuth session without blocking
      supabase.auth.signOut().catch(() => {});
      setStudentProfile(null);
      setRole('admin');
      setShowLoginModal(false);
      setAdminPassword('');
      setLoginError('');
    } else {
      setLoginError('รหัสผ่านไม่ถูกต้อง! กรุณาลองใหม่');
    }
  };

  const handleAdminLogout = () => {
    roleRef.current = 'guest';
    setRole('guest');
    setCurrentPage('courses');
    setSelectedCourseId(null);
  };

  const handleStudentLogout = async () => {
    await supabase.auth.signOut();
    setStudentProfile(null);
    setRole('guest');
    setCurrentPage('courses');
    setSelectedCourseId(null);
  };

  const handleUpdateStudentProfile = (updated: StudentProfile) => {
    setStudentProfile(updated);
  };

  // 8. CRUD Handlers
  // Save or Add course
  const handleSaveCourse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!courseForm.course_code.trim()) {
      setCourseFormError('กรุณากรอกรหัสวิชา *');
      return;
    }
    if (!courseForm.course_name_th.trim()) {
      setCourseFormError('กรุณากรอกชื่อรายวิชาภาษาไทย *');
      return;
    }
    if (!courseForm.course_name_en.trim()) {
      setCourseFormError('กรุณากรอกชื่อรายวิชาภาษาอังกฤษ *');
      return;
    }
    setCourseFormError('');
    const objectives = courseForm.objectivesInput
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (editingCourse) {
      const updateData = {
        course_code: courseForm.course_code.trim(),
        course_name_th: courseForm.course_name_th.trim(),
        course_name_en: courseForm.course_name_en.trim(),
        description: courseForm.description.trim(),
        objectives,
        semester_id: courseForm.semester_id,
        year: courseForm.year,
        credit: courseForm.credit.trim() || '3((3)-0-6)',
        section: courseForm.section.trim() || '01',
        theory_hours: Number(courseForm.theory_hours),
        practice_hours: Number(courseForm.practice_hours),
        total_weeks: Number(courseForm.total_weeks) || 15,
        enrollment_code: courseForm.enrollment_code.trim(),
      };
      const { error } = await supabase.from('courses').update(updateData).eq('course_id', editingCourse.course_id);
      if (error) { alert(`ไม่สามารถแก้ไขวิชาได้: ${error.message}`); return; }
      setCourses(courses.map((c: Course) => c.course_id === editingCourse.course_id ? { ...c, ...updateData } : c));
    } else {
      const course_id = `${courseForm.course_code.trim()}-${courseForm.semester_id}-${courseForm.year}`;
      const newCourse: Course = {
        course_id,
        course_code: courseForm.course_code.trim(),
        course_name_th: courseForm.course_name_th.trim(),
        course_name_en: courseForm.course_name_en.trim(),
        description: courseForm.description.trim(),
        objectives,
        semester_id: courseForm.semester_id,
        year: courseForm.year,
        credit: courseForm.credit.trim() || '3((3)-0-6)',
        section: courseForm.section.trim() || '01',
        theory_hours: Number(courseForm.theory_hours),
        practice_hours: Number(courseForm.practice_hours),
        total_weeks: Number(courseForm.total_weeks) || 15,
        enrollment_code: courseForm.enrollment_code.trim(),
        views: 0
      };
      const { error } = await supabase.from('courses').insert(newCourse);
      if (error) { alert(`ไม่สามารถเพิ่มวิชาได้: ${error.message}`); return; }
      setCourses([...courses, newCourse]);
    }

    setShowCourseModal(false);
    setEditingCourse(null);
  };

  const handleEditCourseClick = (course: Course, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering details navigation
    setEditingCourse(course);
    setCourseForm({
      course_code: course.course_code,
      course_name_th: course.course_name_th,
      course_name_en: course.course_name_en,
      description: course.description,
      objectivesInput: course.objectives.join('\n'),
      semester_id: course.semester_id,
      year: course.year,
      credit: course.credit || '3((3)-0-6)',
      section: course.section || '01',
      theory_hours: course.theory_hours ?? 0,
      practice_hours: course.practice_hours ?? 0,
      total_weeks: course.total_weeks ?? 15,
      enrollment_code: course.enrollment_code || '',
    });
    setShowCourseModal(true);
  };

  const handleDeleteCourse = async (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('คุณต้องการลบรายวิชานี้ใช่หรือไม่? (ข้อมูลเอกสารและการส่งงานที่เกี่ยวข้องจะถูกซ่อน)')) {
      const { error } = await supabase.from('courses').delete().eq('course_id', courseId);
      if (error) { alert(`ไม่สามารถลบวิชาได้: ${error.message}`); return; }
      setCourses(courses.filter((c: Course) => c.course_id !== courseId));
      if (selectedCourseId === courseId) setSelectedCourseId(null);
    }
  };

  const handleEditMaterialClick = (material: Material) => {
    setEditingMaterial(material);
    setMaterialForm({
      title: material.title,
      type: material.type,
      week_number: material.week_number ?? 1,
      file_url: material.file_url,
      description: material.description || ''
    });
    setShowMaterialModal(true);
  };

  const handleEditAssignmentClick = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setAssignmentForm({
      title: assignment.title,
      description: assignment.description,
      due_date: assignment.due_date,
      week_number: assignment.week_number ?? 1,
      attachment_url: assignment.attachment_url || '',
      status: assignment.status
    });
    setAssignmentLinks(parseAttachments(assignment.attachment_url));
    setShowAssignmentModal(true);
  };

  // Called from BackOffice (no MouseEvent)
  const handleEditCourseFromBackOffice = (course: Course) => {
    setEditingCourse(course);
    setCourseForm({
      course_code: course.course_code,
      course_name_th: course.course_name_th,
      course_name_en: course.course_name_en,
      description: course.description,
      objectivesInput: course.objectives.join('\n'),
      semester_id: course.semester_id,
      year: course.year,
      credit: course.credit || '3((3)-0-6)',
      section: course.section || '01',
      theory_hours: course.theory_hours || 0,
      practice_hours: course.practice_hours || 0,
      total_weeks: course.total_weeks || 15,
      enrollment_code: course.enrollment_code || '',
    });
    setShowCourseModal(true);
  };

  /** Open the submit form; with `previous`, it is pre-filled to edit that attempt. */
  const openSubmitModal = (assign: Assignment, previous?: AssignmentSubmission) => {
    setSubmittingAssignment(assign);
    setSubmitForm({ answer_text: previous?.answer_text || '', link_url: previous?.link_url || '' });
    setSubmitKeptFiles(previous ? parseFileUrls(previous.file_url) : []);
    setResubmitOf(previous ?? null);
    setSubmitFiles([]);
    setSubmitUploadError('');
    setShowSubmitModal(true);
  };

  /** A student deletes one of their own (ungraded) submission attempts. */
  const handleDeleteSubmission = async (sub: AssignmentSubmission) => {
    if (!studentProfile || sub.student_id !== studentProfile.id) return;
    if (!confirm('ลบงานที่ส่งครั้งนี้? ลบแล้วกู้คืนไม่ได้')) return;
    const { error } = await supabase.from('assignment_submissions').delete()
      .eq('submission_id', sub.submission_id).eq('student_id', studentProfile.id);
    if (error) { alert(`ลบงานไม่สำเร็จ: ${error.message}`); return; }
    const remaining = submissions.filter(s => s.submission_id !== sub.submission_id);
    setSubmissions(remaining);
    // Remove uploaded files no other attempt still uses (best effort).
    const stillUsed = new Set(remaining.flatMap(s => parseFileUrls(s.file_url)));
    const marker = '/object/public/course-materials/';
    const paths = parseFileUrls(sub.file_url)
      .filter(u => !stillUsed.has(u) && u.includes(marker))
      .map(u => decodeURIComponent(u.split(marker)[1].split('?')[0]));
    if (paths.length) await supabase.storage.from('course-materials').remove(paths);
  };

  const resetSubmitModal = () => {
    setShowSubmitModal(false);
    setSubmittingAssignment(null);
    setSubmitForm({ answer_text: '', link_url: '' });
    setSubmitFiles([]);
    setSubmitKeptFiles([]);
    setResubmitOf(null);
    setSubmitUploading(false);
    setSubmitUploadError('');
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingAssignment || !selectedCourseId || !studentProfile) return;

    const hasContent = submitForm.answer_text.trim() || submitFiles.length > 0 || submitKeptFiles.length > 0 || submitForm.link_url.trim();
    if (!hasContent) { alert('กรุณากรอกคำตอบ หรือแนบไฟล์ หรือใส่ลิงก์งาน'); return; }

    let fileUrlValue: string | undefined = submitKeptFiles.length === 0 ? undefined
      : submitKeptFiles.length === 1 ? submitKeptFiles[0] : JSON.stringify(submitKeptFiles);
    if (submitFiles.length > 0) {
      setSubmitUploading(true);
      setSubmitUploadError('');
      const uploadedUrls: string[] = [];
      for (const file of submitFiles) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `submissions/${submittingAssignment.assignment_id}/${studentProfile.id}_${Date.now()}_${safeName}`;
        const { error: uploadError } = await supabase.storage.from('course-materials').upload(storagePath, file, { upsert: false });
        if (uploadError) {
          setSubmitUploadError(uploadError.message);
          setSubmitUploading(false);
          return;
        }
        const { data: urlData } = supabase.storage.from('course-materials').getPublicUrl(storagePath);
        uploadedUrls.push(urlData.publicUrl);
      }
      // Each edit is a new attempt row (the log); files kept from the previous attempt come first.
      const allUrls = [...submitKeptFiles, ...uploadedUrls];
      fileUrlValue = allUrls.length === 1 ? allUrls[0] : JSON.stringify(allUrls);
      setSubmitUploading(false);
    }

    const submission_id = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newSub: AssignmentSubmission = {
      submission_id,
      student_id: studentProfile.id,
      assignment_id: submittingAssignment.assignment_id,
      course_id: selectedCourseId,
      submitted_at: new Date().toISOString(),
      answer_text: submitForm.answer_text.trim() || undefined,
      file_url: fileUrlValue,
      link_url: submitForm.link_url.trim() || undefined,
    };
    // assignment_submissions.assignment_id references assignments, so an Active Learning
    // activity needs a hidden anchor row there (same id) before its first submission.
    if (isActivityAnchorId(newSub.assignment_id) && !assignments.some(a => a.assignment_id === newSub.assignment_id)) {
      const { error: anchorError } = await supabase.from('assignments').upsert({
        assignment_id: newSub.assignment_id,
        course_id: selectedCourseId,
        title: submittingAssignment.title,
        description: '',
        due_date: submittingAssignment.due_date || new Date().toISOString().slice(0, 10),
        status: 'closed',
      }, { onConflict: 'assignment_id', ignoreDuplicates: true });
      if (anchorError) { alert(`ส่งงานไม่สำเร็จ: ${anchorError.message}`); return; }
    }
    const { error } = await supabase.from('assignment_submissions').insert(newSub);
    if (error) { alert(`ส่งงานไม่สำเร็จ: ${error.message}`); return; }
    setSubmissions(prev => [newSub, ...prev]);
    resetSubmitModal();
  };

  // Navigate to course in main view with specific tab
  const handleBackOfficeNavigateToCourse = (courseId: string, tab: string, itemId?: string) => {
    setSelectedCourseId(courseId);
    setCourseDetailTab(tab as 'info' | 'materials' | 'assignments' | 'qa' | 'active_learning' | 'reflection');
    setCurrentPage('courses');
    setFocusItemId(itemId ?? null);
  };

  const handleAddCourseClick = () => {
    setEditingCourse(null);
    setCourseForm({
      course_code: '',
      course_name_th: '',
      course_name_en: '',
      description: '',
      objectivesInput: '',
      semester_id: semester,
      year: year,
      credit: '3((3)-0-6)',
      section: '01',
      theory_hours: 0,
      practice_hours: 0,
      total_weeks: 15,
      enrollment_code: '',
    });
    setShowCourseModal(true);
  };

  // Add or Edit teaching material
  const resetMaterialModal = () => {
    setShowMaterialModal(false);
    setEditingMaterial(null);
    setMaterialForm({ title: '', type: 'slides', week_number: 1, file_url: '', description: '' });
    setMaterialUploadMode('url');
    setMaterialFiles([]);
    setMaterialUploading(false);
    setMaterialUploadProgress([]);
  };

  const handleAddMaterial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    if (editingMaterial) {
      let fileUrl = materialForm.file_url.trim() || 'https://example.com';

      if (materialUploadMode === 'file' && materialFiles.length > 0) {
        setMaterialUploading(true);
        setMaterialUploadProgress([{ name: materialFiles[0].name, status: 'uploading' }]);
        const file = materialFiles[0];
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${selectedCourseId}/${Date.now()}_${safeName}`;
        const { error: uploadError } = await supabase.storage.from('course-materials').upload(storagePath, file, { upsert: false });
        if (uploadError) {
          setMaterialUploadProgress([{ name: file.name, status: 'error', error: uploadError.message }]);
          setMaterialUploading(false);
          return;
        }
        const { data: urlData } = supabase.storage.from('course-materials').getPublicUrl(storagePath);
        fileUrl = urlData.publicUrl;
        setMaterialUploadProgress([{ name: file.name, status: 'done' }]);
        setMaterialUploading(false);
      }

      const updateData = {
        title: materialForm.title.trim(),
        type: materialForm.type,
        week_number: Number(materialForm.week_number),
        file_url: fileUrl,
        description: materialForm.description.trim()
      };
      const { error } = await supabase.from('materials').update(updateData).eq('material_id', editingMaterial.material_id);
      if (error) { alert(`ไม่สามารถแก้ไขเอกสารได้: ${error.message}`); return; }
      setMaterials(materials.map((m: Material) => m.material_id === editingMaterial.material_id ? { ...m, ...updateData } : m));
      resetMaterialModal();
      return;
    }

    if (materialUploadMode === 'file' && materialFiles.length > 0) {
      setMaterialUploading(true);
      setMaterialUploadProgress(materialFiles.map(f => ({ name: f.name, status: 'pending' })));

      const newMaterials: Material[] = [];
      let hasError = false;

      for (let i = 0; i < materialFiles.length; i++) {
        const file = materialFiles[i];
        setMaterialUploadProgress(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'uploading' } : p));

        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${selectedCourseId}/${Date.now()}_${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from('course-materials')
          .upload(storagePath, file, { upsert: false });

        if (uploadError) {
          setMaterialUploadProgress(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'error', error: uploadError.message } : p));
          hasError = true;
          continue;
        }

        const { data: urlData } = supabase.storage.from('course-materials').getPublicUrl(storagePath);
        const publicUrl = urlData.publicUrl;

        const guessedType: MaterialType = ['ppt', 'pptx', 'key'].includes(ext)
          ? 'slides'
          : ['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)
          ? 'video'
          : 'document';
        const fileType: MaterialType = materialForm.type !== 'link' ? materialForm.type : guessedType;

        const baseName = materialForm.title.trim() || file.name.replace(/\.[^.]+$/, '');
        const title = materialFiles.length > 1 ? `${baseName} — ${file.name}` : baseName;

        const material_id = `mat-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 9)}`;
        const newMaterial: Material = {
          material_id,
          course_id: selectedCourseId,
          title,
          type: fileType,
          week_number: Number(materialForm.week_number),
          file_url: publicUrl,
          description: materialForm.description.trim(),
          created_at: new Date(Date.now() + i).toISOString(),
        };

        const { error: insertError } = await supabase.from('materials').insert(newMaterial);
        if (insertError) {
          setMaterialUploadProgress(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'error', error: insertError.message } : p));
          hasError = true;
          continue;
        }

        newMaterials.push(newMaterial);
        setMaterialUploadProgress(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'done' } : p));
      }

      setMaterials(prev => [...prev, ...newMaterials]);
      setMaterialUploading(false);
      if (!hasError) resetMaterialModal();
      return;
    }

    // URL mode
    if (!materialForm.title.trim()) { alert('กรุณากรอกหัวเรื่อง'); return; }
    const material_id = `mat-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const newMaterial: Material = {
      material_id,
      course_id: selectedCourseId,
      title: materialForm.title.trim(),
      type: materialForm.type,
      week_number: Number(materialForm.week_number),
      file_url: materialForm.file_url.trim() || 'https://example.com',
      description: materialForm.description.trim(),
      created_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('materials').insert(newMaterial);
    if (error) { alert(`ไม่สามารถเพิ่มเอกสารได้: ${error.message}`); return; }
    setMaterials([...materials, newMaterial]);
    resetMaterialModal();
  };

  // Display order of materials: by week, then by created_at (used as the order
  // key inside a week — swapped when the admin moves an item up or down).
  const compareMaterials = (a: Material, b: Material) =>
    (a.week_number || 0) - (b.week_number || 0)
    || (a.created_at || '').localeCompare(b.created_at || '')
    || a.material_id.localeCompare(b.material_id);

  const [movingMaterialId, setMovingMaterialId] = useState<string | null>(null);

  // Swap a material with its neighbour (same course and week) by exchanging created_at.
  const handleMoveMaterial = async (mat: Material, dir: -1 | 1) => {
    const sameWeek = materials
      .filter(m => m.course_id === mat.course_id && (m.week_number || 0) === (mat.week_number || 0))
      .sort(compareMaterials);
    const idx = sameWeek.findIndex(m => m.material_id === mat.material_id);
    const other = sameWeek[idx + dir];
    if (idx < 0 || !other) return;

    let aTime = mat.created_at || '';
    let bTime = other.created_at || '';
    if (!aTime || !bTime || aTime === bTime) {
      // Missing/equal timestamps: give the pair two distinct ones first.
      const base = Date.parse(aTime || bTime) || Date.now();
      aTime = new Date(base).toISOString();
      bTime = new Date(base + 1).toISOString();
      if (dir === -1) [aTime, bTime] = [bTime, aTime];
    }
    const newMat = bTime;   // mat takes the neighbour's place
    const newOther = aTime;

    setMovingMaterialId(mat.material_id);
    const prev = materials;
    setMaterials(ms => ms.map(m =>
      m.material_id === mat.material_id ? { ...m, created_at: newMat }
      : m.material_id === other.material_id ? { ...m, created_at: newOther } : m));
    try {
      const r1 = await supabase.from('materials').update({ created_at: newMat }).eq('material_id', mat.material_id);
      if (r1.error) throw r1.error;
      const r2 = await supabase.from('materials').update({ created_at: newOther }).eq('material_id', other.material_id);
      if (r2.error) throw r2.error;
    } catch (err) {
      setMaterials(prev);
      alert(`สลับลำดับไม่สำเร็จ: ${err instanceof Error ? err.message : (err as { message?: string })?.message || String(err)}`);
    } finally {
      setMovingMaterialId(null);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (confirm('ยืนยันระบบลบเอกสารการเรียนการสอนนี้?')) {
      const { error } = await supabase.from('materials').delete().eq('material_id', materialId);
      if (error) { alert(`ไม่สามารถลบเอกสารได้: ${error.message}`); return; }
      setMaterials(materials.filter((m: Material) => m.material_id !== materialId));
    }
  };

  // Add or Edit Assignment
  const handleAddAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    const badLink = assignmentLinks.find(l => l.url.trim() && !/^https?:\/\//i.test(l.url.trim()));
    if (badLink) { alert(`ลิงก์ต้องขึ้นต้นด้วย http:// หรือ https://\n${badLink.url}`); return; }
    const attachmentValue = serializeAttachments(assignmentLinks);

    if (editingAssignment) {
      const updateData = {
        title: assignmentForm.title.trim(),
        description: assignmentForm.description.trim(),
        due_date: assignmentForm.due_date,
        week_number: Number(assignmentForm.week_number) || 1,
        attachment_url: attachmentValue,
        status: assignmentForm.status
      };
      const { error } = await supabase.from('assignments').update(updateData).eq('assignment_id', editingAssignment.assignment_id);
      if (error) { alert(`ไม่สามารถแก้ไขงานมอบหมายได้: ${error.message}`); return; }
      setAssignments(assignments.map((a: Assignment) => a.assignment_id === editingAssignment.assignment_id ? { ...a, ...updateData } : a));
      setEditingAssignment(null);
    } else {
      const assignment_id = `asm-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      const newAssignment: Assignment = {
        assignment_id,
        course_id: selectedCourseId,
        title: assignmentForm.title.trim(),
        description: assignmentForm.description.trim(),
        due_date: assignmentForm.due_date,
        week_number: Number(assignmentForm.week_number) || 1,
        attachment_url: attachmentValue || undefined,
        status: assignmentForm.status
      };
      const { error } = await supabase.from('assignments').insert(newAssignment);
      if (error) { alert(`ไม่สามารถเพิ่มงานมอบหมายได้: ${error.message}`); return; }
      setAssignments([...assignments, newAssignment]);
    }

    setShowAssignmentModal(false);
    setAssignmentForm({ title: '', description: '', due_date: '2026-06-30', week_number: 1, attachment_url: '', status: 'open' });
    setAssignmentLinks([]);
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (confirm('ยืนยันความต้องการที่จะลบงานมอบหมายนี้ใช่หรือไม่?')) {
      const { error } = await supabase.from('assignments').delete().eq('assignment_id', assignmentId);
      if (error) { alert(`ไม่สามารถลบงานมอบหมายได้: ${error.message}`); return; }
      setAssignments(assignments.filter((a: Assignment) => a.assignment_id !== assignmentId));
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* PDPA */}
      <PDPAConsentBanner
        onOpenPrivacy={() => setShowPrivacyModal(true)}
        policyVersion={siteProfile.pdpa_version || ''}
      />
      {showPrivacyModal && (
        <PDPAPrivacyModal
          onClose={() => setShowPrivacyModal(false)}
          siteProfile={siteProfile}
        />
      )}

      {/* 1. Header Navigation */}
      <Navbar
        currentRole={role}
        currentPage={currentPage}
        studentProfile={studentProfile}
        onLogin={() => setShowLoginModal(true)}
        onLogout={handleAdminLogout}
        onStudentLogin={() => { setStudentAuthInitialTab('register'); setShowStudentAuthModal(true); }}
        onStudentLogout={handleStudentLogout}
        onNavigate={(page) => { setCurrentPage(page); setSelectedCourseId(null); }}
      />

      {/* 2. Top Portal Announcement — hidden on profile page */}
      {currentPage === 'courses' && <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white py-12 px-4 shadow-inner relative overflow-hidden">
        {/* Abstract design elements */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 left-10 w-60 h-60 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="space-y-4 max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shadow-sm">
              <Sparkles size={12} className="animate-pulse" />
              <span>ระบบจัดการความรู้รายวิชา</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Teaching Portfolio
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
              ยินดีต้อนรับสู่ระบบจัดการความรู้รายวิชาโดย <span className="text-white font-semibold">{siteProfile.profile_name}</span>. สามารถค้นคว้าสไลด์ประกอบการสอน ตารางส่งงาน และติดตามการวัดเบื้องต้นตามรายบทของภาคเรียนต่าง ๆ
            </p>
            
            {siteProfile.profile_link_url && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                <a
                  href={siteProfile.profile_link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-white font-medium bg-[#4F46E5] hover:bg-indigo-500 px-5 py-2.5 rounded-xl transition duration-150 shadow-lg shadow-indigo-900/30 active:scale-95"
                >
                  <GraduationCap size={16} />
                  <span>ข้อมูล Profile อาจารย์</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>

          {/* Quick Stats/Instructor Badge */}
          <div className="bg-white/5 backdrop-blur-md border border-white/15 rounded-3xl p-6 w-full max-w-xs space-y-4 text-center md:text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold border border-white/10 text-xs">
                {siteProfile.profile_name.charAt(0)}
              </div>
              <div className="text-left">
                <div className="text-xs text-indigo-300 font-bold tracking-wider">เจ้าของผลงาน</div>
                <div className="text-sm font-bold text-white leading-tight">{siteProfile.profile_name}</div>
                {siteProfile.profile_title && (
                  <div className="text-[10px] text-indigo-300/70 leading-tight">{siteProfile.profile_title}</div>
                )}
              </div>
            </div>
            
            <div className="border-t border-white/10 pt-3.5 grid grid-cols-2 gap-2 text-center">
              <div>
                <div className="text-xs text-slate-400">จำนวนรายวิชา</div>
                <div className="text-lg font-bold text-indigo-200">{courses.length} วิชายอดนิยม</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">บทบาทปัจจุบัน</div>
                <div className="text-xs font-bold text-emerald-400 mt-1 capitalize">{role} mode</div>
              </div>
            </div>
          </div>
        </div>
      </div>}

      {/* 3a. BackOffice — full-width, outside container */}
      {currentPage === 'admin-panel' && (
        <BackOffice
          courses={courses}
          materials={materials}
          assignments={assignments}
          questions={questions}
          replies={replies}
          activities={activities}
          reflections={reflections}
          visits={visits}
          loginLogs={loginLogs}
          submissions={submissions}
          students={allStudents}
          siteProfile={siteProfile}
          onNavigateCourses={() => setCurrentPage('courses')}
          onNavigateToCourse={handleBackOfficeNavigateToCourse}
          onEditCourse={handleEditCourseFromBackOffice}
          onAddCourse={handleAddCourseClick}
          onSavePdpa={handleSavePdpa}
          semesterSchedules={semesterSchedules}
          onSaveSchedules={handleSaveSchedules}
          onChangeStudentGroup={handleChangeStudentGroup}
          onAddStudentToCourse={handleAddStudentToCourse}
          onUpdateStudent={handleUpdateStudent}
          onRemoveStudentFromCourse={handleRemoveStudentFromCourse}
          onDeleteStudentAccount={handleDeleteStudentAccount}
          onSaveGrade={handleSaveGrade}
        />
      )}

      {/* 3. Main Workspace Area */}
      {currentPage !== 'admin-panel' && (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow space-y-8 w-full" id="main-content">
        {currentPage === 'dashboard' ? (
          <DashboardPage
            courses={courses}
            materials={materials}
            assignments={assignments}
            questions={questions}
            activities={activities}
            replies={replies}
            visits={visits}
            allStudents={allStudents}
            onNavigateCourses={() => setCurrentPage('courses')}
            onSelectCourse={(id, section, itemId) => {
              setSelectedCourseId(id); setCurrentPage('courses');
              if (itemId && (section === 'materials' || section === 'assignments' || section === 'active_learning')) openCourseItem(section, itemId);
            }}
          />
        ) : currentPage === 'profile' ? (
          <ProfilePage
            role={role}
            profile={siteProfile}
            onBack={() => setCurrentPage('courses')}
            onSave={handleSaveProfile}
            onPasswordChange={handlePasswordChange}
            onPhotoUpload={handlePhotoUpload}
          />
        ) : currentPage === 'student-profile' && studentProfile ? (
          <StudentProfilePage
            studentProfile={studentProfile}
            courses={courses}
            materials={materials}
            assignments={assignments}
            activities={activities}
            visits={visits}
            submissions={submissions}
            onUpdate={handleUpdateStudentProfile}
            onLogout={handleStudentLogout}
          />
        ) : !selectedCourseId ? (
          <>
            {/* 3.1 Course list view */}
            <div className="space-y-6">
              {/* Filter Area */}
              <SemesterSelector
                selectedSemester={semester}
                selectedYear={year}
                yearsList={yearsList}
                onChange={handleSemesterYearChange}
                instructorName={siteProfile.profile_name}
                instructorFaculty={siteProfile.profile_faculty}
              />

              {/* Course block title and command controls */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <BookMarked size={20} className="text-indigo-600" />
                    <span>หลักสูตรวิชาที่เปิดสอนในเทอมนี้</span>
                    <span className="text-xs font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">
                      {filteredCourses.length} รายการ
                    </span>
                  </h2>
                  <p className="text-slate-500 text-xs mt-1">
                    คลิกเลือกการ์ดวิชาเพื่อเข้าชมสไลด์และงานสำคัญของแต่ละวิชาอย่างเป็นทางการ
                  </p>
                </div>

                {role === 'admin' && (
                  <button
                    onClick={handleAddCourseClick}
                    className="flex items-center gap-1.5 text-xs text-white font-semibold px-4 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-indigo-100 cursor-pointer"
                    id="add-course-btn"
                  >
                    <Plus size={14} />
                    <span>เพิ่มคอร์สวิชาใหม่</span>
                  </button>
                )}
              </div>

              {filteredCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map((course, index) => {
                    const colors = getCourseColors(index);
                    const courseMaterialsCount = materials.filter(m => m.course_id === course.course_id).length;
                    const courseAssignmentsCount = assignments.filter(a => a.course_id === course.course_id).length;
                    const isEnrolled = role === 'student' && studentProfile
                      ? visits.some(v => v.student_id === studentProfile.id && v.course_id === course.course_id)
                      : false;
                    return (
                      <div
                        key={course.course_id}
                        onClick={() => handleSelectCourse(course.course_id)}
                        className={`group cursor-pointer rounded-[2rem] border-2 p-6 sm:p-7 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${colors.bg} flex flex-col justify-between min-h-[260px] max-w-full`}
                        id={`course-card-${course.course_code}`}
                      >
                        {/* Header card structure */}
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                                COURSE ARCHIVE
                              </span>
                              {courseHasCode(course) && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-full">
                                  <KeyRound size={9} />
                                  <span>มีรหัส</span>
                                </span>
                              )}
                            </div>

                            {/* Actions toggle only for admin role */}
                            {role === 'admin' && (
                              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={(e) => handleEditCourseClick(course, e)}
                                  className="p-1.5 rounded-full bg-white/80 hover:bg-white text-slate-700 hover:text-indigo-600 transition-colors shadow-sm cursor-pointer"
                                  title="แก้ไขคอร์สนี้"
                                >
                                  <Edit size={12} />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteCourse(course.course_id, e)}
                                  className="p-1.5 rounded-full bg-white/80 hover:bg-white text-slate-700 hover:text-red-600 transition-colors shadow-sm cursor-pointer"
                                  title="ลบคอร์สนี้"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </div>

                          <div>
                            <h3 className={`text-4xl font-extrabold mt-1 mb-1 tracking-tighter ${colors.text}`}>
                              {course.course_code}
                            </h3>
                            <h4 className="text-lg font-bold text-slate-800 tracking-tight line-clamp-1 group-hover:text-indigo-950 transition-colors">
                              {course.course_name_th}
                            </h4>
                             <div className="text-xs font-semibold text-slate-500 tracking-normal line-clamp-1 italic mb-2">
                               {course.course_name_en}
                             </div>
                             {(course.credit || course.section) && (
                               <div className="flex flex-wrap items-center gap-2 mb-3" onClick={(e) => e.stopPropagation()}>
                                 {course.credit && (
                                   <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/70 text-slate-800 border border-black/5 shadow-sm">
                                     หน่วยกิต: {course.credit}
                                   </span>
                                 )}
                                 {course.section && (
                                   <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/70 text-slate-800 border border-black/5 shadow-sm">
                                     {parseInt(course.section, 10) || course.section} กลุ่ม
                                   </span>
                                 )}
                               </div>
                             )}
                             <p className="text-xs text-slate-600 leading-relaxed font-normal line-clamp-2 md:line-clamp-3">
                               {course.description}
                             </p>
                          </div>
                        </div>

                        {/* Footer statistics summary using Editorial design layout */}
                        <div className={`mt-6 pt-4 border-t border-current/10 flex items-center justify-between text-xs font-bold ${colors.text}`}>
                          <div className="flex gap-4 items-end">
                            <div className="text-left">
                              <span className="block text-lg font-black leading-none">{courseMaterialsCount}</span>
                              <span className="text-[9px] uppercase font-bold opacity-60">เอกสาร</span>
                            </div>
                            <div className="text-left">
                              <span className="block text-lg font-black leading-none">{courseAssignmentsCount}</span>
                              <span className="text-[9px] uppercase font-bold opacity-60">งานมอบหมาย</span>
                            </div>
                            <div className="text-left pl-3 ml-1 border-l border-current/20">
                              <span className="flex items-center gap-0.5 text-lg font-black leading-none">
                                <Eye size={13} className="opacity-80" />
                                <span>{visits.filter(v => v.course_id === course.course_id).length}</span>
                              </span>
                              <span className="text-[9px] uppercase font-bold opacity-65">นักศึกษา</span>
                            </div>
                          </div>

                          {role === 'guest' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider bg-current/10 px-3 py-1.5 rounded-full transition-transform group-hover:translate-x-1">
                              <span>ลงชื่อเข้าเรียน</span>
                              <ChevronRight size={14} />
                            </span>
                          ) : role === 'student' && isEnrolled ? (
                            <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider bg-current/10 px-3 py-1.5 rounded-full transition-transform group-hover:translate-x-1">
                              <CheckCircle size={12} />
                              <span>กดดูรายวิชา</span>
                              <ChevronRight size={14} />
                            </span>
                          ) : role === 'student' ? (
                            <span className="inline-flex items-center gap-0.5 text-xs font-black uppercase tracking-wider bg-current/10 px-3 py-1.5 rounded-full transition-transform group-hover:translate-x-1">
                              <span>ลงชื่อเข้าเรียน</span>
                              <ChevronRight size={14} />
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-xs font-black uppercase tracking-wider bg-current/10 px-3 py-1.5 rounded-full transition-transform group-hover:translate-x-1">
                              <span>เข้าเรียน</span>
                              <ChevronRight size={14} />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-full space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                    <BookOpen size={28} />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-slate-900">ไม่พบรายวิชาที่ค้นหา</h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                      ยังไม่มีหลักสูตรคอร์สเรียนเปิดสอนในภาคเรียนที่ {semester}/{year} นี้
                      {courses.length > 0 ? ` (DB มี ${courses.length} วิชา แต่ต่างเทอม — ลองเปลี่ยนปี/เทอมด้านบน)` : role === 'admin' ? ' อาจารย์สามารถกดปุ่ม "เพิ่มคอร์สวิชาใหม่" เพื่อเพิ่มวิชาได้ทันที' : ' ตรวจสอบภาคการเรียนอื่นด้านบน'}
                    </p>
                    {dbError && (
                      <p className="text-xs text-red-600 font-mono bg-red-50 border border-red-200 rounded-xl px-4 py-2 mt-2 text-left">
                        ⚠ {dbError}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>

        ) : (
          /* 3.2 DETAILED COURSE VIEW PORTAL */
          <div className="space-y-6">
            {/* Top Navigation Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <button
                onClick={handleBackToList}
                className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors bg-white hover:bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm"
              >
                <ArrowLeft size={14} />
                <span>ย้อนกลับไป รายชื่อคอร์สทั้งหมด</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">สถานะวิชา:</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                  ภาคการสอน {activeCourse?.semester_id}/{activeCourse?.year}
                </span>
              </div>
            </div>

            {activeCourse ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: Banner / Quick course detail profile */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                    {/* Visual header */}
                    <div className="space-y-3 pb-5 border-b border-slate-100">
                      <span className="inline-block text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                        {activeCourse.course_code}
                      </span>
                      <h2 className="text-2xl font-black text-slate-950 tracking-tight leading-snug">
                        {activeCourse.course_name_th}
                      </h2>
                      <div className="text-xs font-semibold text-slate-500 leading-normal italic">
                        {activeCourse.course_name_en}
                      </div>
                    </div>

                    {/* Course long description paragraph */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">คำอธิบายรายวิชา (Description)</h4>
                      <p className="text-xs text-slate-600 leading-relaxed font-normal">
                        {activeCourse.description}
                      </p>
                    </div>

                    {/* Meta quick checklist */}
                    <div className="pt-2">
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">รหัสเฉพาะคอร์ส</span>
                          <span className="font-semibold text-slate-800">{activeCourse.course_id}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">เทอมปีการจัดการ</span>
                          <span className="font-semibold text-slate-800">{activeCourse.semester_id}/{activeCourse.year}</span>
                        </div>
                        {activeCourse.credit && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">หน่วยกิต (Credit)</span>
                            <span className="font-semibold text-slate-800">{activeCourse.credit}</span>
                          </div>
                        )}
                        {activeCourse.section && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">จำนวนกลุ่มสอน</span>
                            <span className="font-semibold text-slate-800">{parseInt(activeCourse.section ?? '', 10) || activeCourse.section} กลุ่ม</span>
                          </div>
                        )}
                        {((activeCourse.theory_hours ?? 0) > 0 || (activeCourse.practice_hours ?? 0) > 0) && (<>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">ทฤษฏี / ปฏิบัติ (ต่อสัปดาห์)</span>
                            <span className="font-semibold text-slate-800">
                              <span className="text-indigo-600">{activeCourse.theory_hours ?? 0}</span>
                              {' / '}
                              <span className="text-emerald-600">{activeCourse.practice_hours ?? 0}</span>
                              {' ชม.'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">รวมทั้งภาคเรียน</span>
                            <span className="font-bold text-blue-700">
                              {((activeCourse.theory_hours ?? 0) + (activeCourse.practice_hours ?? 0)) * (activeCourse.total_weeks ?? 15)} ชม.
                              <span className="text-[10px] font-normal text-slate-400 ml-1">({activeCourse.total_weeks ?? 15} สัปดาห์)</span>
                            </span>
                          </div>
                        </>)}
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                          <span className="text-slate-500">นักศึกษาที่เข้าเรียน</span>
                          <span className="font-extrabold text-indigo-600 flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100/50">
                            <Eye size={13} className="text-indigo-500" />
                            <span>{visits.filter(v => v.course_id === activeCourse.course_id).length} คน</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {role === 'admin' && (
                      <button
                        onClick={(e) => handleEditCourseClick(activeCourse, e)}
                        className="w-full flex items-center justify-center gap-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-4 py-2.5 rounded-2xl transition-all"
                      >
                        <Edit size={13} />
                        <span>แก้ไขข้อมูลรายวิชานี้</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Side: Primary Course Documents and Active assignments tabs */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Tab bar — order: CLOs | Materials | Active Learning | Q&A | Assignments */}
                  <div className="flex bg-slate-200/60 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto gap-0.5">
                    {([
                      { key: 'info',            label: 'วัตถุประสงค์',   icon: <BookOpen size={14} />,    badge: null },
                      { key: 'materials',       label: 'เอกสารประกอบ',   icon: <Layers size={14} />,     badge: activeCourseMaterials.length, badgeColor: 'bg-indigo-50 border-indigo-100 text-indigo-600' },
                      { key: 'active_learning', label: 'Active Learning', icon: <Zap size={14} />,        badge: activeCourseActivities.length || null, badgeColor: 'bg-green-50 border-green-100 text-green-600' },
                      { key: 'qa',              label: 'ถาม-ตอบ',         icon: <MessageCircle size={14} />, badge: activeCourseQuestions.length || null, badgeColor: 'bg-amber-50 border-amber-100 text-amber-600' },
                      { key: 'assignments',     label: 'งานมอบหมาย',     icon: <FileText size={14} />,    badge: activeCourseAssignments.length, badgeColor: 'bg-pink-50 border-pink-100 text-pink-600' },
                      { key: 'plan',            label: 'แผนการสอน',      icon: <BookMarked size={14} />,  badge: null },
                    ] as { key: string; label: string; icon: React.ReactNode; badge: number | null; badgeColor?: string }[]).map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setCourseDetailTab(tab.key as 'info' | 'materials' | 'assignments' | 'qa' | 'active_learning' | 'reflection' | 'plan')}
                        className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 px-1 rounded-xl transition duration-150 whitespace-nowrap min-w-fit ${
                          courseDetailTab === tab.key
                            ? 'bg-white text-indigo-700 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                        }`}
                      >
                        {tab.icon}
                        <span>{tab.label}</span>
                        {tab.badge ? (
                          <span className={`text-[9px] font-semibold border px-1.5 py-0.5 rounded-full ${tab.badgeColor}`}>
                            {tab.badge}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>

                  {/* TAB OUTPUT VIEWS */}
                  {courseDetailTab === 'info' && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
                          <CheckCircle size={18} className="text-emerald-500" />
                          <span>วัตถุประสงค์รายวิชา / CLOs (Course Learning Outcomes)</span>
                        </h3>
                      </div>

                      {activeCourse.objectives && activeCourse.objectives.length > 0 ? (
                        <div className="space-y-3.5">
                          {activeCourse.objectives.map((obj, i) => (
                            <div key={i} className="flex gap-3 items-start border-l-2 border-indigo-100 pl-4 py-1.5 bg-slate-50/50 rounded-r-2xl pr-3 hover:bg-indigo-50/20 hover:border-indigo-300 transition-colors duration-150">
                              <span className="text-xs font-extrabold text-indigo-600 mt-0.5 min-w-[20px]">
                                CLO{i + 1}
                              </span>
                              <p className="text-xs text-slate-700 leading-relaxed">
                                {obj}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">ไม่ได้กำหนดวัตถุประสงค์รายวิชาไว้ในฐานข้อมูล</p>
                      )}
                    </div>
                  )}

                  {courseDetailTab === 'materials' && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                      {/* Section Title & Admin Controls */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-950">คลังสไลด์และเอกสารประกอบการสอน</h3>
                          <p className="text-slate-500 text-[11px]">เอกสารการเรียนแยกตามสัปดาห์</p>
                        </div>

                        {role === 'admin' && (
                          <button
                            onClick={() => setShowMaterialModal(true)}
                            className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 font-bold px-3 py-1.5 rounded-xl transition-all"
                            id="add-material-btn"
                          >
                            <Plus size={14} />
                            <span>อัปโหลดงานเอกสารเพิ่ม</span>
                          </button>
                        )}
                      </div>

                      {activeCourseMaterials.length > 0 ? (
                        <div className="space-y-4">
                          {activeCourseMaterials
                            .sort(compareMaterials)
                            .map((mat, matIdx, sortedMats) => {
                              const prevMat = sortedMats[matIdx - 1];
                              const nextMat = sortedMats[matIdx + 1];
                              const canMoveUp = !!prevMat && (prevMat.week_number || 0) === (mat.week_number || 0);
                              const canMoveDown = !!nextMat && (nextMat.week_number || 0) === (mat.week_number || 0);
                              const weekNo = mat.week_number || 0;
                              const isFirstOfWeek = !prevMat || (prevMat.week_number || 0) !== weekNo;
                              const weekItemCount = sortedMats.filter(m => (m.week_number || 0) === weekNo).length;
                              // Choose Icon based on Type
                              const getMatIcon = (type: MaterialType) => {
                                switch (type) {
                                  case 'slides': return <Presentation size={18} className="text-amber-500" />;
                                  case 'video': return <Video size={18} className="text-rose-500" />;
                                  case 'document': return <FileText size={18} className="text-blue-500" />;
                                  case 'link': return <ExternalLink size={18} className="text-indigo-500" />;
                                  default: return <BookOpen size={18} className="text-slate-500" />;
                                }
                              };

                              return (
                                <React.Fragment key={mat.material_id}>
                                {isFirstOfWeek && (
                                  <div className={`flex items-center gap-3 ${matIdx > 0 ? 'pt-4' : ''}`}>
                                    <span className="shrink-0 text-xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                                      {weekNo > 0 ? `สัปดาห์ที่ ${weekNo}` : 'ไม่ระบุสัปดาห์'}
                                    </span>
                                    <span className="shrink-0 text-[10px] font-semibold text-slate-400">{weekItemCount} รายการ</span>
                                    <div className="flex-1 h-px bg-slate-200" />
                                  </div>
                                )}
                                <div
                                  id={`item-${mat.material_id}`}
                                  className="scroll-mt-24 group border border-slate-200 hover:border-slate-300 rounded-2xl p-4 flex items-center justify-between gap-4 transition duration-150 bg-slate-50/40 hover:bg-slate-50"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 border border-slate-100 shadow-sm">
                                      {getMatIcon(mat.type)}
                                    </div>
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[10px] font-semibold text-slate-500 px-1.5 py-0.5 bg-slate-100/50 border border-slate-100 rounded">
                                          {mat.type}
                                        </span>
                                      </div>
                                      <h4 className="text-xs font-bold text-slate-800 tracking-tight mt-1 group-hover:text-indigo-600 transition-colors line-clamp-1">
                                        {mat.title}
                                      </h4>
                                      {mat.description && (
                                        <p className="text-[11px] text-slate-500 mt-1 whitespace-pre-line font-normal leading-relaxed">
                                          {mat.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {/* Action links */}
                                    <a
                                      href={mat.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl border border-indigo-100/50 transition duration-150"
                                    >
                                      <span>เปิดลิงก์</span>
                                      <ExternalLink size={12} />
                                    </a>

                                    {/* Only admin edit/delete */}
                                    {role === 'admin' && (
                                      <>
                                        <div className="flex flex-col">
                                          <button
                                            onClick={() => handleMoveMaterial(mat, -1)}
                                            disabled={!canMoveUp || movingMaterialId !== null}
                                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition duration-150 disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-slate-400 disabled:cursor-not-allowed"
                                            title={canMoveUp ? 'เลื่อนขึ้น' : 'อยู่ลำดับแรกของสัปดาห์นี้แล้ว'}
                                            aria-label="เลื่อนขึ้น"
                                          >
                                            <ArrowUp size={13} />
                                          </button>
                                          <button
                                            onClick={() => handleMoveMaterial(mat, 1)}
                                            disabled={!canMoveDown || movingMaterialId !== null}
                                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition duration-150 disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-slate-400 disabled:cursor-not-allowed"
                                            title={canMoveDown ? 'เลื่อนลง' : 'อยู่ลำดับสุดท้ายของสัปดาห์นี้แล้ว'}
                                            aria-label="เลื่อนลง"
                                          >
                                            <ArrowDown size={13} />
                                          </button>
                                        </div>
                                        <button
                                          onClick={() => handleEditMaterialClick(mat)}
                                          className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition duration-150"
                                          title="แก้ไขเอกสารนี้"
                                        >
                                          <Edit size={14} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteMaterial(mat.material_id)}
                                          className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition duration-150"
                                          title="ลบเอกสารการสอนนี้"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                                </React.Fragment>
                              );
                            })}
                        </div>
                      ) : (
                        <div className="border border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400 max-w-full space-y-2">
                          <Layers size={24} className="mx-auto" />
                          <div className="text-xs">สัปดาห์นี้และห้องเรียนนี้ยังไม่ได้สร้างเอกสารการเรียนประกอบ</div>
                        </div>
                      )}

                      {/* บันทึกการสอน — admin only, เป็นส่วนล่างของ Materials tab */}
                      {role === 'admin' && (
                        <div className="pt-4 border-t border-slate-100 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <NotebookPen size={15} className="text-purple-500" />
                              <div>
                                <h4 className="text-sm font-bold text-slate-900">บันทึกการสอน</h4>
                                <p className="text-[11px] text-slate-500">บันทึกประจำสัปดาห์ — มองเห็นเฉพาะอาจารย์</p>
                              </div>
                            </div>
                            <button
                              onClick={() => { setEditingReflection(null); setReflectionForm({ week_number: activeCourseReflections.length + 1, content: '', image_url: '' }); setShowReflectionModal(true); }}
                              className="flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-xl transition-all"
                            >
                              <Plus size={13} />
                              <span>เพิ่มบันทึก</span>
                            </button>
                          </div>

                          {activeCourseReflections.length > 0 ? (
                            <div className="space-y-3">
                              {activeCourseReflections.map((ref: TeachingReflection) => (
                                <div key={ref.reflection_id} className="border border-purple-100 bg-purple-50/30 rounded-2xl p-4 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-black text-purple-700 bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-lg">
                                        สัปดาห์ที่ {ref.week_number}
                                      </span>
                                      {ref.created_at && (
                                        <span className="text-[10px] text-slate-400">
                                          {new Date(ref.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => handleEditReflectionClick(ref)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><Edit size={12} /></button>
                                      <button onClick={() => handleDeleteReflection(ref.reflection_id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={12} /></button>
                                    </div>
                                  </div>
                                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{ref.content}</p>
                                  {ref.image_url && (
                                    <img
                                      src={ref.image_url}
                                      alt={`บันทึกสัปดาห์ที่ ${ref.week_number}`}
                                      className="mt-2 w-full max-h-64 object-cover rounded-xl border border-purple-100 cursor-pointer"
                                      onClick={() => window.open(ref.image_url, '_blank')}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="border border-dashed border-purple-200 rounded-2xl p-6 text-center text-slate-400 space-y-1.5">
                              <NotebookPen size={20} className="mx-auto text-purple-300" />
                              <div className="text-xs">ยังไม่มีบันทึก กด "เพิ่มบันทึก" เพื่อเริ่มต้น</div>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  )}

                  {courseDetailTab === 'qa' && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
                            <MessageCircle size={17} className="text-amber-500" />
                            <span>กระดานถาม-ตอบ</span>
                          </h3>
                          <p className="text-slate-500 text-[11px] mt-0.5">ตั้งกระทู้คำถาม และตอบกลับได้หลายครั้ง</p>
                        </div>
                        <button
                          onClick={() => {
                            setShowQuestionForm(v => !v);
                            const studentName = studentProfile ? `${studentProfile.first_name} ${studentProfile.last_name}`.trim() : '';
                            setQuestionForm({ author_name: studentName, content: '' });
                            setReplyTargetId(null);
                          }}
                          className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition-all"
                        >
                          <Plus size={14} />
                          <span>ตั้งกระทู้ใหม่</span>
                        </button>
                      </div>

                      {/* New question form */}
                      {showQuestionForm && (
                        <form onSubmit={handlePostQuestion} className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-3">
                          <p className="text-xs font-bold text-amber-800">ตั้งกระทู้ใหม่</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="block text-[11px] font-semibold text-slate-600">ชื่อผู้ถาม *</label>
                              <input
                                type="text"
                                required
                                value={questionForm.author_name}
                                onChange={e => setQuestionForm(f => ({ ...f, author_name: e.target.value }))}
                                placeholder="ชื่อ-นามสกุล หรือรหัสนักศึกษา"
                                className="w-full text-xs text-slate-900 border border-amber-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[11px] font-semibold text-slate-600">คำถาม / เนื้อหากระทู้ *</label>
                            <textarea
                              required
                              rows={3}
                              value={questionForm.content}
                              onChange={e => setQuestionForm(f => ({ ...f, content: e.target.value }))}
                              placeholder="พิมพ์คำถามหรือหัวข้อที่ต้องการพูดคุย..."
                              className="w-full text-xs text-slate-900 border border-amber-200 rounded-xl p-3 focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white leading-relaxed"
                            />
                          </div>
                          <div className="flex items-center justify-end gap-2">
                            <button type="button" onClick={() => setShowQuestionForm(false)} className="text-xs text-slate-500 hover:text-slate-800 font-medium px-3 py-1.5 rounded-xl hover:bg-slate-100 transition">ยกเลิก</button>
                            <button type="submit" className="flex items-center gap-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-xl transition">
                              <Send size={12} />
                              <span>ตั้งกระทู้</span>
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Thread list */}
                      {activeCourseQuestions.length > 0 ? (
                        <div className="space-y-5">
                          {activeCourseQuestions.map((q: Question) => {
                            const threadReplies = replies.filter((r: Reply) => r.question_id === q.question_id);
                            return (
                              <div key={q.question_id} className="border border-slate-200 rounded-2xl overflow-hidden">
                                {/* Question / OP */}
                                <div className="p-4 bg-slate-50/40">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 text-amber-600 font-black text-[10px]">Q</div>
                                      <span className="text-xs font-bold text-slate-800 truncate">{q.author_name}</span>
                                      {q.created_at && (
                                        <span className="text-[10px] text-slate-400 shrink-0">
                                          {new Date(q.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                                        </span>
                                      )}
                                    </div>
                                    {role === 'admin' && (
                                      <button onClick={() => handleDeleteQuestion(q.question_id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition shrink-0" title="ลบกระทู้">
                                        <Trash2 size={13} />
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-800 leading-relaxed mt-2 pl-9">{q.content}</p>
                                  {threadReplies.length > 0 && (
                                    <p className="text-[10px] text-slate-400 mt-2 pl-9">{threadReplies.length} การตอบกลับ</p>
                                  )}
                                </div>

                                {/* Replies */}
                                {threadReplies.length > 0 && (
                                  <div className="divide-y divide-slate-100">
                                    {threadReplies.map((r: Reply) => (
                                      <div key={r.reply_id} className={`px-4 py-3 flex items-start gap-3 ${r.is_instructor ? 'bg-indigo-50/40' : 'bg-white'}`}>
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black mt-0.5 ${r.is_instructor ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                          {r.is_instructor ? 'อ' : r.author_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-1">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-bold text-slate-800">{r.author_name}</span>
                                            {r.is_instructor && (
                                              <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded-full border border-indigo-200">อาจารย์</span>
                                            )}
                                            {r.created_at && (
                                              <span className="text-[10px] text-slate-400">
                                                {new Date(r.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-xs text-slate-700 leading-relaxed">{r.content}</p>
                                        </div>
                                        {role === 'admin' && (
                                          <button onClick={() => handleDeleteReply(r.reply_id)} className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition shrink-0 mt-0.5" title="ลบการตอบกลับ">
                                            <Trash2 size={12} />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Reply form (inline, toggles per question) */}
                                {replyTargetId === q.question_id ? (
                                  <form onSubmit={handlePostReply} className="border-t border-slate-200 p-4 bg-slate-50/50 space-y-3">
                                    <p className="text-[11px] font-bold text-slate-600">ตอบกระทู้นี้</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div className="space-y-1">
                                        <label className="block text-[11px] font-semibold text-slate-500">ชื่อผู้ตอบ *</label>
                                        <input
                                          type="text"
                                          required
                                          value={replyForm.author_name}
                                          onChange={e => setReplyForm(f => ({ ...f, author_name: e.target.value }))}
                                          placeholder={role === 'admin' ? 'ชื่ออาจารย์' : 'ชื่อ-นามสกุล'}
                                          className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="block text-[11px] font-semibold text-slate-500">ข้อความ *</label>
                                      <textarea
                                        required
                                        rows={3}
                                        value={replyForm.content}
                                        onChange={e => setReplyForm(f => ({ ...f, content: e.target.value }))}
                                        placeholder="พิมพ์การตอบกลับ..."
                                        className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                                      />
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                      <button type="button" onClick={() => { setReplyTargetId(null); setReplyForm({ author_name: '', content: '' }); }} className="text-xs text-slate-500 hover:text-slate-800 font-medium px-3 py-1.5 rounded-xl hover:bg-slate-100 transition">ยกเลิก</button>
                                      <button type="submit" className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#4F46E5] hover:bg-indigo-700 px-4 py-2 rounded-xl transition">
                                        <Send size={12} />
                                        <span>ส่งการตอบกลับ</span>
                                      </button>
                                    </div>
                                  </form>
                                ) : (
                                  <div className="border-t border-slate-100 px-4 py-2.5">
                                    <button
                                      onClick={() => { setReplyTargetId(q.question_id); setReplyForm({ author_name: role === 'admin' ? siteProfile.profile_name : '', content: '' }); setShowQuestionForm(false); }}
                                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
                                    >
                                      <MessageCircle size={13} />
                                      <span>ตอบกระทู้นี้</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="border border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400 space-y-2">
                          <MessageCircle size={24} className="mx-auto" />
                          <div className="text-xs">ยังไม่มีกระทู้ในรายวิชานี้ กด "ตั้งกระทู้ใหม่" เพื่อเริ่มต้น</div>
                        </div>
                      )}
                    </div>
                  )}

                  {courseDetailTab === 'assignments' && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                      {/* Header layout */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-950">แบบฝึกหัดและการส่งงาน (Assignments)</h3>
                          <p className="text-slate-500 text-[11px]">ติดตามตารางเวลาส่งงานและการประเมินของนักศึกษา</p>
                        </div>

                        {role === 'admin' && (
                          <button
                            onClick={() => setShowAssignmentModal(true)}
                            className="flex items-center gap-1 text-xs text-pink-600 bg-pink-50 border border-pink-100 hover:bg-pink-100 font-bold px-3 py-1.5 rounded-xl transition-all"
                            id="add-assignment-btn"
                          >
                            <Plus size={14} />
                            <span>สั่งงานมอบเพิ่ม</span>
                          </button>
                        )}
                      </div>

                      {activeCourseAssignments.length > 0 ? (
                        <div className="space-y-4">
                          {activeCourseAssignments.map((assign) => {
                            // Render nice badge from status: 'open' | 'closed' | 'upcoming'
                            const getStatusBadge = (status: AssignmentStatus) => {
                              switch (status) {
                                case 'open':
                                  return (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                                      <CheckCircle size={10} />
                                      <span>เปิดรับงาน (Open)</span>
                                    </span>
                                  );
                                case 'upcoming':
                                  return (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                                      <Clock size={10} />
                                      <span>เร็วๆ นี้ (Upcoming)</span>
                                    </span>
                                  );
                                case 'closed':
                                  return (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-800 bg-red-50 border border-red-100 px-2.5 py-1 rounded-lg">
                                      <AlertCircle size={10} />
                                      <span>หมดเวลาแล้ว (Closed)</span>
                                    </span>
                                  );
                                default:
                                  return null;
                              }
                            };

                            return (
                              <div
                                key={assign.assignment_id}
                                id={`item-${assign.assignment_id}`}
                                className="scroll-mt-24 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 bg-white hover:border-slate-300 transition duration-150 shadow-sm"
                              >
                                <div className="space-y-2.5">
                                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {getStatusBadge(assign.status)}
                                      {assign.week_number && (
                                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                                          สัปดาห์ที่ {assign.week_number}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                                      <Clock size={12} />
                                      <span>กำหนดส่ง: <b className="text-slate-800 font-semibold">{assign.due_date}</b></span>
                                    </div>
                                  </div>

                                  <div className="space-y-1.5">
                                    <h4 className="text-xs font-extrabold text-slate-900 tracking-tight leading-tight">
                                      {assign.title}
                                    </h4>
                                    <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                                      {assign.description}
                                    </p>
                                  </div>
                                </div>

                                {parseAttachments(assign.attachment_url).length > 0 && (
                                  <AssignmentAttachments raw={assign.attachment_url} />
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-semibold">
                                  {parseAttachments(assign.attachment_url).length === 0 ? (
                                    <span className="text-[10px] text-slate-400 italic">ไม่มีไฟล์แนบ</span>
                                  ) : <span />}

                                  {role === 'admin' && (
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() => handleEditAssignmentClick(assign)}
                                        className="flex items-center gap-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 px-2 py-1.5 rounded-lg transition"
                                        title="แก้ไขงานมอบหมายนี้"
                                      >
                                        <Edit size={13} />
                                        <span className="text-[11px]">แก้ไข</span>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteAssignment(assign.assignment_id)}
                                        className="flex items-center gap-1 text-slate-400 hover:text-red-500 hover:bg-red-50 px-2 py-1.5 rounded-lg transition"
                                        title="ลบงานมอบหมายนี้"
                                      >
                                        <Trash2 size={13} />
                                        <span className="text-[11px]">ลบงานนี้</span>
                                      </button>
                                    </div>
                                  )}
                                  {/* Student submit button */}
                                  {role === 'student' && studentProfile && (() => {
                                    const myAttempts = attemptsOf(submissions, studentProfile.id, assign.assignment_id);
                                    return myAttempts.length > 0 ? (
                                      <MySubmission
                                        attempts={myAttempts}
                                        dueDate={assign.due_date}
                                        canEdit={assign.status === 'open'}
                                        onEdit={prev => openSubmitModal(assign, prev)}
                                        onDelete={handleDeleteSubmission}
                                      />
                                    ) : assign.status === 'open' ? (
                                      <button
                                        onClick={() => openSubmitModal(assign)}
                                        className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
                                      >
                                        <Send size={11} />
                                        ส่งงาน
                                      </button>
                                    ) : null;
                                  })()}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="border border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400 max-w-full space-y-2">
                          <FileText size={24} className="mx-auto" />
                          <div className="text-xs">ยังไม่มีงานมอบหมายหรือการทดสอบใด ๆ ในคอร์สนี้</div>
                        </div>
                      )}

                      {/* AL-based assignments section */}
                      {activeCourseActivities.filter(a => a.is_assignment).length > 0 && (
                        <div className="space-y-4 pt-2">
                          <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
                            <Zap size={14} className="text-green-500" />
                            <h4 className="text-xs font-bold text-slate-700">งานมอบหมายจาก Active Learning</h4>
                            <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                              {activeCourseActivities.filter(a => a.is_assignment).length} รายการ
                            </span>
                          </div>
                          {activeCourseActivities.filter(a => a.is_assignment).map(act => {
                            const isDue = act.due_date ? new Date(act.due_date) < new Date() : false;
                            const alType = AL_TYPES.find(t => t.type_id === act.type_id);
                            const myAttempts = role === 'student' && studentProfile
                              ? attemptsOf(submissions, studentProfile.id, act.activity_id)
                              : [];
                            const actAsAssignment: Assignment = { assignment_id: act.activity_id, course_id: act.course_id, title: act.title, description: act.description, due_date: act.due_date || '', status: 'open' };
                            return (
                              <div key={act.activity_id} id={`item-${act.activity_id}`} className="scroll-mt-24 border border-green-200 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 bg-green-50/30 hover:border-green-300 transition shadow-sm">
                                <div className="space-y-2.5">
                                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-green-100 pb-2.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-lg">
                                        <Zap size={9} />
                                        Active Learning
                                      </span>
                                      {alType && (
                                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">{alType.name}</span>
                                      )}
                                      {act.week_number && (
                                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                                          สัปดาห์ที่ {act.week_number}
                                        </span>
                                      )}
                                      {isDue ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-100 px-2.5 py-1 rounded-lg">
                                          <AlertCircle size={9} />
                                          หมดเวลาแล้ว
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                                          <CheckCircle size={9} />
                                          เปิดรับงาน
                                        </span>
                                      )}
                                    </div>
                                    {act.due_date && (
                                      <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                                        <Clock size={12} />
                                        <span>กำหนดส่ง: <b className="text-slate-800 font-semibold">{act.due_date}</b></span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="space-y-1.5">
                                    <h4 className="text-xs font-extrabold text-slate-900 tracking-tight">{act.title}</h4>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">{act.description}</p>
                                  </div>
                                  {act.duration && (
                                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                      <Timer size={10} />
                                      <span>{act.duration}</span>
                                    </div>
                                  )}
                                </div>

                                <ActivityVideos raw={act.file_url} />

                                <div className="flex items-center justify-between pt-2 border-t border-green-100 text-xs font-semibold">
                                  {parseFileUrls(act.file_url).length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                      {parseFileUrls(act.file_url).map((url, fi) => (
                                        <a key={fi} href={url} target="_blank" rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg border border-green-200 transition">
                                          <Paperclip size={12} />
                                          ไฟล์ {fi + 1}
                                        </a>
                                      ))}
                                    </div>
                                  ) : splitActivityFileUrl(act.file_url).videos.length > 0 ? <span /> : (
                                    <span className="text-[10px] text-slate-400 italic">ไม่มีไฟล์แนบ</span>
                                  )}
                                  {role === 'admin' && (
                                    <button
                                      onClick={() => handleEditActivityClick(act)}
                                      className="flex items-center gap-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 px-2 py-1.5 rounded-lg transition text-[11px]"
                                    >
                                      <Edit size={13} />
                                      แก้ไข
                                    </button>
                                  )}
                                  {role === 'student' && studentProfile && (
                                    myAttempts.length > 0 ? (
                                      <MySubmission
                                        attempts={myAttempts}
                                        dueDate={act.due_date}
                                        canEdit={!isDue}
                                        onEdit={prev => openSubmitModal(actAsAssignment, prev)}
                                        onDelete={handleDeleteSubmission}
                                      />
                                    ) : !isDue ? (
                                      <button
                                        onClick={() => openSubmitModal(actAsAssignment)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
                                      >
                                        <Send size={11} />
                                        ส่งงาน
                                      </button>
                                    ) : null
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Active Learning Tab */}
                  {courseDetailTab === 'active_learning' && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
                            <Zap size={17} className="text-green-500" />
                            <span>กิจกรรม Active Learning</span>
                          </h3>
                          <p className="text-slate-500 text-[11px] mt-0.5">กิจกรรมเสริมการเรียนรู้เชิงรุกในรายวิชา</p>
                        </div>
                        {role === 'admin' && (
                          <button
                            onClick={() => { setEditingActivity(null); setActivityForm({ type_id: '', title: '', description: '', duration: '', week_number: 1, file_url: '' }); setActivityVideos([]); setActivityFiles([]); setActivityIsAssignment(false); setActivityDueDate(''); setActivityUploadError(''); setShowActivityModal(true); }}
                            className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-xl transition-all"
                          >
                            <Plus size={14} />
                            <span>เพิ่มกิจกรรม</span>
                          </button>
                        )}
                      </div>
                      {activeCourseActivities.length > 0 ? (
                        <div className="space-y-4">
                          {activeCourseActivities.map((act: ActiveLearning) => (
                            <div key={act.activity_id} id={`item-${act.activity_id}`} className="scroll-mt-24 border border-slate-200 rounded-2xl p-4 space-y-2 hover:border-green-200 transition-colors">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                                    <Zap size={13} className="text-green-600" />
                                  </div>
                                  <h4 className="text-xs font-bold text-slate-900 truncate">{act.title}</h4>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {act.week_number && (
                                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                                      สัปดาห์ที่ {act.week_number}
                                    </span>
                                  )}
                                  {act.duration && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
                                      <Timer size={10} />
                                      {act.duration}
                                    </span>
                                  )}
                                  {role === 'admin' && (
                                    <>
                                      <button onClick={() => handleEditActivityClick(act)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><Edit size={13} /></button>
                                      <button onClick={() => handleDeleteActivity(act.activity_id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={13} /></button>
                                    </>
                                  )}
                                </div>
                              </div>
                              {act.description && <p className="text-xs text-slate-600 leading-relaxed pl-9">{act.description}</p>}
                              {splitActivityFileUrl(act.file_url).videos.length > 0 && (
                                <div className="pl-9"><ActivityVideos raw={act.file_url} /></div>
                              )}
                              {parseFileUrls(act.file_url).length > 0 && (
                                <div className="pl-9 flex flex-wrap gap-1.5">
                                  {parseFileUrls(act.file_url).map((url, fi) => (
                                    <a
                                      key={fi}
                                      href={url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-green-700 hover:text-green-900 bg-green-50 border border-green-100 px-2.5 py-1 rounded-lg transition hover:bg-green-100"
                                    >
                                      <Paperclip size={11} />
                                      ไฟล์ {fi + 1}
                                      <ExternalLink size={10} />
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border border-dashed border-slate-200 rounded-3xl p-10 text-center text-slate-400 space-y-2">
                          <Zap size={24} className="mx-auto" />
                          <div className="text-xs">ยังไม่มีกิจกรรม Active Learning ในรายวิชานี้</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Teaching Plan Tab */}
                  {courseDetailTab === 'plan' && activeCourse && (
                    <TeachingPlanTab
                      course={activeCourse}
                      materials={activeCourseMaterials}
                      activities={activeCourseActivities}
                      assignments={activeCourseAssignments}
                      semesterSchedules={semesterSchedules}
                      onOpenItem={openCourseItem}
                    />
                  )}

                </div>
              </div>
            ) : (
              <p className="text-slate-500 italic">กำลังดึงข้อมูลสาระการสอนวิชา...</p>
            )}
          </div>
        )}
      </main>
      )} {/* end currentPage !== 'admin-panel' */}

      {/* 4. Footer Component */}
      <Footer
        name={siteProfile.profile_name}
        title={siteProfile.profile_title}
        department={siteProfile.profile_department}
        faculty={siteProfile.profile_faculty}
        university={siteProfile.profile_university}
        bio={siteProfile.profile_bio}
        onOpenPrivacy={() => setShowPrivacyModal(true)}
      />

      {/* ========================================================== */}
      {/* 5. MODAL INTERFACES */}

      {/* 5.1 Admin Authentication Modal Dialog  */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Header Dialog */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold">
                  <Lock size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold">เข้าสู่ระบบผู้ดูแลระบบ (Admin)</h3>
                  <p className="text-[9px] text-slate-400 font-medium">{siteProfile.profile_name} เท่านั้น</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowLoginModal(false); setLoginError(''); }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <X size={15} />
              </button>
            </div>

            {/* Form Dialog Body */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                เพื่อเข้าสู่โหมดแก้ไขข้อมูลคอร์สวิชา, ลบและแก้ไขข้อมูลเอกสาร/งานมอบหมาย ให้กรอกรหัสผู้ใช้เพื่อความปลอดภัยในระบบ
              </p>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">พิมพ์รหัสผ่านเพื่อจำลองบทบาท</label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => { setAdminPassword(e.target.value); setLoginError(''); }}
                    placeholder="กรอกรหัสผ่าน Admin"
                    autoComplete="current-password"
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl px-4 py-3 pr-11 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAdminLogin(); }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    title={showAdminPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    aria-label={showAdminPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showAdminPassword ? <EyeOff size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">💡 ใช้รหัสผ่าน Admin ล่าสุดที่ตั้งไว้</span>
              </div>

              {loginError && (
                <div className="bg-red-50 text-red-800 text-[11px] font-bold border border-red-100 p-3 rounded-lg flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowLoginModal(false); setLoginError(''); }}
                  className="text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium px-4 py-2.5 rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleAdminLogin}
                  disabled={adminLoggingIn}
                  className="text-xs text-white bg-[#4F46E5] hover:bg-indigo-700 font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-60 disabled:cursor-wait"
                >
                  {adminLoggingIn ? 'กำลังตรวจสอบ...' : 'ยืนยันตัวตน'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5.1b Student Auth Modal */}
      {showStudentAuthModal && (
        <StudentAuthModal
          initialTab={studentAuthInitialTab}
          siteProfile={siteProfile}
          onClose={() => {
            setShowStudentAuthModal(false);
            setPendingCourseId(null);
            pendingCourseIdRef.current = null;
          }}
        />
      )}

      {/* 5.1c Enrollment Code Gate Modal */}
      {showEnrollCodeModal && pendingEnrollCourseId && (() => {
        const gateCourse = courses.find(c => c.course_id === pendingEnrollCourseId);
        return (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* Header */}
              <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white px-6 pt-8 pb-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck size={28} />
                </div>
                <h2 className="text-base font-extrabold">ยืนยันรหัสลงทะเบียน</h2>
                <p className="text-xs text-white/80 mt-1 font-medium">
                  {gateCourse?.course_code} — {gateCourse?.course_name_th}
                </p>
              </div>

              {/* Body */}
              <form onSubmit={handleEnrollCodeSubmit} className="p-6 space-y-4">
                <p className="text-xs text-slate-600 text-center leading-relaxed">
                  วิชานี้ต้องใช้รหัสลงทะเบียน<br />
                  กรุณาติดต่ออาจารย์เพื่อขอรหัส
                </p>

                <div className="relative">
                  <input
                    type={showEnrollCodePassword ? 'text' : 'password'}
                    value={enrollCodeInput}
                    onChange={(e) => { setEnrollCodeInput(e.target.value); setEnrollCodeError(''); }}
                    placeholder="กรอกรหัสลงทะเบียน"
                    autoFocus
                    className="w-full text-sm text-slate-900 border-2 border-slate-200 rounded-2xl px-4 py-3 pr-10 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:outline-none font-mono tracking-widest text-center"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEnrollCodePassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showEnrollCodePassword ? <EyeOff size={15} /> : <EyeIcon size={15} />}
                  </button>
                </div>

                {enrollCodeError && (
                  <p className="text-xs text-red-600 text-center font-semibold bg-red-50 rounded-xl py-2 px-3">
                    {enrollCodeError}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setShowEnrollCodeModal(false); setEnrollCodeInput(''); setEnrollCodeError(''); setPendingEnrollCourseId(null); }}
                    className="flex-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 py-3 rounded-2xl transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={!enrollCodeInput.trim()}
                    className="flex-1 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed py-3 rounded-2xl transition"
                  >
                    ยืนยันเข้าวิชา
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* 5.1b Group picker — course has several groups without per-group codes */}
      {pendingGroupCourseId && (() => {
        const gCourse = courses.find(c => c.course_id === pendingGroupCourseId);
        if (!gCourse) return null;
        const n = groupCount(gCourse);
        return (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white px-6 pt-8 pb-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
                  <UsersIcon size={28} />
                </div>
                <h2 className="text-base font-extrabold">เลือกกลุ่มเรียนของคุณ</h2>
                <p className="text-xs text-white/80 mt-1 font-medium">{gCourse.course_code} — {gCourse.course_name_th}</p>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-600 text-center leading-relaxed">
                  วิชานี้เปิดสอน {n} กลุ่ม กรุณาเลือกกลุ่มที่คุณลงทะเบียนเรียน<br />
                  <span className="text-slate-400">(เลือกได้ครั้งเดียว หากเลือกผิดกรุณาแจ้งอาจารย์)</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: n }, (_, i) => i + 1).map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => { setPendingGroupCourseId(null); proceedToCourse(gCourse.course_id, g); }}
                      className="py-3 rounded-2xl border-2 border-violet-200 bg-violet-50 hover:bg-violet-100 hover:border-violet-400 text-violet-700 text-sm font-extrabold transition active:scale-[0.98]"
                    >
                      กลุ่ม {g}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setPendingGroupCourseId(null)}
                  className="w-full text-xs text-slate-500 hover:text-slate-800 py-2"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 5.2 Course Create/Update Modal Form */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-xl overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
            {/* Header form modal */}
            <div className="bg-[#4F46E5] text-white p-5 flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingCourse ? `แก้ไขข้อมูลคอร์ส: ${editingCourse.course_code}` : 'เพิ่มรายวิชาใหม่เข้าระบบ'}
              </h3>
              <button
                onClick={() => { setShowCourseModal(false); setCourseFormError(''); }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
              >
                <X size={15} />
              </button>
            </div>

            {/* Custom inputs */}
            <form onSubmit={handleSaveCourse} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">

              {courseFormError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  {courseFormError}
                </div>
              )}

              {/* รหัสวิชา + กลุ่มเรียน */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="course-code" className="block text-xs font-semibold text-slate-700">รหัสวิชา *</label>
                  <input
                    id="course-code"
                    type="text"
                    value={courseForm.course_code}
                    onChange={(e) => { setCourseForm({ ...courseForm, course_code: e.target.value }); setCourseFormError(''); }}
                    placeholder="เช่น 928-221"
                    className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="course-section" className="block text-xs font-semibold text-slate-700">จำนวนกลุ่มสอน</label>
                  <input
                    id="course-section"
                    type="text"
                    value={courseForm.section}
                    onChange={(e) => setCourseForm({ ...courseForm, section: e.target.value })}
                    placeholder="เช่น 1, 2, 3"
                    className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* ชั่วโมงทฤษฏี + ชั่วโมงปฏิบัติ + จำนวนสัปดาห์ */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-indigo-700">ทฤษฏี (ชม./สัปดาห์)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={courseForm.theory_hours}
                    onChange={(e) => setCourseForm({ ...courseForm, theory_hours: Number(e.target.value) })}
                    className="w-full text-xs text-slate-900 border border-indigo-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-emerald-700">ปฏิบัติ (ชม./สัปดาห์)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={courseForm.practice_hours}
                    onChange={(e) => setCourseForm({ ...courseForm, practice_hours: Number(e.target.value) })}
                    className="w-full text-xs text-slate-900 border border-emerald-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">จำนวนสัปดาห์</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={courseForm.total_weeks}
                    onChange={(e) => setCourseForm({ ...courseForm, total_weeks: Number(e.target.value) })}
                    className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              {(courseForm.theory_hours > 0 || courseForm.practice_hours > 0) && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
                  <span className="text-slate-600">รวมทั้งภาคเรียน ({courseForm.total_weeks} สัปดาห์):</span>
                  <span className="font-black text-blue-700">
                    {(courseForm.theory_hours + courseForm.practice_hours) * courseForm.total_weeks} ชม.
                    <span className="font-normal text-slate-500 ml-1">
                      (ทฤษฏี {courseForm.theory_hours * courseForm.total_weeks} + ปฏิบัติ {courseForm.practice_hours * courseForm.total_weeks})
                    </span>
                  </span>
                </div>
              )}

              {/* ภาคการศึกษา + ปีการศึกษา + หน่วยกิต */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label htmlFor="course-sem" className="block text-xs font-semibold text-slate-700">ภาคการศึกษา *</label>
                  <select
                    id="course-sem"
                    value={courseForm.semester_id}
                    onChange={(e) => setCourseForm({ ...courseForm, semester_id: Number(e.target.value) })}
                    className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl px-3 py-2.5 select-chevron focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>ภาคฤดูร้อน</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="course-year" className="block text-xs font-semibold text-slate-700">ปีการศึกษา *</label>
                  <input
                    id="course-year"
                    type="number"
                    min={2020}
                    max={2099}
                    value={courseForm.year}
                    onChange={(e) => setCourseForm({ ...courseForm, year: Number(e.target.value) })}
                    className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="course-credit" className="block text-xs font-semibold text-slate-700">หน่วยกิต *</label>
                  <input
                    id="course-credit"
                    type="text"
                    value={courseForm.credit}
                    onChange={(e) => setCourseForm({ ...courseForm, credit: e.target.value })}
                    placeholder="เช่น 3(3-0-6)"
                    className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* ชื่อวิชาไทย + อังกฤษ */}
              <div className="space-y-1">
                <label htmlFor="course-th" className="block text-xs font-semibold text-slate-700">ชื่อรายวิชา (ภาษาไทย) *</label>
                <input
                  id="course-th"
                  type="text"
                  value={courseForm.course_name_th}
                  onChange={(e) => setCourseForm({ ...courseForm, course_name_th: e.target.value })}
                  placeholder="เช่น การออกแบบอัลกอริทึมเชิงคิดวิเคราะห์"
                  className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="course-en" className="block text-xs font-semibold text-slate-700">ชื่อรายวิชา (ภาษาอังกฤษ) *</label>
                <input
                  id="course-en"
                  type="text"
                  value={courseForm.course_name_en}
                  onChange={(e) => setCourseForm({ ...courseForm, course_name_en: e.target.value })}
                  placeholder="เช่น Algorithm Design and Analysis"
                  className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="course-desc" className="block text-xs font-semibold text-slate-700">คำอธิบายรายวิชา</label>
                <textarea
                  id="course-desc"
                  rows={3}
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  placeholder="พิมพ์คำอธิบายรายวิชาโดยย่อ..."
                  className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="course-objectives" className="block text-xs font-semibold text-slate-700">
                  วัตถุประสงค์รายวิชา (CLOs) <span className="font-normal text-slate-400">— 1 บรรทัดต่อ 1 ข้อ</span>
                </label>
                <textarea
                  id="course-objectives"
                  rows={4}
                  value={courseForm.objectivesInput}
                  onChange={(e) => setCourseForm({ ...courseForm, objectivesInput: e.target.value })}
                  placeholder={"เช่น:\nเข้าใจหลักการวิเคราะห์ข้อมูลขั้นสูง\nพัฒนาแบบจำลองคาดการณ์พฤติกรรมลูกค้าได้"}
                  className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-sans"
                />
              </div>

              {/* Enrollment Code */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-700">
                    <KeyRound size={14} />
                    <span className="text-xs font-bold">รหัสลงทะเบียนเข้าวิชา</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const n = groupCount({ section: courseForm.section });
                      const codes: string[] = [];
                      for (let i = 0; i < n; i++) codes.push(generateEnrollCode(codes));
                      setCourseForm({ ...courseForm, enrollment_code: joinGroupCodes(codes) });
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-lg transition"
                  >
                    <RefreshCw size={11} />
                    สร้างรหัส {groupCount({ section: courseForm.section })} กลุ่ม
                  </button>
                </div>
                {(() => {
                  const n = groupCount({ section: courseForm.section });
                  const codes = parseGroupCodes(courseForm.enrollment_code);
                  const extra = codes.length > n ? codes.slice(n).filter(Boolean).length : 0;
                  return (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Array.from({ length: n }, (_, i) => (
                          <label key={i} className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-amber-800 whitespace-nowrap w-14">กลุ่ม {i + 1}</span>
                            <input
                              id={i === 0 ? 'course-enrollment-code' : undefined}
                              type="text"
                              value={codes[i] || ''}
                              onChange={(e) => {
                                const next = [...codes];
                                while (next.length < n) next.push('');
                                next[i] = e.target.value.replace(/,/g, '');
                                setCourseForm({ ...courseForm, enrollment_code: joinGroupCodes(next) });
                              }}
                              placeholder="ว่าง = ไม่ใช้รหัส"
                              className="w-full text-xs text-slate-900 border border-amber-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none font-mono tracking-wider"
                            />
                          </label>
                        ))}
                      </div>
                      {extra > 0 && (
                        <p className="text-[10px] text-red-600">
                          มีรหัสของกลุ่มที่เกิน {n} กลุ่มอีก {extra} รหัส (ยังใช้เข้าได้) — กด "สร้างรหัส" ใหม่เพื่อให้ตรงกับจำนวนกลุ่ม
                        </p>
                      )}
                    </>
                  );
                })()}
                <p className="text-[10px] text-amber-600 leading-relaxed">
                  แต่ละกลุ่มใช้รหัสของตัวเอง แต่ทุกกลุ่มเข้ารายวิชาเดียวกัน ระบบจะบันทึกว่านักศึกษาอยู่กลุ่มไหนจากรหัสที่กรอก
                  · หากเว้นว่างทุกช่อง ทุกคนที่ login แล้วเข้าได้ทันที · จำนวนช่องเปลี่ยนตาม "จำนวนกลุ่มสอน"
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowCourseModal(false); setCourseFormError(''); }}
                  className="text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium px-4 py-2.5 rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="text-xs text-white bg-[#4F46E5] hover:bg-indigo-700 font-bold px-5 py-2.5 rounded-xl transition"
                >
                  {editingCourse ? 'บันทึกการแก้ไข' : 'สร้างรายวิชา'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5.3 Material Create/Edit Modal Form */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="bg-[#4F46E5] text-white p-5 flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingMaterial ? `แก้ไขเอกสาร: ${editingMaterial.title.slice(0, 30)}…` : 'เพิ่มเอกสารการเรียนการสอน'}
              </h3>
              <button onClick={resetMaterialModal} className="p-1.5 rounded-lg hover:bg-white/10 text-white/85 hover:text-white transition">
                <X size={15} />
              </button>
            </div>

            {/* Mode toggle */}
            <div className="flex border-b border-slate-100">
              <button
                type="button"
                onClick={() => { setMaterialUploadMode('url'); setMaterialFiles([]); setMaterialUploadProgress([]); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition ${materialUploadMode === 'url' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <ExternalLink size={12} />
                ใส่ URL / ลิงก์
              </button>
              <button
                type="button"
                onClick={() => { setMaterialUploadMode('file'); setMaterialUploadProgress([]); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition ${materialUploadMode === 'file' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Upload size={12} />
                {editingMaterial ? 'เปลี่ยนไฟล์ใหม่' : 'อัปโหลดไฟล์ (หลายไฟล์)'}
              </button>
            </div>

            <form onSubmit={handleAddMaterial} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* Common fields */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {materialUploadMode === 'file' && !editingMaterial ? 'หัวเรื่องหลัก (ไม่บังคับ — ถ้าว่างจะใช้ชื่อไฟล์)' : 'หัวเรื่องสไลด์การสอน/หัวเรื่องย่อย *'}
                </label>
                <input
                  type="text"
                  required={materialUploadMode === 'url' || !!editingMaterial}
                  value={materialForm.title}
                  onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                  placeholder={materialUploadMode === 'file' && !editingMaterial ? 'เช่น สัปดาห์ที่ 3 (ระบบจะเพิ่มชื่อไฟล์ให้อัตโนมัติ)' : 'เช่น สไลด์ทบทวน OOP สัปดาห์ที่ 3'}
                  className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">ประเภทข้อมูล</label>
                  <select
                    value={materialForm.type}
                    onChange={(e) => setMaterialForm({ ...materialForm, type: e.target.value as MaterialType })}
                    className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl px-2 py-2.5 select-chevron"
                  >
                    <option value="slides">Slides (สไลด์)</option>
                    <option value="document">Document (เอกสาร)</option>
                    <option value="video">Video (วิดีโอ)</option>
                    <option value="link">Link (ลิงก์)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">สัปดาห์ที่</label>
                  <input
                    type="number"
                    min="1"
                    max="18"
                    value={materialForm.week_number}
                    onChange={(e) => setMaterialForm({ ...materialForm, week_number: Number(e.target.value) })}
                    className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* URL mode fields */}
              {materialUploadMode === 'url' && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">URL ไฟล์ / ลิงก์ *</label>
                  <input
                    type="url"
                    required
                    value={materialForm.file_url}
                    onChange={(e) => setMaterialForm({ ...materialForm, file_url: e.target.value })}
                    placeholder="เช่น https://drive.google.com/... หรือ https://example.com/file.pdf"
                    className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              )}

              {/* File upload mode */}
              {materialUploadMode === 'file' && (
                <div className="space-y-3">
                  {/* Show current file URL for reference when editing */}
                  {editingMaterial && materialForm.file_url && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                      <FileIcon size={12} className="text-slate-400 shrink-0" />
                      <span className="text-[11px] text-slate-500 truncate flex-1">ไฟล์ปัจจุบัน: {materialForm.file_url.split('/').pop()}</span>
                      <a href={materialForm.file_url} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-500 hover:underline shrink-0">เปิด</a>
                    </div>
                  )}

                  {/* Drop zone / file picker */}
                  <label className="block">
                    <div className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition ${materialFiles.length > 0 ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}>
                      <Upload size={22} className={`mx-auto mb-2 ${materialFiles.length > 0 ? 'text-indigo-500' : 'text-slate-300'}`} />
                      <p className="text-xs font-semibold text-slate-600">
                        {materialFiles.length > 0
                          ? editingMaterial
                            ? `เลือกแล้ว: ${materialFiles[0].name}`
                            : `เลือกแล้ว ${materialFiles.length} ไฟล์`
                          : editingMaterial
                          ? 'คลิกเพื่อเลือกไฟล์ใหม่ (แทนที่ไฟล์เดิม)'
                          : 'คลิกเพื่อเลือกไฟล์ (หลายไฟล์พร้อมกันได้)'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">PDF, PPT, PPTX, DOCX, XLSX, MP4 และอื่น ๆ</p>
                      <input
                        type="file"
                        multiple={!editingMaterial}
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setMaterialFiles(editingMaterial ? files.slice(0, 1) : files);
                          setMaterialUploadProgress([]);
                        }}
                      />
                    </div>
                  </label>

                  {/* File list with status */}
                  {materialFiles.length > 0 && (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {materialFiles.map((file, idx) => {
                        const prog = materialUploadProgress[idx];
                        return (
                          <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                            <FileIcon size={13} className="text-indigo-400 shrink-0" />
                            <span className="flex-1 text-[11px] text-slate-700 truncate">{file.name}</span>
                            <span className="text-[10px] text-slate-400 shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                            {prog?.status === 'uploading' && <Loader2 size={13} className="text-indigo-500 animate-spin shrink-0" />}
                            {prog?.status === 'done' && <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />}
                            {prog?.status === 'error' && (
                              <span title={prog.error} className="cursor-help">
                                <AlertCircleIcon size={13} className="text-red-500 shrink-0" />
                              </span>
                            )}
                            {!prog && (
                              <button type="button" onClick={() => setMaterialFiles(prev => prev.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-400 transition shrink-0">
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Error summary */}
                  {materialUploadProgress.some(p => p.status === 'error') && (
                    <div className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                      อัปโหลดไม่สำเร็จ — ตรวจสอบว่าได้สร้าง Storage Bucket "course-materials" ใน Supabase แล้ว
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">อธิบายประกอบเพิ่มเติม (ไม่บังคับ)</label>
                <textarea
                  rows={4}
                  value={materialForm.description}
                  onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                  placeholder="ย่อหน้าแนะนำสิ่งที่ต้องเรียนรู้คร่าว ๆ... (กด Enter เพื่อขึ้นบรรทัดใหม่)"
                  className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 leading-relaxed resize-y focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetMaterialModal}
                  disabled={materialUploading}
                  className="text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium px-4 py-2.5 rounded-xl transition disabled:opacity-50"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="submit"
                  disabled={materialUploading || (materialUploadMode === 'file' && materialFiles.length === 0 && !editingMaterial)}
                  className="flex items-center gap-1.5 text-xs text-white bg-[#4F46E5] hover:bg-indigo-700 font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {materialUploading && <Loader2 size={13} className="animate-spin" />}
                  {materialUploading
                    ? 'กำลังอัปโหลด...'
                    : editingMaterial
                    ? materialUploadMode === 'file' && materialFiles.length > 0
                      ? 'บันทึก + เปลี่ยนไฟล์'
                      : 'บันทึกการแก้ไข'
                    : materialUploadMode === 'file'
                    ? `อัปโหลด ${materialFiles.length > 0 ? `${materialFiles.length} ไฟล์` : 'ไฟล์'}`
                    : 'ยืนยันบันทึกเอกสาร'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5.4 Assignment Create/Edit Modal Form */}
      {showAssignmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Header layout */}
            <div className="bg-[#4F46E5] text-white p-5 flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingAssignment ? `แก้ไขงานมอบหมาย: ${editingAssignment.title.slice(0, 25)}…` : 'มอบหมายงานให้นักศึกษา (Add Assignment)'}
              </h3>
              <button
                onClick={() => { setShowAssignmentModal(false); setEditingAssignment(null); setAssignmentForm({ title: '', description: '', due_date: '2026-06-30', week_number: 1, attachment_url: '', status: 'open' }); setAssignmentLinks([]); }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
              >
                <X size={15} />
              </button>
            </div>

            {/* Form list and fields */}
            <form onSubmit={handleAddAssignment} className="p-6 space-y-4">
              <div className="space-y-1">
                <label htmlFor="assign-title" className="block text-xs font-semibold text-slate-700">ชื่องานมอบหมาย *</label>
                <input
                  id="assign-title"
                  type="text"
                  required
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  placeholder="เช่น งานส่งแลป: โครงงานตัวเก็บข้อมูลเบื้องต้น"
                  className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="assign-desc" className="block text-xs font-semibold text-slate-700">อธิบายรายละเอียดงานและความต้องการ *</label>
                <textarea
                  id="assign-desc"
                  required
                  rows={3}
                  value={assignmentForm.description}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                  placeholder="ระบุข้อกำหนด วิธีส่ง เกณฑ์ และวิธีการเก็บข้อมูล..."
                  className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label htmlFor="assign-week" className="block text-xs font-semibold text-slate-700">สัปดาห์ที่</label>
                  <select
                    id="assign-week"
                    value={assignmentForm.week_number}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, week_number: Number(e.target.value) })}
                    className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl px-2 py-2.5 select-chevron"
                  >
                    {Array.from({ length: 16 }, (_, i) => i + 1).map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="assign-due" className="block text-xs font-semibold text-slate-700">กำหนดส่ง *</label>
                  <input
                    id="assign-due"
                    type="date"
                    required
                    value={assignmentForm.due_date}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })}
                    className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="assign-status" className="block text-xs font-semibold text-slate-700">สถานะ *</label>
                  <select
                    id="assign-status"
                    value={assignmentForm.status}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, status: e.target.value as AssignmentStatus })}
                    className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl px-2 py-2.5 select-chevron"
                  >
                    <option value="open">เปิดรับส่ง</option>
                    <option value="upcoming">เร็วๆ นี้</option>
                    <option value="closed">ปิดรับงาน</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">ไฟล์ / วีดีโอประกอบ (ลิงก์ URL, ไม่บังคับ)</label>
                {assignmentLinks.length === 0 && (
                  <p className="text-[11px] text-slate-400">ยังไม่มีลิงก์แนบ — เพิ่มลิงก์ไฟล์ (Google Drive, PDF) หรือวีดีโอ (YouTube, Vimeo, Google Drive) ได้หลายรายการ</p>
                )}
                {assignmentLinks.map((link, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-2.5 space-y-2 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <select
                        value={link.kind}
                        onChange={(e) => setAssignmentLinks(ls => ls.map((l, j) => j === i ? { ...l, kind: e.target.value as AttachmentLink['kind'] } : l))}
                        className={`text-[11px] font-bold border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${link.kind === 'video' ? 'text-rose-700 bg-rose-50 border-rose-200' : 'text-pink-700 bg-pink-50 border-pink-200'}`}
                        aria-label="ประเภทลิงก์"
                      >
                        <option value="file">ไฟล์</option>
                        <option value="video">วีดีโอ</option>
                      </select>
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => {
                          const url = e.target.value;
                          setAssignmentLinks(ls => ls.map((l, j) => j === i ? { ...l, url, kind: !l.url && looksLikeVideo(url) ? 'video' : l.kind } : l));
                        }}
                        placeholder={link.kind === 'video' ? 'เช่น https://www.youtube.com/watch?v=...' : 'เช่น https://drive.google.com/file/d/.../view'}
                        className="flex-1 min-w-0 text-xs text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        aria-label="ลิงก์ URL"
                      />
                      <button
                        type="button"
                        onClick={() => setAssignmentLinks(ls => ls.filter((_, j) => j !== i))}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition shrink-0"
                        title="ลบลิงก์นี้"
                        aria-label="ลบลิงก์นี้"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={link.label || ''}
                      onChange={(e) => setAssignmentLinks(ls => ls.map((l, j) => j === i ? { ...l, label: e.target.value } : l))}
                      placeholder={link.kind === 'video' ? 'ชื่อที่แสดง (ไม่บังคับ) เช่น วีดีโออธิบายโจทย์' : 'ชื่อที่แสดง (ไม่บังคับ) เช่น ใบงาน PDF'}
                      className="w-full text-[11px] text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      aria-label="ชื่อที่แสดง"
                    />
                  </div>
                ))}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignmentLinks(ls => [...ls, { kind: 'file', url: '' }])}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-pink-700 bg-pink-50 hover:bg-pink-100 border border-pink-100 px-2.5 py-1.5 rounded-lg transition"
                  >
                    <Plus size={12} /> เพิ่มลิงก์ไฟล์
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignmentLinks(ls => [...ls, { kind: 'video', url: '' }])}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-100 px-2.5 py-1.5 rounded-lg transition"
                  >
                    <Plus size={12} /> เพิ่มลิงก์วีดีโอ
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowAssignmentModal(false); setEditingAssignment(null); setAssignmentForm({ title: '', description: '', due_date: '2026-06-30', week_number: 1, attachment_url: '', status: 'open' }); setAssignmentLinks([]); }}
                  className="text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium px-4 py-2.5 rounded-xl transition"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="submit"
                  className="text-xs text-white bg-[#4F46E5] hover:bg-indigo-700 font-bold px-5 py-2.5 rounded-xl transition"
                >
                  {editingAssignment ? 'บันทึกการแก้ไข' : 'ยืนยันมอบหมายงาน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Learning Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-green-600 text-white p-5 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Zap size={15} />
                {editingActivity ? 'แก้ไขกิจกรรม Active Learning' : 'เพิ่มกิจกรรม Active Learning'}
              </h3>
              <button onClick={resetActivityModal} className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition">
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleSaveActivity} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Type selector */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">ประเภท Active Learning *</label>
                <select
                  value={activityForm.type_id}
                  onChange={e => setActivityForm(f => ({ ...f, type_id: e.target.value }))}
                  className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-green-500 focus:outline-none select-chevron"
                >
                  <option value="">— เลือกประเภทกิจกรรม —</option>
                  {AL_TYPES.map(t => (
                    <option key={t.type_id} value={t.type_id}>{t.name}</option>
                  ))}
                </select>
                {activityForm.type_id && (() => {
                  const t = AL_TYPES.find(x => x.type_id === activityForm.type_id);
                  return t ? (
                    <div className="bg-green-50 border border-green-100 rounded-xl p-3 space-y-1 mt-1">
                      <p className="text-[11px] font-semibold text-green-800">{t.description}</p>
                      <p className="text-[10px] text-slate-600 italic">ตัวอย่าง: {t.example}</p>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">ชื่อกิจกรรม (ปล่อยว่างเพื่อใช้ชื่อประเภท)</label>
                <input
                  type="text"
                  value={activityForm.title}
                  onChange={e => setActivityForm(f => ({ ...f, title: e.target.value }))}
                  placeholder={activityForm.type_id ? AL_TYPES.find(t => t.type_id === activityForm.type_id)?.name : 'ระบุชื่อกิจกรรมที่กำหนดเอง'}
                  className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">รายละเอียด / วิธีดำเนินกิจกรรม</label>
                <textarea
                  rows={3}
                  value={activityForm.description}
                  onChange={e => setActivityForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="อธิบายวิธีดำเนินกิจกรรม ขั้นตอน และเป้าหมายการเรียนรู้..."
                  className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Duration */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Timer size={12} className="text-slate-400" />
                  จำนวนเวลาทำกิจกรรม
                </label>
                <input
                  type="text"
                  value={activityForm.duration}
                  onChange={e => setActivityForm(f => ({ ...f, duration: e.target.value }))}
                  placeholder="เช่น 30 นาที, 1 ชั่วโมง"
                  className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-green-500 focus:outline-none"
                />
              </div>

              {/* Week number */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">สัปดาห์ที่มอบหมาย</label>
                <select
                  value={activityForm.week_number}
                  onChange={e => setActivityForm(f => ({ ...f, week_number: Number(e.target.value) }))}
                  className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-green-500 focus:outline-none select-chevron"
                >
                  {Array.from({ length: 16 }, (_, i) => i + 1).map(w => (
                    <option key={w} value={w}>สัปดาห์ที่ {w}</option>
                  ))}
                </select>
              </div>

              {/* Is Assignment checkbox */}
              <div className="pt-1">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={activityIsAssignment}
                      onChange={e => setActivityIsAssignment(e.target.checked)}
                    />
                    <div className="w-10 h-5 bg-slate-200 peer-checked:bg-green-500 rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-green-400 peer-focus:ring-offset-1" />
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-700 group-has-[input:checked]:text-green-700">เป็นงานมอบหมายด้วย</div>
                    <div className="text-[10px] text-slate-400">กิจกรรมนี้จะแสดงในแท็บ "งานมอบหมาย" ด้วย</div>
                  </div>
                </label>

                {activityIsAssignment && (
                  <div className="mt-3 space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">กำหนดส่ง (ไม่บังคับ)</label>
                    <input
                      type="date"
                      value={activityDueDate}
                      onChange={e => setActivityDueDate(e.target.value)}
                      className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-green-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Video links */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Video size={12} className="text-rose-400" />
                  ลิงก์วีดีโอประกอบกิจกรรม (ไม่บังคับ)
                </label>
                {activityVideos.map((link, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-2.5 space-y-2 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={link.url}
                        onChange={e => setActivityVideos(vs => vs.map((v, j) => j === i ? { ...v, url: e.target.value } : v))}
                        placeholder="เช่น https://www.youtube.com/watch?v=... หรือลิงก์ Google Drive"
                        className="flex-1 min-w-0 text-xs text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                        aria-label="ลิงก์วีดีโอ"
                      />
                      <button
                        type="button"
                        onClick={() => setActivityVideos(vs => vs.filter((_, j) => j !== i))}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition shrink-0"
                        title="ลบลิงก์นี้"
                        aria-label="ลบลิงก์วีดีโอนี้"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={link.label || ''}
                      onChange={e => setActivityVideos(vs => vs.map((v, j) => j === i ? { ...v, label: e.target.value } : v))}
                      placeholder="ชื่อที่แสดง (ไม่บังคับ) เช่น วีดีโอ How Websites Work"
                      className="w-full text-[11px] text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                      aria-label="ชื่อวีดีโอที่แสดง"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setActivityVideos(vs => [...vs, { kind: 'video', url: '' }])}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-100 px-2.5 py-1.5 rounded-lg transition"
                >
                  <Plus size={12} /> เพิ่มลิงก์วีดีโอ
                </button>
              </div>

              {/* File attachment */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Paperclip size={12} className="text-slate-400" />
                  ไฟล์แนบ / เอกสารประกอบกิจกรรม (ไม่บังคับ)
                </label>

                {/* Show existing file when editing */}
                {/* Existing files when editing */}
                {editingActivity && parseFileUrls(activityForm.file_url).length > 0 && activityFiles.length === 0 && (
                  <div className="space-y-1">
                    {parseFileUrls(activityForm.file_url).map((url, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                        <FileIcon size={12} className="text-green-500 shrink-0" />
                        <span className="flex-1 text-[11px] text-slate-600 truncate">ไฟล์ {i + 1}: {url.split('/').pop()}</span>
                        <a href={url} target="_blank" rel="noreferrer" className="text-[10px] text-green-600 hover:underline shrink-0">เปิด</a>
                      </div>
                    ))}
                    <button type="button" onClick={() => setActivityForm(f => ({ ...f, file_url: '' }))} className="text-[10px] text-red-400 hover:text-red-600 transition">
                      ลบไฟล์เดิมทั้งหมด
                    </button>
                  </div>
                )}

                {/* File picker — multiple */}
                <label className="block">
                  <div className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition ${activityFiles.length > 0 ? 'border-green-300 bg-green-50' : 'border-slate-200 hover:border-green-300 hover:bg-slate-50'}`}>
                    <Upload size={18} className={`mx-auto mb-1.5 ${activityFiles.length > 0 ? 'text-green-500' : 'text-slate-300'}`} />
                    <p className="text-xs font-semibold text-slate-600">
                      {activityFiles.length > 0 ? `เลือกแล้ว ${activityFiles.length} ไฟล์` : 'คลิกเพื่อแนบไฟล์ (เลือกหลายไฟล์ได้)'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">PDF, PPT, DOCX, รูปภาพ และอื่น ๆ</p>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={e => {
                        setActivityFiles(Array.from(e.target.files || []));
                        setActivityUploadError('');
                      }}
                    />
                  </div>
                </label>

                {activityFiles.length > 0 && (
                  <div className="space-y-1">
                    {activityFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 px-2 py-1 bg-green-50 border border-green-100 rounded-lg text-[11px] text-slate-600">
                        <FileIcon size={10} className="text-green-500 shrink-0" />
                        <span className="truncate flex-1">{f.name}</span>
                        <span className="text-slate-400 shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                        <button type="button" onClick={() => setActivityFiles(prev => prev.filter((_, j) => j !== i))} className="text-slate-300 hover:text-red-400 transition shrink-0"><X size={10} /></button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setActivityFiles([])} className="text-[10px] text-red-400 hover:text-red-600 transition">ยกเลิกทั้งหมด</button>
                  </div>
                )}

                {activityUploadError && (
                  <div className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    อัปโหลดไม่สำเร็จ: {activityUploadError} — ตรวจสอบว่าสร้าง Bucket "course-materials" ใน Supabase แล้ว
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={resetActivityModal} disabled={activityUploading} className="text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium px-4 py-2.5 rounded-xl transition disabled:opacity-50">ยกเลิก</button>
                <button type="submit" disabled={activityUploading} className="flex items-center gap-1.5 text-xs text-white bg-green-600 hover:bg-green-700 font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-50">
                  {activityUploading && <Loader2 size={13} className="animate-spin" />}
                  {activityUploading ? 'กำลังอัปโหลด...' : editingActivity ? 'บันทึกการแก้ไข' : 'เพิ่มกิจกรรม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Submit Assignment Modal */}
      {showSubmitModal && submittingAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="bg-emerald-600 text-white p-5 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold opacity-75 uppercase tracking-widest mb-0.5">
                  {resubmitOf ? `แก้ไขงาน · จะบันทึกเป็นการส่งครั้งที่ ${(studentProfile ? attemptsOf(submissions, studentProfile.id, submittingAssignment.assignment_id).length : 0) + 1}` : 'ส่งงาน'}
                </p>
                <h3 className="text-sm font-bold truncate">{submittingAssignment.title}</h3>
              </div>
              <button onClick={resetSubmitModal} disabled={submitUploading} className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition shrink-0">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Problem statement */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">โจทย์ / รายละเอียดงาน</p>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{submittingAssignment.description}</p>
                <AssignmentAttachments raw={submittingAssignment.attachment_url} variant="full" />
                <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400">
                  <Clock size={10} />
                  กำหนดส่ง: <span className="font-semibold text-slate-600">{submittingAssignment.due_date}</span>
                </div>
              </div>

              {/* Answer textarea */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">ตอบคำถาม / อธิบายคำตอบ</label>
                <textarea
                  rows={5}
                  value={submitForm.answer_text}
                  onChange={e => setSubmitForm(f => ({ ...f, answer_text: e.target.value }))}
                  placeholder="พิมพ์คำตอบหรืออธิบายงานที่ทำที่นี่..."
                  className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed resize-none"
                />
              </div>

              {resubmitOf && (
                <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 leading-relaxed">
                  แก้ไขจากงานที่ส่งล่าสุด เมื่อยืนยัน ระบบจะบันทึกเป็นการส่งครั้งใหม่ และเก็บงานครั้งก่อนไว้ในประวัติการส่ง
                </p>
              )}

              {/* File upload */}
              <div className="space-y-2">
                {submitKeptFiles.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500">ไฟล์จากการส่งครั้งก่อน (กด × เพื่อเอาออก)</p>
                    {submitKeptFiles.map((url, i) => (
                      <div key={url} className="flex items-center gap-2 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
                        <FileIcon size={10} className="text-slate-400 shrink-0" />
                        <a href={url} target="_blank" rel="noopener noreferrer" className="truncate flex-1 text-indigo-600 hover:underline">
                          {decodeURIComponent(url.split('/').pop() || `ไฟล์ ${i + 1}`).replace(/^[^_]+_\d+_/, '')}
                        </a>
                        <button type="button" aria-label="เอาไฟล์ออก" onClick={() => setSubmitKeptFiles(prev => prev.filter(u => u !== url))} className="text-slate-300 hover:text-red-400 transition shrink-0"><X size={10} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Paperclip size={12} className="text-slate-400" />
                  แนบไฟล์งาน (ไม่บังคับ)
                </label>
                <label className="block">
                  <div className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition ${submitFiles.length > 0 ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'}`}>
                    <Upload size={18} className={`mx-auto mb-1.5 ${submitFiles.length > 0 ? 'text-emerald-500' : 'text-slate-300'}`} />
                    <p className="text-xs font-semibold text-slate-600">
                      {submitFiles.length > 0 ? `เลือกแล้ว ${submitFiles.length} ไฟล์` : 'คลิกเพื่อเลือกไฟล์งาน (เลือกหลายไฟล์ได้)'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">PDF, DOCX, รูปภาพ, ZIP และอื่น ๆ</p>
                    <input type="file" multiple className="hidden" onChange={e => { setSubmitFiles(Array.from(e.target.files || [])); setSubmitUploadError(''); }} />
                  </div>
                </label>
                {submitFiles.length > 0 && (
                  <div className="space-y-1">
                    {submitFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 px-2 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-[11px] text-slate-600">
                        <FileIcon size={10} className="text-emerald-500 shrink-0" />
                        <span className="truncate flex-1">{f.name}</span>
                        <span className="text-slate-400 shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                        <button type="button" onClick={() => setSubmitFiles(prev => prev.filter((_, j) => j !== i))} className="text-slate-300 hover:text-red-400 transition shrink-0"><X size={10} /></button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setSubmitFiles([])} className="text-[10px] text-red-400 hover:text-red-600 transition">ยกเลิกทั้งหมด</button>
                  </div>
                )}
                {submitUploadError && (
                  <p className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    อัปโหลดไม่สำเร็จ: {submitUploadError}
                  </p>
                )}
              </div>

              {/* Link */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <ExternalLink size={12} className="text-slate-400" />
                  ลิงก์งาน (ไม่บังคับ — เช่น GitHub, Google Drive, Figma)
                </label>
                <input
                  type="url"
                  value={submitForm.link_url}
                  onChange={e => setSubmitForm(f => ({ ...f, link_url: e.target.value }))}
                  placeholder="https://github.com/..."
                  className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={resetSubmitModal} disabled={submitUploading} className="text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium px-4 py-2.5 rounded-xl transition disabled:opacity-50">
                  ยกเลิก
                </button>
                <button type="submit" disabled={submitUploading} className="flex items-center gap-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 font-bold px-5 py-2.5 rounded-xl transition disabled:opacity-50">
                  {submitUploading && <Loader2 size={13} className="animate-spin" />}
                  {submitUploading ? 'กำลังอัปโหลด...' : resubmitOf ? 'ยืนยันส่งงานใหม่' : 'ยืนยันส่งงาน'}
                  {!submitUploading && <Send size={13} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student login progress / failure after returning from Google */}
      {authStatus !== 'idle' && role !== 'admin' && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-slate-200 shadow-xl p-6 text-center space-y-3">
            {authStatus === 'pending' ? (
              <>
                <Loader2 size={28} className="mx-auto text-indigo-500 animate-spin" />
                <p className="text-sm font-bold text-slate-800">กำลังเข้าสู่ระบบ...</p>
                <p className="text-[11px] text-slate-500">หากมีผู้เข้าใช้งานพร้อมกันจำนวนมาก อาจใช้เวลาสักครู่ กรุณาอย่าปิดหน้านี้</p>
              </>
            ) : (
              <>
                <AlertCircle size={28} className="mx-auto text-red-500" />
                <p className="text-sm font-bold text-slate-800">เข้าสู่ระบบไม่สำเร็จ</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {authError === 'timeout'
                    ? 'ระบบตอบสนองช้า อาจมีผู้เข้าใช้งานพร้อมกันจำนวนมาก กรุณารอประมาณ 1 นาทีแล้วลองใหม่'
                    : /rate limit|too many/i.test(authError)
                      ? 'มีการเข้าสู่ระบบจากเครือข่ายเดียวกันพร้อมกันจำนวนมาก กรุณารอสักครู่แล้วลองใหม่'
                      : `กรุณาลองใหม่อีกครั้ง${authError ? ` (${authError})` : ''}`}
                </p>
                <div className="flex justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { window.history.replaceState(null, '', window.location.pathname); setAuthStatus('idle'); setAuthError(''); }}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    ปิด
                  </button>
                  <button
                    type="button"
                    onClick={() => { window.history.replaceState(null, '', window.location.pathname); window.location.reload(); }}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition"
                  >
                    ลองใหม่
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Teaching Reflection Modal */}
      {showReflectionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-purple-700 text-white p-5 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <NotebookPen size={15} />
                {editingReflection ? `แก้ไขบันทึกสัปดาห์ที่ ${editingReflection.week_number}` : 'บันทึกหลังการสอน'}
              </h3>
              <button onClick={() => { setShowReflectionModal(false); setEditingReflection(null); }} className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition">
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleSaveReflection} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">สัปดาห์ที่ *</label>
                <input
                  type="number" required min={1} max={18}
                  value={reflectionForm.week_number}
                  onChange={e => setReflectionForm(f => ({ ...f, week_number: Number(e.target.value) }))}
                  className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">บันทึกหลังสอน *</label>
                <textarea
                  required rows={5}
                  value={reflectionForm.content}
                  onChange={e => setReflectionForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="บันทึกสิ่งที่เกิดขึ้นในชั้นเรียน ปัญหาที่พบ สิ่งที่ควรปรับปรุง และข้อสังเกตสำหรับการสอนครั้งถัดไป..."
                  className="w-full text-xs text-slate-900 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Image upload */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon size={13} className="text-purple-500" />
                  รูปภาพประกอบ (ไม่บังคับ)
                </label>
                {reflectionForm.image_url ? (
                  <div className="relative">
                    <img
                      src={reflectionForm.image_url}
                      alt="preview"
                      className="w-full max-h-48 object-cover rounded-xl border border-purple-100"
                    />
                    <button
                      type="button"
                      onClick={() => setReflectionForm(f => ({ ...f, image_url: '' }))}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center transition shadow"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-purple-200 hover:border-purple-400 rounded-xl py-6 cursor-pointer transition-colors bg-purple-50/30 hover:bg-purple-50">
                    {reflectionImageUploading
                      ? <Loader2 size={18} className="text-purple-400 animate-spin" />
                      : <ImageIcon size={18} className="text-purple-300" />}
                    <span className="text-xs text-slate-500">{reflectionImageUploading ? 'กำลังอัปโหลดรูป...' : 'คลิกเพื่อเลือกรูปภาพ'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) { alert('ไฟล์รูปต้องไม่เกิน 5 MB'); return; }
                        e.target.value = '';
                        // Store the image in Storage and keep only its URL in the row —
                        // base64 images in the table made every page load several MB.
                        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                        const path = `reflections/${selectedCourseId || 'general'}/${Date.now()}_${safeName}`;
                        setReflectionImageUploading(true);
                        supabase.storage.from('course-materials').upload(path, file, { upsert: false })
                          .then(({ error }) => {
                            if (error) { alert(`อัปโหลดรูปไม่สำเร็จ: ${error.message}`); return; }
                            const { data } = supabase.storage.from('course-materials').getPublicUrl(path);
                            setReflectionForm(f => ({ ...f, image_url: data.publicUrl }));
                          })
                          .finally(() => setReflectionImageUploading(false));
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => { setShowReflectionModal(false); setEditingReflection(null); setReflectionForm({ week_number: 1, content: '', image_url: '' }); }} className="text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium px-4 py-2.5 rounded-xl transition">ยกเลิก</button>
                <button type="submit" className="text-xs text-white bg-purple-700 hover:bg-purple-800 font-bold px-5 py-2.5 rounded-xl transition">
                  {editingReflection ? 'บันทึกการแก้ไข' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
