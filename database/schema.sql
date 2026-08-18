-- College ERP Database Schema (Supabase PostgreSQL)

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- DROP TABLES IF EXISTS (in order of dependencies)
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.timetable CASCADE;
DROP TABLE IF EXISTS public.leave_requests CASCADE;
DROP TABLE IF EXISTS public.fees CASCADE;
DROP TABLE IF EXISTS public.marks CASCADE;
DROP TABLE IF EXISTS public.examinations CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.enrollments CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.faculty CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. PROFILES TABLE (extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('ADMIN', 'FACULTY', 'STUDENT')) NOT NULL DEFAULT 'STUDENT',
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. DEPARTMENTS TABLE
CREATE TABLE public.departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. STUDENTS TABLE
CREATE TABLE public.students (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    student_id_code VARCHAR(50) UNIQUE NOT NULL, -- E.g. STD2026001
    department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
    semester INTEGER NOT NULL DEFAULT 1 CHECK (semester BETWEEN 1 AND 8),
    section VARCHAR(10) NOT NULL DEFAULT 'A',
    date_of_birth DATE,
    address TEXT,
    profile_photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. FACULTY TABLE
CREATE TABLE public.faculty (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    faculty_id_code VARCHAR(50) UNIQUE NOT NULL, -- E.g. FAC2026001
    department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
    designation VARCHAR(100) NOT NULL, -- E.g. Professor, Assistant Professor
    profile_photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. SUBJECTS TABLE
CREATE TABLE public.subjects (
    id SERIAL PRIMARY KEY,
    subject_code VARCHAR(50) UNIQUE NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    department_id INTEGER REFERENCES public.departments(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
    credits INTEGER NOT NULL DEFAULT 3 CHECK (credits BETWEEN 1 AND 6),
    faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. ENROLLMENTS TABLE
CREATE TABLE public.enrollments (
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES public.subjects(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (student_id, subject_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. ATTENDANCE TABLE
CREATE TABLE public.attendance (
    id SERIAL PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES public.subjects(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(10) CHECK (status IN ('PRESENT', 'ABSENT')) NOT NULL,
    marked_by UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
    semester INTEGER NOT NULL,
    section VARCHAR(10) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_student_subject_date UNIQUE (student_id, subject_id, date)
);

-- 8. EXAMINATIONS TABLE
CREATE TABLE public.examinations (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER REFERENCES public.subjects(id) ON DELETE CASCADE,
    exam_name VARCHAR(100) NOT NULL, -- E.g. 'Internal Assessment 1', 'Semester End Exam'
    max_marks INTEGER NOT NULL CHECK (max_marks > 0),
    exam_date DATE,
    exam_type VARCHAR(20) CHECK (exam_type IN ('INTERNAL', 'EXTERNAL', 'PRACTICAL')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. MARKS TABLE
CREATE TABLE public.marks (
    id SERIAL PRIMARY KEY,
    examination_id INTEGER REFERENCES public.examinations(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    internal_marks NUMERIC DEFAULT 0 CHECK (internal_marks >= 0),
    external_marks NUMERIC DEFAULT 0 CHECK (external_marks >= 0),
    total_marks NUMERIC DEFAULT 0 CHECK (total_marks >= 0),
    grade VARCHAR(5),
    result VARCHAR(10) CHECK (result IN ('PASS', 'FAIL')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_exam_student UNIQUE (examination_id, student_id)
);

-- 10. FEES TABLE
CREATE TABLE public.fees (
    id SERIAL PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
    paid_amount NUMERIC DEFAULT 0 CHECK (paid_amount >= 0),
    status VARCHAR(20) CHECK (status IN ('PAID', 'PARTIAL', 'PENDING')) DEFAULT 'PENDING',
    due_date DATE NOT NULL,
    description TEXT NOT NULL,
    semester INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 11. LEAVE REQUESTS TABLE
CREATE TABLE public.leave_requests (
    id SERIAL PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')) DEFAULT 'PENDING',
    approved_by UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT valid_dates CHECK (start_date <= end_date)
);

-- 12. TIMETABLE TABLE
CREATE TABLE public.timetable (
    id SERIAL PRIMARY KEY,
    day_of_week VARCHAR(15) CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id INTEGER REFERENCES public.subjects(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES public.faculty(id) ON DELETE CASCADE,
    classroom VARCHAR(50) NOT NULL,
    department_id INTEGER REFERENCES public.departments(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    section VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT valid_time CHECK (start_time < end_time)
);

-- 13. ANNOUNCEMENTS TABLE
CREATE TABLE public.announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_role VARCHAR(20) CHECK (target_role IN ('ALL', 'STUDENT', 'FACULTY', 'ADMIN')) DEFAULT 'ALL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_students_dept_sem_sec ON public.students(department_id, semester, section);
CREATE INDEX idx_faculty_dept ON public.faculty(department_id);
CREATE INDEX idx_subjects_dept_sem ON public.subjects(department_id, semester);
CREATE INDEX idx_attendance_student_subject ON public.attendance(student_id, subject_id);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_marks_student ON public.marks(student_id);
CREATE INDEX idx_timetable_dept_sem_sec ON public.timetable(department_id, semester, section);
CREATE INDEX idx_timetable_faculty ON public.timetable(faculty_id);
CREATE INDEX idx_announcements_target ON public.announcements(target_role);

-- TRIGGER FUNCTION TO SYNC AUTH.USERS TO PUBLIC.PROFILES
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'STUDENT'),
    COALESCE((NEW.raw_user_meta_data->>'full_name')::text, SPLIT_PART(NEW.email, '@', 1)),
    (NEW.raw_user_meta_data->>'phone')::text
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    role = COALESCE(EXCLUDED.role, profiles.role),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CREATE TRIGGER ON AUTH.USERS
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- BASELINE RLS POLICIES (Allow all actions for service role, and read-all for users in the system)
-- (Note: Backend uses service_role key, which bypasses RLS)
CREATE POLICY "Allow public read access to departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read access to profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read access to students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read access to faculty" ON public.faculty FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read access to subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read access to enrollments" ON public.enrollments FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read access to attendance" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read access to examinations" ON public.examinations FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read access to marks" ON public.marks FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read access to fees" ON public.fees FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read access to leave_requests" ON public.leave_requests FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read access to timetable" ON public.timetable FOR SELECT USING (true);
CREATE POLICY "Allow authenticated read access to announcements" ON public.announcements FOR SELECT USING (true);
