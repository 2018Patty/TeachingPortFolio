/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Course, Material, Assignment } from './types';

export const DEFAULT_COURSES: Course[] = [
  {
    course_id: '928-221-1-2026',
    course_code: '928-221',
    course_name_th: 'การวิเคราะห์ข้อมูลขั้นสูงสำหรับธุรกิจ การค้าสมัยใหม่',
    course_name_en: 'ADVANCED DATA ANA FOR MODERN TRADE BUS',
    description: 'หลักการประยุกต์ใช้เทคนิคการวิเคราะห์ข้อมูลขั้นสูง (Advanced Data Analytics) เพื่อประโยชน์เชิงการแข่งขันสำหรับวิทยาการเทคโนโลยีและโมเดลธุรกิจค้าทางโมเดิร์นเทรด การทำเหมืองข้อมูล การวิเคราะห์พยากรณ์พฤติกรรม ตลอดจนรูปแบบเชิงกลยุทธ์เชิงปริมาณ',
    objectives: [
      'เข้าใจทฤษฎีและแนวปฏิบัติของการทำ Advanced Data Analytics สำหรับธุรกิจการค้ายุคใหม่',
      'พัฒนาและออกแบบแบบจำลองอธิบายหรือคาดคะเนข้อมูลลูกค้าด้วยเทคนิคเหมืองข้อมูลประเภทต่างๆ',
      'ประยุกต์ใช้ซอฟต์แวร์สนับสนุนการประมวลผลและการจัดทำ Business Intelligence Dashboard อย่างเป็นอาชีพ'
    ],
    semester_id: 1,
    year: 2026,
    credit: '2((2)-0-4)',
    section: '01',
    theory_hours: 2,
    practice_hours: 0,
    total_weeks: 15,
    views: 342
  },
  {
    course_id: '934-207-1-2026',
    course_code: '934-207',
    course_name_th: 'พาณิชย์อิเล็กทรอนิกส์',
    course_name_en: 'ELECTRONIC COMMERCE',
    description: 'มิติทัศน์ในการขับเคลื่อนการค้าผ่านพรมแดนดิจิทัล ศึกษารูปแบบโครงสร้างวิชาของพาณิชย์อิเล็กทรอนิกส์ การพัฒนาแพลตฟอร์มบริหารคลังสินค้า ระบบความปลอดภัยและการคุ้มครองข้อมูลส่วนบุคคล การประยุกต์ใช้เทคโนโลยีบล็อกเชนและระบบรับชำระเงิน',
    objectives: [
      'อธิบายสถาปัตยกรรม เทคโนโลยีเครือข่าย และโมเดลทำธุรกรรมของระบบ e-Commerce ได้ครอบคลุม',
      'ออกแบบและพัฒนาระบบชำระเงินออนไลน์ที่ผ่านการรับรองความปลอดภัยตามเกณฑ์มาตรฐานสารสนเทศ',
      'บูรณาการระเบียบแผนส่งเสริมการตลาด การบริหารห่วงโซ่อุปทานบนตลาดแพลตฟอร์มยอดนิยมระดับโลก'
    ],
    semester_id: 1,
    year: 2026,
    credit: '3((3)-0-6)',
    section: '01',
    theory_hours: 3,
    practice_hours: 0,
    total_weeks: 15,
    views: 215
  },
  {
    course_id: '934-245-1-2026',
    course_code: '934-245',
    course_name_th: 'วิทยาการข้อมูลเพื่อธุรกิจดิจิทัล 2',
    course_name_en: 'DATA SCI FOR DIGITAL BUS II',
    description: 'ภาคปฏิบัติการต่อเนื่อง ข้อมูลสถิติเชิงลึก การเรียนรู้ของเครื่องเชิงลึกแบบมีผู้ประเมินและไม่มีผู้ประเมินผล การทำระบบแนะแนวจำเพาะบุคคล (Recommendation engine) และการจัดการท่อส่งข้อมูลชุดใหญ่อย่างต่อเนื่องแบบเรียลไทม์เพื่อขับเคลื่อนการตัดสินใจองค์กร',
    objectives: [
      'พัฒนาโครงร่างสถาปัตยกรรมแบบจำลองคาดการณ์พฤติกรรมลูกค้าเชิงรุกได้แม่นยำ',
      'เลือกสรรอัลกอริทึมกลุ่มกลุ่มสหสัมพันธ์และตัวจัดหมวดหมู่กลุ่มเป้าหมายได้ตอบโจทย์การดำเนินธุรกิจ',
      'ตรวจสอบและประเมินประสิทธิภาพความเอนเอียง (Bias-Variance tradeoff) ของผลลัพธ์การฝึกหัดโมเดล'
    ],
    semester_id: 1,
    year: 2026,
    credit: '3((2)-2-5)',
    section: '01',
    theory_hours: 2,
    practice_hours: 2,
    total_weeks: 15,
    views: 189
  },
  {
    course_id: '934-321-2-2026',
    course_code: '934-321',
    course_name_th: 'ชุดวิชาระบบสารสนเทศเชิงกลยุทธ์',
    course_name_en: 'MODULE : STRATEGIC INFO SYSTEM',
    description: 'เทคโนโลยีสารสนเทศเพื่อความได้เปรียบเชิงการแข่งขันและการวางแผนบูรณาการทรัพย์สินทางปัญญาองค์กร วิเคราะห์กรณีศึกษาความผิดพลาดและการก้าวผ่านวิกฤติตามวิธีปรับเปลี่ยนธุรกิจแบบ Digital Transformation ระดับมหภาค',
    objectives: [
      'ระบุความสอดคล้องระหว่างวิสัยทัศน์พันธกิจทางธุรกิจร่วมกับระบบโครงข่ายความมั่นคงทางสารสนเทศ',
      'ดำเนินการจัดทำสถาปัตยกรรมระบบสำหรับองค์กรรูปแบบไฮบริดและคลาวด์เนทีฟที่ปลอดภัย',
      'ประเมินภาระงบประมาณและเวลาในการเปลี่ยนผ่านสัดส่วนระบบงานเดิมสู่ดิจิทัลแพลตฟอร์ม'
    ],
    semester_id: 2,
    year: 2026,
    credit: '9((4)-15-8)',
    section: '01',
    theory_hours: 4,
    practice_hours: 15,
    total_weeks: 15,
    views: 420
  },
  {
    course_id: '934-451-1-2026',
    course_code: '934-451',
    course_name_th: 'โครงงานทางเทคโนโลยีสารสนเทศ',
    course_name_en: 'PROJECT IN IT',
    description: 'กระบวนการวิศวกรรมการพัฒนาโครงงานไอทีภาคบังคับภายใต้กรอบเวลาและงบประมาณจำกัด ตั้งแต่ขั้นตอนการสืบสอบความต้องการผู้ใช้อย่างลึกซึ้ง ออกแบบโครงร่างระบบ เขียนโปรแกรม ตรวจสอบคุณภาพ และจัดทำเอกสารวิชาการพร้อมการสาธิตอย่างเป็นขั้นตอน',
    objectives: [
      'บูรณาการองค์ความรู้ทางเทคนิคและกระบวนการจัดการเพื่อบรรลุชิ้นงานซอฟต์แวร์หรือบริการที่แก้ปัญหาได้ตรงจุด',
      'วิเคราะห์สมรรถนะ ค้นคว้างานวิจัยอ้างอิง และทำรายงานคู่มือระบบอันเป็นประโยชน์ต่อชุมชนคอมพิวเตอร์',
      'ยึดมั่นในวินัยวิชาชีพ การนำเสนอผลงานระดับทางการที่มีจรรยาบรรณวิชาการไร้การลอกโค้ด'
    ],
    semester_id: 1,
    year: 2026,
    credit: '3(0-9-0)',
    section: '01',
    theory_hours: 0,
    practice_hours: 9,
    total_weeks: 15,
    views: 512
  },
  {
    course_id: '934-501-2-2026',
    course_code: '934-501',
    course_name_th: 'วิทยานิพนธ์',
    course_name_en: 'THESIS',
    description: 'วิจัยสถาปนาแนวคิดและประดิษฐ์สิทธิบัตรเชิงสารสนเทศ ดำเนินนวัตกรรมที่มีความสร้างสรรค์สูง ศึกษาเชิงวิเคราะห์ขอบเขตเทคโนโลยีแบบดั้งเดิม ท้าทายสมมติฐานใหม่ และทำข้อสรุปผลงานระดับเวทีสากล',
    objectives: [
      'สืบค้น ระบุ และสังเคราะห์ความรู้จากวิทยานิพนธ์ฉบับแปลในวารสารสารสนเทศชั้นนำเพื่อหาช่องว่างงานวิจัย',
      'ดำเนินระเบียบวิธีวิจัยขั้นสูง ออกแบบมาตรวัดตัวจับเท็จเทียบเคียงผลลัพธ์เดิมอย่างสุจริตทางวิชาการ',
      'เรียบเรียงบทนิพนธ์และจัดทำแผนการนำเสนอต่อสภาตรวจสอบคุณภาพผลงานได้อย่างชัดเจนเฉียบแหลม'
    ],
    semester_id: 2,
    year: 2026,
    credit: '22(0-66-0)',
    section: '05',
    theory_hours: 0,
    practice_hours: 66,
    total_weeks: 15,
    views: 98
  }
];

