import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, ImageRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType, PageBreak,
  convertInchesToTwip, Header, Footer, PageNumber,
} from 'docx';
import { saveAs } from 'file-saver';
import {
  Course, Material, Assignment, Question, Reply,
  ActiveLearning, TeachingReflection, AL_TYPES,
} from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

function isImageUrl(url: string): boolean {
  const clean = url.toLowerCase().split('?')[0];
  return IMAGE_EXTS.some(ext => clean.endsWith(ext));
}

async function fetchImage(url: string): Promise<{ data: ArrayBuffer; ext: string } | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const ext = ct.includes('png') ? 'png' : ct.includes('gif') ? 'gif' : 'jpg';
    const data = await res.arrayBuffer();
    return { data, ext: ext as 'jpg' | 'png' | 'gif' };
  } catch {
    return null;
  }
}

function parseFileUrls(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p.filter(Boolean) : [raw];
  } catch {
    return [raw];
  }
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const FONT = 'TH Sarabun New';
const FONT_EN = 'Cambria';

// Word treats Thai as "complex script" — must set both `name` and `cs`
// otherwise Word falls back to its default complex-script font (Cordia/Tahoma).
const FC  = { name: FONT, cs: FONT } as const;        // Thai font config
const FCE = { name: FONT_EN, cs: FONT } as const;     // English heading, Thai body

const h1 = (text: string): Paragraph =>
  new Paragraph({
    children: [new TextRun({ text, font: FC, size: 36, bold: true, color: '1E3A5F' })],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1E3A5F', space: 4 } },
  });

const h2 = (text: string): Paragraph =>
  new Paragraph({
    children: [new TextRun({ text, font: FC, size: 28, bold: true, color: '1D4ED8' })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
  });

const h3 = (text: string): Paragraph =>
  new Paragraph({
    children: [new TextRun({ text, font: FC, size: 24, bold: true, color: '374151' })],
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 160, after: 60 },
  });

const body = (text: string, indent = 0): Paragraph =>
  new Paragraph({
    children: [new TextRun({ text, font: FC, size: 22 })],
    spacing: { before: 40, after: 40 },
    indent: indent ? { left: convertInchesToTwip(indent) } : undefined,
  });

const label = (key: string, value: string): Paragraph =>
  new Paragraph({
    children: [
      new TextRun({ text: `${key}: `, font: FC, size: 22, bold: true }),
      new TextRun({ text: value || '—', font: FC, size: 22 }),
    ],
    spacing: { before: 60, after: 60 },
  });

const bullet = (text: string): Paragraph =>
  new Paragraph({
    children: [new TextRun({ text, font: FC, size: 22 })],
    bullet: { level: 0 },
    spacing: { before: 40, after: 40 },
    indent: { left: convertInchesToTwip(0.4), hanging: convertInchesToTwip(0.2) },
  });

const divider = (): Paragraph =>
  new Paragraph({
    children: [new TextRun({ text: '' })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0', space: 4 } },
    spacing: { before: 160, after: 160 },
  });

const caption = (text: string): Paragraph =>
  new Paragraph({
    children: [new TextRun({ text, font: FC, size: 18, color: '6B7280', italics: true })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 40, after: 120 },
  });

// ─── Table builder ────────────────────────────────────────────────────────────

function makeTable(headers: string[], rows: string[][]): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(h =>
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: h, font: FC, size: 20, bold: true, color: 'FFFFFF' })],
          alignment: AlignmentType.CENTER,
        })],
        shading: { type: ShadingType.SOLID, color: '1D4ED8', fill: '1D4ED8' },
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
      })
    ),
  });

  const dataRows = rows.map((row, ri) =>
    new TableRow({
      children: row.map(cell =>
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: cell || '—', font: FC, size: 20 })],
          })],
          shading: ri % 2 === 0
            ? { type: ShadingType.SOLID, color: 'F8FAFC', fill: 'F8FAFC' }
            : { type: ShadingType.SOLID, color: 'EFF6FF', fill: 'EFF6FF' },
          margins: { top: 80, bottom: 80, left: 100, right: 100 },
        })
      ),
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      insideH: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
      insideV: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
    },
  });
}

// ─── Image paragraph ──────────────────────────────────────────────────────────

async function makeImageParagraph(url: string, alt: string): Promise<Paragraph[]> {
  const img = await fetchImage(url);
  if (!img) return [body(`[ไม่สามารถโหลดรูปได้: ${alt}]`)];
  return [
    new Paragraph({
      children: [new ImageRun({
        data: img.data,
        transformation: { width: 480, height: 320 },
        type: img.ext as 'jpg' | 'png' | 'gif',
      })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 40 },
    }),
    caption(alt),
  ];
}

