const supabase = require('../config/supabaseClient');

const SEED_EMAILS = [
  'admin@college.edu',
  'faculty1@college.edu',
  'faculty2@college.edu',
  'faculty3@college.edu',
  'student1@college.edu',
  'student2@college.edu',
  'student3@college.edu',
  'student4@college.edu',
  'student5@college.edu',
  'student6@college.edu',
  'student7@college.edu',
  'student8@college.edu',
  'student9@college.edu',
  'student10@college.edu'
];

async function seed() {
  console.log('Starting database seeding...');

  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase environment variables are missing. Cannot seed database.');
    }

    // 1. Clean up existing auth users to prevent duplicates
    console.log('Cleaning up existing auth users...');
    const { data: userList, error: listError } = await supabase.auth.admin.listUsers({
      perPage: 100
    });

    if (listError) throw listError;

    const usersToDelete = userList.users.filter(user => SEED_EMAILS.includes(user.email));
    for (const user of usersToDelete) {
      console.log(`Deleting existing user: ${user.email}`);
      await supabase.auth.admin.deleteUser(user.id);
    }

    // 2. Clean up tables (Trigger cascade handles some, but let's clear explicitly)
    console.log('Cleaning up table records...');
    await supabase.from('announcements').delete().neq('id', -1);
    await supabase.from('timetable').delete().neq('id', -1);
    await supabase.from('leave_requests').delete().neq('id', -1);
    await supabase.from('fees').delete().neq('id', -1);
    await supabase.from('marks').delete().neq('id', -1);
    await supabase.from('examinations').delete().neq('id', -1);
    await supabase.from('attendance').delete().neq('id', -1);
    await supabase.from('enrollments').delete().neq('student_id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('subjects').delete().neq('id', -1);
    await supabase.from('faculty').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('departments').delete().neq('id', -1);
    await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 3. Seed Departments
    console.log('Inserting departments...');
    const departmentsData = [
      { name: 'Computer Science and Engineering', code: 'CSE', description: 'Department of computer programming and software engineering.' },
      { name: 'Electronics and Communication Engineering', code: 'ECE', description: 'Department of microelectronics and communication networks.' },
      { name: 'Information Science and Engineering', code: 'ISE', description: 'Department of software systems, web technology, and databases.' }
    ];

    const { data: departments, error: deptErr } = await supabase
      .from('departments')
      .insert(departmentsData)
      .select();

    if (deptErr) throw deptErr;
    console.log(`Inserted ${departments.length} departments.`);

    const cseDept = departments.find(d => d.code === 'CSE');
    const eceDept = departments.find(d => d.code === 'ECE');
    const iseDept = departments.find(d => d.code === 'ISE');

    // 4. Create Admin Account
    console.log('Creating Admin Account...');
    const { data: adminAuth, error: adminErr } = await supabase.auth.admin.createUser({
      email: 'admin@college.edu',
      password: 'Admin@123',
      email_confirm: true,
      user_metadata: {
        role: 'ADMIN',
        full_name: 'System Administrator',
        phone: '+11234567890'
      }
    });
    if (adminErr) throw adminErr;
    
    // Explicit update to force profile settings
    await supabase.from('profiles').update({ role: 'ADMIN', full_name: 'System Administrator' }).eq('id', adminAuth.user.id);
    console.log('Admin account created.');

    // 5. Create Faculty Accounts
    console.log('Creating Faculty Accounts...');
    const facultyList = [
      { email: 'faculty1@college.edu', name: 'Dr. Alan Turing', designation: 'Professor', deptId: cseDept.id, code: 'FAC-CSE-01' },
      { email: 'faculty2@college.edu', name: 'Dr. Ada Lovelace', designation: 'Associate Professor', deptId: iseDept.id, code: 'FAC-ISE-01' },
      { email: 'faculty3@college.edu', name: 'Dr. Grace Hopper', designation: 'Assistant Professor', deptId: eceDept.id, code: 'FAC-ECE-01' }
    ];

    const facultyRecords = [];

    for (const f of facultyList) {
      const { data: facAuth, error: facAuthErr } = await supabase.auth.admin.createUser({
        email: f.email,
        password: 'Faculty@123',
        email_confirm: true,
        user_metadata: {
          role: 'FACULTY',
          full_name: f.name,
          phone: '+12345678901'
        }
      });
      if (facAuthErr) throw facAuthErr;

      await supabase.from('profiles').update({ role: 'FACULTY', full_name: f.name }).eq('id', facAuth.user.id);

      const { data: facObj, error: facTableErr } = await supabase
        .from('faculty')
        .insert({
          id: facAuth.user.id,
          faculty_id_code: f.code,
          department_id: f.deptId,
          designation: f.designation
        })
        .select()
        .single();

      if (facTableErr) throw facTableErr;
      facultyRecords.push({ ...facObj, name: f.name });
    }
    console.log(`Created ${facultyRecords.length} faculty records.`);

    const alanTuring = facultyRecords.find(f => f.name.includes('Turing'));
    const adaLovelace = facultyRecords.find(f => f.name.includes('Lovelace'));
    const graceHopper = facultyRecords.find(f => f.name.includes('Hopper'));

    // 6. Create Students Accounts
    console.log('Creating Student Accounts...');
    const studentList = [
      { email: 'student1@college.edu', name: 'Alice Smith', semester: 1, section: 'A', deptId: cseDept.id, code: 'STD-CSE-01' },
      { email: 'student2@college.edu', name: 'Bob Jones', semester: 1, section: 'A', deptId: cseDept.id, code: 'STD-CSE-02' },
      { email: 'student3@college.edu', name: 'Charlie Brown', semester: 1, section: 'A', deptId: cseDept.id, code: 'STD-CSE-03' },
      { email: 'student4@college.edu', name: 'David Miller', semester: 3, section: 'A', deptId: cseDept.id, code: 'STD-CSE-04' },
      { email: 'student5@college.edu', name: 'Emma Wilson', semester: 3, section: 'A', deptId: cseDept.id, code: 'STD-CSE-05' },
      { email: 'student6@college.edu', name: 'Frank Thomas', semester: 1, section: 'A', deptId: iseDept.id, code: 'STD-ISE-01' },
      { email: 'student7@college.edu', name: 'Grace Taylor', semester: 1, section: 'A', deptId: iseDept.id, code: 'STD-ISE-02' },
      { email: 'student8@college.edu', name: 'Henry Davis', semester: 1, section: 'A', deptId: eceDept.id, code: 'STD-ECE-01' },
      { email: 'student9@college.edu', name: 'Ivy Martinez', semester: 1, section: 'A', deptId: eceDept.id, code: 'STD-ECE-02' },
      { email: 'student10@college.edu', name: 'Jack Anderson', semester: 1, section: 'A', deptId: eceDept.id, code: 'STD-ECE-03' }
    ];

    const studentRecords = [];

    for (const s of studentList) {
      const { data: stAuth, error: stAuthErr } = await supabase.auth.admin.createUser({
        email: s.email,
        password: 'Student@123',
        email_confirm: true,
        user_metadata: {
          role: 'STUDENT',
          full_name: s.name,
          phone: '+13456789012'
        }
      });
      if (stAuthErr) throw stAuthErr;

      await supabase.from('profiles').update({ role: 'STUDENT', full_name: s.name }).eq('id', stAuth.user.id);

      const { data: stObj, error: stTableErr } = await supabase
        .from('students')
        .insert({
          id: stAuth.user.id,
          student_id_code: s.code,
          department_id: s.deptId,
          semester: s.semester,
          section: s.section,
          date_of_birth: '2005-01-01',
          address: '123 University Ave, Campus Town',
          profile_photo: ''
        })
        .select()
        .single();

      if (stTableErr) throw stTableErr;
      studentRecords.push({ ...stObj, name: s.name });
    }
    console.log(`Created ${studentRecords.length} student records.`);

    // 7. Seed Subjects
    console.log('Inserting subjects...');
    const subjectsData = [
      { subject_code: 'CS101', subject_name: 'Introduction to Computer Programming', department_id: cseDept.id, semester: 1, credits: 4, faculty_id: alanTuring.id },
      { subject_code: 'CS102', subject_name: 'Digital System Design', department_id: cseDept.id, semester: 1, credits: 3, faculty_id: graceHopper.id },
      { subject_code: 'CS301', subject_name: 'Data Structures and Algorithms', department_id: cseDept.id, semester: 3, credits: 4, faculty_id: adaLovelace.id },
      { subject_code: 'IS101', subject_name: 'Introduction to Information Systems', department_id: iseDept.id, semester: 1, credits: 3, faculty_id: adaLovelace.id },
      { subject_code: 'EC101', subject_name: 'Basic Electronics', department_id: eceDept.id, semester: 1, credits: 4, faculty_id: graceHopper.id }
    ];

    const { data: subjects, error: subTableErr } = await supabase
      .from('subjects')
      .insert(subjectsData)
      .select();

    if (subTableErr) throw subTableErr;
    console.log(`Inserted ${subjects.length} subjects.`);

    const cs101 = subjects.find(s => s.subject_code === 'CS101');
    const cs102 = subjects.find(s => s.subject_code === 'CS102');
    const cs301 = subjects.find(s => s.subject_code === 'CS301');
    const is101 = subjects.find(s => s.subject_code === 'IS101');
    const ec101 = subjects.find(s => s.subject_code === 'EC101');

    // 8. Enroll Students
    console.log('Enrolling students into subjects...');
    const enrollmentsData = [];
    studentRecords.forEach(st => {
      if (st.department_id === cseDept.id && st.semester === 1) {
        enrollmentsData.push({ student_id: st.id, subject_id: cs101.id, semester: 1 });
        enrollmentsData.push({ student_id: st.id, subject_id: cs102.id, semester: 1 });
      } else if (st.department_id === cseDept.id && st.semester === 3) {
        enrollmentsData.push({ student_id: st.id, subject_id: cs301.id, semester: 3 });
      } else if (st.department_id === iseDept.id) {
        enrollmentsData.push({ student_id: st.id, subject_id: is101.id, semester: 1 });
      } else if (st.department_id === eceDept.id) {
        enrollmentsData.push({ student_id: st.id, subject_id: ec101.id, semester: 1 });
      }
    });

    const { error: enrollErr } = await supabase
      .from('enrollments')
      .insert(enrollmentsData);

    if (enrollErr) throw enrollErr;
    console.log(`Created ${enrollmentsData.length} student subject enrollments.`);

    // 9. Timetable
    console.log('Seeding timetable slots...');
    const timetableData = [
      { day_of_week: 'Monday', start_time: '09:00:00', end_time: '10:00:00', subject_id: cs101.id, faculty_id: alanTuring.id, classroom: 'CR-101', department_id: cseDept.id, semester: 1, section: 'A' },
      { day_of_week: 'Monday', start_time: '10:15:00', end_time: '11:15:00', subject_id: cs102.id, faculty_id: graceHopper.id, classroom: 'CR-102', department_id: cseDept.id, semester: 1, section: 'A' },
      { day_of_week: 'Tuesday', start_time: '11:00:00', end_time: '12:00:00', subject_id: cs301.id, faculty_id: adaLovelace.id, classroom: 'CR-301', department_id: cseDept.id, semester: 3, section: 'A' },
      { day_of_week: 'Wednesday', start_time: '09:00:00', end_time: '10:00:00', subject_id: is101.id, faculty_id: adaLovelace.id, classroom: 'CR-201', department_id: iseDept.id, semester: 1, section: 'A' },
      { day_of_week: 'Thursday', start_time: '10:00:00', end_time: '11:00:00', subject_id: ec101.id, faculty_id: graceHopper.id, classroom: 'CR-401', department_id: eceDept.id, semester: 1, section: 'A' }
    ];

    const { error: timeErr } = await supabase
      .from('timetable')
      .insert(timetableData);

    if (timeErr) throw timeErr;
    console.log('Timetable slots seeded.');

    // 10. Attendance Records
    console.log('Seeding attendance records...');
    const attendanceRecords = [];
    const dates = ['2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14', '2026-08-17'];

    studentRecords.forEach(st => {
      dates.forEach((d, idx) => {
        // Distribute present/absents
        const status = (idx === 2 && st.name.startsWith('Bob')) || (idx === 4 && st.name.startsWith('Frank')) ? 'ABSENT' : 'PRESENT';
        
        if (st.department_id === cseDept.id && st.semester === 1) {
          attendanceRecords.push({ student_id: st.id, subject_id: cs101.id, date: d, status, marked_by: alanTuring.id, semester: 1, section: 'A' });
        } else if (st.department_id === iseDept.id) {
          attendanceRecords.push({ student_id: st.id, subject_id: is101.id, date: d, status, marked_by: adaLovelace.id, semester: 1, section: 'A' });
        } else if (st.department_id === eceDept.id) {
          attendanceRecords.push({ student_id: st.id, subject_id: ec101.id, date: d, status, marked_by: graceHopper.id, semester: 1, section: 'A' });
        }
      });
    });

    const { error: attErr } = await supabase
      .from('attendance')
      .insert(attendanceRecords);

    if (attErr) throw attErr;
    console.log(`Seeded ${attendanceRecords.length} attendance records.`);

    // 11. Examinations
    console.log('Seeding examinations...');
    const examData = [
      { subject_id: cs101.id, exam_name: 'Internal Assessment 1', max_marks: 50, exam_date: '2026-08-15', exam_type: 'INTERNAL' },
      { subject_id: ec101.id, exam_name: 'Internal Assessment 1', max_marks: 50, exam_date: '2026-08-15', exam_type: 'INTERNAL' }
    ];

    const { data: exams, error: examErr } = await supabase
      .from('examinations')
      .insert(examData)
      .select();

    if (examErr) throw examErr;
    console.log(`Inserted ${exams.length} examinations.`);

    const cs101Exam = exams.find(e => e.subject_id === cs101.id);
    const ec101Exam = exams.find(e => e.subject_id === ec101.id);

    // 12. Marks Records
    console.log('Seeding student marks...');
    const marksData = [];
    studentRecords.forEach(st => {
      if (st.department_id === cseDept.id && st.semester === 1 && cs101Exam) {
        // Cs101 marks
        const internals = st.name.startsWith('Alice') ? 45 : st.name.startsWith('Bob') ? 35 : 22;
        const total = internals; // Only internals for now
        const grade = total >= 45 ? 'O' : total >= 35 ? 'A' : 'P';
        const result = 'PASS';

        marksData.push({
          examination_id: cs101Exam.id,
          student_id: st.id,
          internal_marks: internals,
          external_marks: 0,
          total_marks: total,
          grade,
          result
        });
      } else if (st.department_id === eceDept.id && ec101Exam) {
        // Ec101 marks
        const internals = st.name.startsWith('Henry') ? 48 : 30;
        const total = internals;
        const grade = total >= 45 ? 'O' : 'B';
        const result = 'PASS';

        marksData.push({
          examination_id: ec101Exam.id,
          student_id: st.id,
          internal_marks: internals,
          external_marks: 0,
          total_marks: total,
          grade,
          result
        });
      }
    });

    const { error: marksErr } = await supabase
      .from('marks')
      .insert(marksData);

    if (marksErr) throw marksErr;
    console.log(`Seeded marks records for ${marksData.length} students.`);

    // 13. Fees Records
    console.log('Seeding student fees records...');
    const feesData = studentRecords.map((st, idx) => {
      const total_amount = 55000;
      let paid_amount = 55000;
      let status = 'PAID';

      if (idx % 3 === 1) {
        paid_amount = 25000;
        status = 'PARTIAL';
      } else if (idx % 3 === 2) {
        paid_amount = 0;
        status = 'PENDING';
      }

      return {
        student_id: st.id,
        total_amount,
        paid_amount,
        status,
        due_date: '2026-10-31',
        description: `Tuition & Examination Fee - Semester ${st.semester}`,
        semester: st.semester
      };
    });

    const { error: feesErr } = await supabase
      .from('fees')
      .insert(feesData);

    if (feesErr) throw feesErr;
    console.log(`Seeded ${feesData.length} student fee records.`);

    // 14. Announcements
    console.log('Seeding announcements...');
    const announcementsData = [
      { title: 'Welcome to ERP Portal', description: 'We are pleased to launch our new College ERP portal. Log in to check your classes, marks, and attendance details.', created_by: adminAuth.user.id, target_role: 'ALL' },
      { title: 'Mid-Term Examinations Schedule', description: 'The mid-term internal examinations are scheduled to start from Sept 15, 2026. Please check the timetable tab for details.', created_by: adminAuth.user.id, target_role: 'STUDENT' },
      { title: 'Faculty Monthly Meeting', description: 'Dear faculty members, the monthly review meeting is scheduled on Aug 25 at 3:00 PM in Seminar Hall 1.', created_by: adminAuth.user.id, target_role: 'FACULTY' }
    ];

    const { error: annErr } = await supabase
      .from('announcements')
      .insert(announcementsData);

    if (annErr) throw annErr;
    console.log('Announcements seeded successfully.');

    console.log('========================================================================');
    console.log('DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('========================================================================');
    console.log('Standard Accounts:');
    console.log('  Admin  : admin@college.edu   / Admin@123');
    console.log('  Faculty: faculty1@college.edu / Faculty@123 (CSE - Dr. Alan Turing)');
    console.log('  Student: student1@college.edu / Student@123 (CSE Sem 1 - Alice Smith)');
    console.log('========================================================================');

  } catch (err) {
    console.error('Fatal error during seeding:', err);
  }
}

seed();