export const DEFAULT_MATERIALS: Material[] = [
  {
    material_id: '928221-M01',
    course_id: '928-221-1-2026',
    title: 'Slide Week 1: Introduction to Advanced Business Analytics',
    type: 'slides',
    week_number: 1,
    file_url: 'https://storage.googleapis.com/sample-portfolio-bucket/slides/928221_w1_intro.pdf',
    description: 'ปฐมนิเทศ คอร์สเอาต์ไลน์ แนะนำแนวคิดการใช้เครื่องมือประมวลผลข้อมูลในห่วงโซ่อุปทาน'
  },
  {
    material_id: '928221-M02',
    course_id: '928-221-1-2026',
    title: 'Video Note: RFM Model & Customer Segmentation Case Study',
    type: 'video',
    week_number: 3,
    file_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    description: 'กรณีศึกษาจำลองความถี่และปริมาณการมีส่วนร่วมของลูกค้าค้าส่งในไทย'
  },
  {
    material_id: '934207-M01',
    course_id: '934-207-1-2026',
    title: 'Slide Week 1: Digital E-Commerce Platforms & Payment Gateways',
    type: 'slides',
    week_number: 1,
    file_url: 'https://storage.googleapis.com/sample-portfolio-bucket/slides/934207_w1_ecommerce.pdf',
    description: 'เทคโนโลยีเกตเวย์ชำระเงินมาตรฐาน และรูปแบบธุรกิจออนไลน์ประเภท B2B, B2C'
  },
  {
    material_id: '934245-M01',
    course_id: '934-245-1-2026',
    title: 'Slide Week 2: Regression and Predictive Analytics in Digital Business',
    type: 'slides',
    week_number: 2,
    file_url: 'https://storage.googleapis.com/sample-portfolio-bucket/slides/934245_w2_ml.pdf',
    description: 'ทบทวนอัลกอริทึมพยากรณ์เชิงเส้น และวิธีการเตรียมข้อมูลเพื่อฝึกพยากรณ์ความพึงพอใจ'
  },
  {
    material_id: '934321-M01',
    course_id: '934-321-2-2026',
    title: 'Slide Week 1: Strategic Alignment & Enterprise Architecture',
    type: 'slides',
    week_number: 1,
    file_url: 'https://storage.googleapis.com/sample-portfolio-bucket/slides/934321_w1_alignment.pdf',
    description: 'กรอบแนวทาง Zachman Framework และการเชื่อมโยงวิสัยทัศน์องค์กรกับระบบซอฟต์แวร์'
  },
  {
    material_id: '934451-M01',
    course_id: '934-451-1-2026',
    title: 'เอกสารอ้างอิง: รูปแบบมาตรฐานการเขียนเล่มรายงานโครงงานไอที (Project Proposal Format)',
    type: 'document',
    week_number: 1,
    file_url: 'https://storage.googleapis.com/sample-portfolio-bucket/docs/934451_proposal_guideline.pdf',
    description: 'โครงสร้างสารบัญ บทนำ ทบทวนวรรณกรรม และแผนงานแบบ Gantt Chart สำหรับนำเสนอบอร์ด'
  },
  {
    material_id: '934501-M01',
    course_id: '934-501-2-2026',
    title: 'เอกสารแนวทาง: วิธีรักษามาตรฐานจรรยาบรรณวิจัยและป้องกันคัดลอกวรรณกรรม (Thesis Integrity Manual)',
    type: 'document',
    week_number: 1,
    file_url: 'https://storage.googleapis.com/sample-portfolio-bucket/docs/934501_integrity_guide.pdf',
    description: 'ข้อควรรู้เกี่ยวกับ Turnitin ค่าความคล้ายคลึง และการอ้างอิงวิชาการที่เป็นสากล'
  }
];