// ─── Section builders ─────────────────────────────────────────────────────────

function buildCoverSection(course: Course): Paragraph[] {
  const semLabel = `ภาคเรียนที่ ${course.semester_id} ปีการศึกษา ${course.year}`;
  return [
    new Paragraph({
      children: [new TextRun({ text: 'รายงานสรุปรายวิชา', font: FC, size: 48, bold: true, color: '1E3A5F' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 480, after: 120 },
    }),
    new Paragraph({
      children: [new TextRun({ text: course.course_name_th, font: FC, size: 36, bold: true, color: '1D4ED8' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: course.course_name_en, font: FCE, size: 24, italics: true, color: '4B5563' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `${course.course_code}  |  ${semLabel}`, font: FC, size: 22, color: '6B7280' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 40 },
    }),
    ...(course.section ? [new Paragraph({
      children: [new TextRun({ text: `Section ${course.section}  |  ${course.credit || ''}`, font: FC, size: 22, color: '6B7280' })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 20, after: 40 },
    })] : []),
    new Paragraph({
      children: [new PageBreak()],
    }),
  ];
}

function buildInfoSection(course: Course): Paragraph[] {
  return [
    h1('1. ข้อมูลรายวิชา'),
    label('รหัสวิชา', course.course_code),
    label('ชื่อวิชา (ไทย)', course.course_name_th),
    label('ชื่อวิชา (อังกฤษ)', course.course_name_en),
    label('ภาคการศึกษา', `${course.semester_id}/${course.year}`),
    label('หน่วยกิต', course.credit || '—'),
    label('Section', course.section || '—'),
    label('จำนวนสัปดาห์', `${course.total_weeks || 15} สัปดาห์`),
    ...(course.theory_hours || course.practice_hours ? [
      label('ชั่วโมงสอน', `ทฤษฎี ${course.theory_hours || 0} ชม./สัปดาห์  |  ปฏิบัติ ${course.practice_hours || 0} ชม./สัปดาห์`),
    ] : []),
    divider(),
    h2('วัตถุประสงค์รายวิชา (CLOs)'),
    ...(course.objectives?.length
      ? course.objectives.map((obj, i) => bullet(`${i + 1}. ${obj}`))
      : [body('—')]
    ),
    ...(course.description ? [
      h2('คำอธิบายรายวิชา'),
      body(course.description),
    ] : []),
  ];
}

function buildMaterialsSection(materials: Material[]): Paragraph[] {
  const paras: Paragraph[] = [h1('2. เอกสารและสื่อการสอน (จัดตามสัปดาห์)')];
  if (!materials.length) { paras.push(body('ไม่มีเอกสาร')); return paras; }

  const byWeek = materials.reduce<Record<number, Material[]>>((acc, m) => {
    const w = m.week_number ?? 0;
    (acc[w] = acc[w] || []).push(m);
    return acc;
  }, {});

  const weeks = Object.keys(byWeek)
    .map(Number)
    .sort((a, b) => a - b);

  for (const week of weeks) {
    paras.push(h2(week === 0 ? 'ทั่วไป (ไม่ระบุสัปดาห์)' : `สัปดาห์ที่ ${week}`));
    const TYPE_LABEL: Record<string, string> = {
      slides: 'สไลด์', video: 'วิดีโอ', document: 'เอกสาร', link: 'ลิงก์',
    };
    for (const mat of byWeek[week]) {
      paras.push(h3(`${mat.title}`));
      paras.push(label('ประเภท', TYPE_LABEL[mat.type] || mat.type));
      if (mat.description) paras.push(label('คำอธิบาย', mat.description));
      paras.push(label('ไฟล์/ลิงก์', mat.file_url));
    }
    paras.push(new Paragraph({ spacing: { before: 80, after: 80 }, children: [] }));
  }
  return paras;
}

function buildActiveLearningSection(activities: ActiveLearning[]): Paragraph[] {
  const paras: Paragraph[] = [h1('3. กิจกรรม Active Learning')];
  if (!activities.length) { paras.push(body('ไม่มีกิจกรรม')); return paras; }

  const rows = activities.map((a, i) => {
    const typeName = AL_TYPES.find(t => t.type_id === a.type_id)?.name || a.type_id || '—';
    return [
      String(i + 1),
      typeName,
      a.title,
      a.description || '—',
      a.duration || '—',
      a.is_assignment ? `มอบหมาย (${a.due_date || '—'})` : 'กิจกรรมในชั้นเรียน',
    ];
  });
  paras.push(makeTable(
    ['#', 'ประเภท', 'ชื่อกิจกรรม', 'คำอธิบาย', 'ระยะเวลา', 'ประเภทงาน'],
    rows
  ));
  return paras;
}

function buildAssignmentsSection(assignments: Assignment[]): Paragraph[] {
  const paras: Paragraph[] = [h1('4. งานมอบหมาย')];
  if (!assignments.length) { paras.push(body('ไม่มีงานมอบหมาย')); return paras; }

  const STATUS_LABEL: Record<string, string> = { open: 'เปิดรับ', closed: 'ปิดรับ', upcoming: 'กำลังจะมา' };
  const rows = assignments.map((a, i) => [
    String(i + 1),
    a.title,
    a.due_date,
    STATUS_LABEL[a.status] || a.status,
    a.description || '—',
  ]);
  paras.push(makeTable(['#', 'ชื่องาน', 'กำหนดส่ง', 'สถานะ', 'คำอธิบาย'], rows));
  return paras;
}

function buildQASection(questions: Question[], replies: Reply[]): Paragraph[] {
  const paras: Paragraph[] = [h1('5. ถาม-ตอบ (Q&A)')];
  if (!questions.length) { paras.push(body('ไม่มีคำถาม')); return paras; }

  questions.forEach((q, i) => {
    paras.push(h2(`คำถามที่ ${i + 1}`));
    paras.push(new Paragraph({
      children: [
        new TextRun({ text: `${q.author_name}:  `, font: FC, size: 22, bold: true }),
        new TextRun({ text: q.content, font: FC, size: 22 }),
      ],
      spacing: { before: 60, after: 60 },
      shading: { type: ShadingType.SOLID, fill: 'EFF6FF', color: 'EFF6FF' },
    }));
    const qReplies = replies.filter(r => r.question_id === q.question_id);
    if (qReplies.length) {
      qReplies.forEach(r => {
        paras.push(new Paragraph({
          children: [
            new TextRun({ text: `  ↳ ${r.author_name}${r.is_instructor ? ' (อาจารย์)' : ''}:  `, font: FC, size: 22, bold: r.is_instructor, color: r.is_instructor ? '1D4ED8' : '374151' }),
            new TextRun({ text: r.content, font: FC, size: 22 }),
          ],
          spacing: { before: 40, after: 40 },
          indent: { left: convertInchesToTwip(0.4) },
        }));
      });
    } else {
      paras.push(body('(ยังไม่มีการตอบกลับ)', 0.4));
    }
    paras.push(new Paragraph({ spacing: { before: 80, after: 80 }, children: [] }));
  });
  return paras;
}

async function buildReflectionsSection(reflections: TeachingReflection[], includeImages: boolean): Promise<Paragraph[]> {
  const paras: Paragraph[] = [h1('6. บันทึกหลังการสอน (Teaching Reflection)')];
  if (!reflections.length) { paras.push(body('ไม่มีบันทึกหลังการสอน')); return paras; }

  const sorted = [...reflections].sort((a, b) => a.week_number - b.week_number);

  for (const r of sorted) {
    // Week heading with shaded background
    paras.push(new Paragraph({
      children: [
        new TextRun({ text: `สัปดาห์ที่ ${r.week_number}`, font: FC, size: 26, bold: true, color: '1D4ED8' }),
      ],
      spacing: { before: 200, after: 80 },
      shading: { type: ShadingType.SOLID, fill: 'DBEAFE', color: 'DBEAFE' },
    }));

    // Reflection content — split on newlines to preserve paragraphs
    const lines = r.content.split('\n').filter(l => l.trim() !== '');
    if (lines.length === 0) {
      paras.push(body('—'));
    } else {
      for (const line of lines) {
        paras.push(new Paragraph({
          children: [new TextRun({ text: line, font: FC, size: 22 })],
          spacing: { before: 40, after: 40 },
          indent: { left: convertInchesToTwip(0.3) },
        }));
      }
    }

    // Image (if any)
    if (includeImages && r.image_url && isImageUrl(r.image_url)) {
      const imgParas = await makeImageParagraph(r.image_url, `บันทึกหลังสอน สัปดาห์ที่ ${r.week_number}`);
      paras.push(...imgParas);
    } else if (!includeImages && r.image_url) {
      paras.push(body(`[รูปภาพ: ${r.image_url}]`, 0.3));
    }

    paras.push(new Paragraph({ spacing: { before: 60, after: 60 }, children: [] }));
  }
  return paras;
}

async function buildImagesSection(
  materials: Material[],
  activities: ActiveLearning[],
  reflections: TeachingReflection[],
): Promise<Paragraph[]> {
  const paras: Paragraph[] = [h1('7. รูปภาพจากเอกสารและกิจกรรม')];

  type ImageEntry = { label: string; url: string };
  const entries: ImageEntry[] = [];

  // Materials
  for (const m of materials) {
    for (const url of parseFileUrls(m.file_url)) {
      if (isImageUrl(url)) entries.push({ label: `เอกสาร: ${m.title}`, url });
    }
  }
  // Active Learning
  for (const a of activities) {
    for (const url of parseFileUrls(a.file_url)) {
      if (isImageUrl(url)) entries.push({ label: `Active Learning: ${a.title}`, url });
    }
  }
  // Reflections (images already shown in section 6 — skip duplicates here)
  for (const r of reflections) {
    if (r.image_url && isImageUrl(r.image_url)) {
      entries.push({ label: `บันทึกหลังสอน สัปดาห์ที่ ${r.week_number}`, url: r.image_url });
    }
  }

  if (!entries.length) {
    paras.push(body('ไม่มีรูปภาพที่แนบในรายวิชานี้'));
    return paras;
  }

  for (const entry of entries) {
    paras.push(h3(entry.label));
    const imgParas = await makeImageParagraph(entry.url, entry.label);
    paras.push(...imgParas);
  }
  return paras;
}

// ─── Main export function ─────────────────────────────────────────────────────

export async function exportCourseToWord(params: {
  course: Course;
  materials: Material[];
  assignments: Assignment[];
  questions: Question[];
  replies: Reply[];
  activities: ActiveLearning[];
  reflections: TeachingReflection[];
  includeImages?: boolean;
}): Promise<void> {
  const { course, materials, assignments, questions, replies, activities, reflections, includeImages = true } = params;

  const cMaterials = materials.filter(m => m.course_id === course.course_id);
  const cQuestions = questions.filter(q => q.course_id === course.course_id);
  const cReplies = replies.filter(r => cQuestions.some(q => q.question_id === r.question_id));
  const cActivities = activities.filter(a => a.course_id === course.course_id);
  const cReflections = reflections.filter(r => r.course_id === course.course_id);

  // Exclude standalone assignments whose title matches ANY AL activity
  const alTitles = new Set(cActivities.map(a => a.title.trim().toLowerCase()));
  const cAssignments = assignments
    .filter(a => a.course_id === course.course_id)
    .filter(a => !alTitles.has(a.title.trim().toLowerCase()));

  const now = new Date();
  const exportDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear() + 543}`;

  const sections: Paragraph[][] = [
    buildCoverSection(course),
    buildInfoSection(course),
    buildMaterialsSection(cMaterials),
    buildActiveLearningSection(cActivities),
    buildAssignmentsSection(cAssignments),
    buildQASection(cQuestions, cReplies),
    await buildReflectionsSection(cReflections, includeImages),
  ];

  if (includeImages) {
    // Section 7: images from materials and active learning only
    // (reflection images already embedded in section 6)
    sections.push(await buildImagesSection(cMaterials, cActivities, []));
  }

  const allParagraphs = sections.flatMap((s, i) =>
    i < sections.length - 1 ? [...s, new Paragraph({ children: [new PageBreak()] })] : s
  );

  const doc = new Document({
    styles: {
      default: {
        // Override every built-in Word style so Thai characters never fall back
        // to a system default (Cordia/Tahoma). cs = complex-script slot for Thai.
        document: {
          run: { font: FC, size: 22 },
        },
        heading1: {
          run: { font: FC, size: 36, bold: true, color: '1E3A5F' },
        },
        heading2: {
          run: { font: FC, size: 28, bold: true, color: '1D4ED8' },
        },
        heading3: {
          run: { font: FC, size: 24, bold: true, color: '374151' },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1.25),
            right: convertInchesToTwip(1),
          },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            children: [
              new TextRun({ text: `${course.course_code} ${course.course_name_th}`, font: FC, size: 18, color: '6B7280' }),
            ],
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0', space: 4 } },
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            children: [
              new TextRun({ text: `ส่งออกเมื่อ ${exportDate}  |  หน้า `, font: FC, size: 18, color: '9CA3AF' }),
              new TextRun({ children: [PageNumber.CURRENT], font: FC, size: 18, color: '9CA3AF' }),
              new TextRun({ text: ' / ', font: FC, size: 18, color: '9CA3AF' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FC, size: 18, color: '9CA3AF' }),
            ],
            alignment: AlignmentType.CENTER,
          })],
        }),
      },
      children: allParagraphs,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${course.course_code}_${course.semester_id}-${course.year}_export.docx`;
  saveAs(blob, filename);
}