export const DEFAULT_ASSIGNMENTS: Assignment[] = [
  {
    assignment_id: '928221-A01',
    course_id: '928-221-1-2026',
    title: 'งานมอบหมายที่ 1: การวิเคราะห์พฤติกรรมการซื้อเชิงลึก (Deep Cohort Analysis)',
    description: 'ให้นักศึกษาดาวน์โหลดสเปรดชีตสถิติยอดค้าส่ง แล้วเขียนโปรแกรมทำ Cohort Analysis เพื่อระบุว่าลูกค้ากลุ่มใดมีอัตราการหวนกลับมาซื้อสูงสุดตามภาคเรียน พร้อมส่งรายงานสรุปแบบ PDF',
    due_date: '2026-06-20',
    attachment_url: 'https://storage.googleapis.com/sample-portfolio-bucket/assignments/928221_cohort.pdf',
    status: 'open'
  },
  {
    assignment_id: '934207-A01',
    course_id: '934-207-1-2026',
    title: 'งานมอบหมายที่ 1: การวิเคราะห์เปรียบเทียบ Business Model ของบริษัทอีคอมเมิร์ซไทย',
    description: 'ศึกษาบทวิเคราะห์กลยุทธ์การขายบนเว็บบรรจุสินค้าไทย ดำเนินการวิเคราะห์จุดอ่อนจุดแข็งและข้อได้เปรียบด้วย SWOT Analysis ของแบรนด์ที่เลือกสรร',
    due_date: '2026-06-25',
    attachment_url: 'https://storage.googleapis.com/sample-portfolio-bucket/assignments/934207_swot_retail.pdf',
    status: 'open'
  },
  {
    assignment_id: '934245-A01',
    course_id: '934-245-1-2026',
    title: 'โครงงานที่ 1: การโมเดลลิ่งพยากรณ์อัตราการยกเลิกสินค้าสมาชิก (Churn Prediction Model)',
    description: 'ส่งซอร์สโค้ด Jupyter Notebook และสมุดภาพรายงานตัวแปรที่มีอิทธิพลต่อคะแนนรอยร้าวของสมาชิกแพ็คเกจแบบพรีเมียม',
    due_date: '2026-07-05',
    status: 'upcoming'
  },
  {
    assignment_id: '934321-A01',
    course_id: '934-321-2-2026',
    title: 'งานมอบหมายที่ 1: แผนยุทธศาสตร์สารสนเทศสำหรับการปรับตัวอุตสาหกรรมสุขภาพดิจิทัล',
    description: 'ทำรายงานกลุ่มร่วมวิเคราะห์ขอบเขตระบบ Cloud-native ERP เพื่อเพิ่มความปลอดภัย และการบูรณาการสิทธิ์ส่วนบุคคลด้านเอกสารประวัติสุขภาพ',
    due_date: '2026-11-15',
    status: 'open'
  },
  {
    assignment_id: '934451-A01',
    course_id: '934-451-1-2026',
    title: 'โครงงานไอทีระยะที่ 1: ส่งหลักการเหตุผลและสถาปัตยกรรมระบบเบื้องต้น (Proposal Abstract)',
    description: 'เอกสารนำเสนอขนาด 3 หน้าเพื่อขออนุมัติจัดตั้งโครงงาน อธิบายปัญหา เทคโนโลยีที่เลือก และการประเมินการใช้ API สำคัญ',
    due_date: '2026-06-18',
    attachment_url: 'https://storage.googleapis.com/sample-portfolio-bucket/assignments/934451_proposal.pdf',
    status: 'open'
  },
  {
    assignment_id: '934501-A01',
    course_id: '934-501-2-2026',
    title: 'รายงานความคืบหน้าวิทยานิพนธ์ฉบับสมบูรณ์เดือนแรกสุด (Progress Thesis Report #1)',
    description: 'อธิบายกรอบงานวิจัยในบทแรก แผนวรรณกรรมที่สืบค้นสำเร็จ และส่งตัวสรุปบทนำให้คณะกรรมการประเมินเทคโนโลยีเห็นความคืบหน้าอย่างมั่นคง',
    due_date: '2026-10-30',
    status: 'open'
  }
];
