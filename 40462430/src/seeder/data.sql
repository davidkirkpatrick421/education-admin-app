
CREATE DATABASE IF NOT EXISTS `40462430`;
USE `40462430`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS classification_results;
DROP TABLE IF EXISTS module_results;
DROP TABLE IF EXISTS officer_assignments;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS programmes;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    role ENUM('admin', 'officer') NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (email, password, first_name, surname, role, is_active) VALUES
('admin@qub.ac.uk',    '$2b$10$rOlHrOcH1hiymHoTBXS3EO8f8s9puJd4kT9Fw4EaWzGiELQZkOuDe', 'Admin',  'User',  'admin',   1),
('officer1@qub.ac.uk', '$2b$10$VA68STUAFTJqg21I6VU.Ze.dohUbLmoGPAe1oftWuuu3uQX4hihRO', 'Bob',    'Smith', 'officer', 1),
('officer2@qub.ac.uk', '$2b$10$r9P1TDds4dVoUUrIlhTXLOZosnL.B9Mp3/.rj3onxKOFfRSeMhDuy', 'Jim',    'White', 'officer', 1);

CREATE TABLE programmes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    y2_weight DECIMAL(4,2) NOT NULL,
    y3_weight DECIMAL(4,2) NOT NULL,
    resit_cap_enabled TINYINT(1) DEFAULT 1,
    resit_cap_mark INT DEFAULT 40,
    board_deadline DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO programmes (code, title, y2_weight, y3_weight, resit_cap_enabled, resit_cap_mark, board_deadline) VALUES
('CSC7062', 'AI & Machine Learning', 0.30, 0.70, 1, 40, '2026-06-06'),
('CSC7063', 'Software Engineering',  0.50, 0.50, 0, 40, '2026-06-13');

CREATE TABLE officer_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    officer_id INT NOT NULL,
    programme_id INT NOT NULL,
    assigned_by INT NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (officer_id) REFERENCES users(id),
    FOREIGN KEY (programme_id) REFERENCES programmes(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id)
);

INSERT INTO officer_assignments (officer_id, programme_id, assigned_by, is_active) VALUES
(2, 1, 1, 1),
(3, 1, 1, 1),
(3, 2, 1, 1);

CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_number VARCHAR(20) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    programme_id INT NOT NULL,
    academic_year YEAR NOT NULL,
    has_mc TINYINT(1) DEFAULT 0,
    mc_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (programme_id) REFERENCES programmes(id)
);

INSERT INTO students (student_number, first_name, surname, programme_id, academic_year, has_mc, mc_notes) VALUES
('40182391', 'Emma',    'Walsh',    1, 2026, 0, NULL),
('40182392', 'Sarah',   'Connor',   1, 2026, 0, NULL),
('40182393', 'John',    'Murphy',   1, 2026, 0, NULL),
('40182394', 'Lisa',    'Park',     1, 2026, 0, NULL),
('40182395', 'Tom',     'Bradley',  2, 2026, 0, NULL),
('40182396', 'Rachel',  'Green',    2, 2026, 1, 'Student experienced bereavement in semester 1, impacting attendance and assessed work'),
('40182397', 'Michael', 'Chen',     2, 2026, 0, NULL),
('40182398', 'Sophie',  'Williams', 2, 2026, 0, NULL);

CREATE TABLE module_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    module_code VARCHAR(20) NOT NULL,
    module_name VARCHAR(255) NOT NULL,
    year_of_study INT NOT NULL,
    credits INT NOT NULL,
    mark DECIMAL(5,2) NOT NULL,
    is_resit TINYINT(1) DEFAULT 0,
    UNIQUE KEY unique_module (student_id, module_code, year_of_study),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

INSERT INTO module_results (student_id, module_code, module_name, year_of_study, credits, mark, is_resit) VALUES
(1, 'CSC0001', 'Introduction to Computing',  1, 20, 72.00, 0),
(1, 'CSC0002', 'Mathematics for Computing',  1, 20, 75.00, 0),
(1, 'CSC0003', 'Programming Fundamentals',   1, 20, 70.00, 0),
(1, 'CSC0004', 'Digital Systems',            1, 20, 68.00, 0),
(1, 'CSC0005', 'Professional Skills',        1, 20, 74.00, 0),
(1, 'CSC0006', 'Web Technologies',           1, 20, 71.00, 0),
(1, 'CSC1001', 'Databases 1',                2, 20, 72.00, 0),
(1, 'CSC1002', 'Algorithms and Data Structures', 2, 20, 68.00, 0),
(1, 'CSC1003', 'Software Engineering',       2, 20, 75.00, 0),
(1, 'CSC1004', 'Computer Networks',          2, 20, 70.00, 0),
(1, 'CSC1005', 'Operating Systems',          2, 20, 69.00, 0),
(1, 'CSC1006', 'Professional Development',   2, 20, 72.00, 0),
(1, 'CSC2001', 'Dissertation',               3, 40, 74.00, 0),
(1, 'CSC2002', 'Advanced Databases',         3, 20, 72.00, 0),
(1, 'CSC2003', 'Machine Learning',           3, 20, 70.00, 0),
(1, 'CSC2004', 'Cloud Computing',            3, 20, 75.00, 0),
(1, 'CSC2005', 'Research Methods',           3, 20, 73.00, 0);

INSERT INTO module_results (student_id, module_code, module_name, year_of_study, credits, mark, is_resit) VALUES
(2, 'CSC0001', 'Introduction to Computing',  1, 20, 65.00, 0),
(2, 'CSC0002', 'Mathematics for Computing',  1, 20, 68.00, 0),
(2, 'CSC0003', 'Programming Fundamentals',   1, 20, 64.00, 0),
(2, 'CSC0004', 'Digital Systems',            1, 20, 62.00, 0),
(2, 'CSC0005', 'Professional Skills',        1, 20, 66.00, 0),
(2, 'CSC0006', 'Web Technologies',           1, 20, 63.00, 0),
(2, 'CSC1001', 'Databases 1',                2, 20, 65.00, 0),
(2, 'CSC1002', 'Algorithms and Data Structures', 2, 20, 60.00, 0),
(2, 'CSC1003', 'Software Engineering',       2, 20, 68.00, 0),
(2, 'CSC1004', 'Computer Networks',          2, 20, 62.00, 0),
(2, 'CSC1005', 'Operating Systems',          2, 20, 60.00, 0),
(2, 'CSC1006', 'Professional Development',   2, 20, 63.00, 0),
(2, 'CSC2001', 'Dissertation',               3, 40, 67.00, 0),
(2, 'CSC2002', 'Advanced Databases',         3, 20, 65.00, 0),
(2, 'CSC2003', 'Machine Learning',           3, 20, 64.00, 0),
(2, 'CSC2004', 'Cloud Computing',            3, 20, 68.00, 0),
(2, 'CSC2005', 'Research Methods',           3, 20, 65.00, 0);

INSERT INTO module_results (student_id, module_code, module_name, year_of_study, credits, mark, is_resit) VALUES
(3, 'CSC0001', 'Introduction to Computing',  1, 20, 55.00, 0),
(3, 'CSC0002', 'Mathematics for Computing',  1, 20, 52.00, 0),
(3, 'CSC0003', 'Programming Fundamentals',   1, 20, 58.00, 0),
(3, 'CSC0004', 'Digital Systems',            1, 20, 50.00, 0),
(3, 'CSC0005', 'Professional Skills',        1, 20, 54.00, 0),
(3, 'CSC0006', 'Web Technologies',           1, 20, 53.00, 0),
(3, 'CSC1001', 'Databases 1',                2, 20, 55.00, 0),
(3, 'CSC1002', 'Algorithms and Data Structures', 2, 20, 50.00, 0),
(3, 'CSC1003', 'Software Engineering',       2, 20, 58.00, 0),
(3, 'CSC1004', 'Computer Networks',          2, 20, 52.00, 0),
(3, 'CSC1005', 'Operating Systems',          2, 20, 50.00, 0),
(3, 'CSC1006', 'Professional Development',   2, 20, 53.00, 0),
(3, 'CSC2001', 'Dissertation',               3, 40, 58.00, 0),
(3, 'CSC2002', 'Advanced Databases',         3, 20, 55.00, 0),
(3, 'CSC2003', 'Machine Learning',           3, 20, 75.00, 1),
(3, 'CSC2004', 'Cloud Computing',            3, 20, 56.00, 0),
(3, 'CSC2005', 'Research Methods',           3, 20, 58.00, 0);

INSERT INTO module_results (student_id, module_code, module_name, year_of_study, credits, mark, is_resit) VALUES
(4, 'CSC0001', 'Introduction to Computing',  1, 20, 45.00, 0),
(4, 'CSC0002', 'Mathematics for Computing',  1, 20, 42.00, 0),
(4, 'CSC0003', 'Programming Fundamentals',   1, 20, 48.00, 0),
(4, 'CSC0004', 'Digital Systems',            1, 20, 41.00, 0),
(4, 'CSC0005', 'Professional Skills',        1, 20, 44.00, 0),
(4, 'CSC0006', 'Web Technologies',           1, 20, 43.00, 0),
(4, 'CSC1001', 'Databases 1',                2, 20, 42.00, 0),
(4, 'CSC1002', 'Algorithms and Data Structures', 2, 20, 45.00, 0),
(4, 'CSC1003', 'Software Engineering',       2, 20, 40.00, 0),
(4, 'CSC1004', 'Computer Networks',          2, 20, 44.00, 0),
(4, 'CSC1005', 'Operating Systems',          2, 20, 43.00, 0),
(4, 'CSC1006', 'Professional Development',   2, 20, 44.00, 0),
(4, 'CSC2001', 'Dissertation',               3, 40, 47.00, 0),
(4, 'CSC2002', 'Advanced Databases',         3, 20, 45.00, 0),
(4, 'CSC2003', 'Machine Learning',           3, 20, 44.00, 0),
(4, 'CSC2004', 'Cloud Computing',            3, 20, 48.00, 0),
(4, 'CSC2005', 'Research Methods',           3, 20, 46.00, 0);

INSERT INTO module_results (student_id, module_code, module_name, year_of_study, credits, mark, is_resit) VALUES
(6, 'CSC0001', 'Introduction to Computing',  1, 20, 62.00, 0),
(6, 'CSC0002', 'Mathematics for Computing',  1, 20, 60.00, 0),
(6, 'CSC0003', 'Programming Fundamentals',   1, 20, 65.00, 0),
(6, 'CSC0004', 'Digital Systems',            1, 20, 58.00, 0),
(6, 'CSC0005', 'Professional Skills',        1, 20, 61.00, 0),
(6, 'CSC0006', 'Web Technologies',           1, 20, 63.00, 0),
(6, 'CSC1001', 'Databases 1',                2, 20, 60.00, 0),
(6, 'CSC1002', 'Algorithms and Data Structures', 2, 20, 58.00, 0),
(6, 'CSC1003', 'Software Engineering Principles', 2, 20, 62.00, 0),
(6, 'CSC1004', 'Computer Networks',          2, 20, 57.00, 0),
(6, 'CSC1005', 'Operating Systems',          2, 20, 59.00, 0),
(6, 'CSC1006', 'Professional Development',   2, 20, 60.00, 0),
(6, 'CSC2001', 'Dissertation',               3, 40, 61.00, 0),
(6, 'CSC2002', 'Advanced Topics in SE',      3, 20, 60.00, 0),
(6, 'CSC2003', 'Cloud Architecture',         3, 20, 59.00, 0),
(6, 'CSC2004', 'DevOps and CI/CD',           3, 20, 62.00, 0),
(6, 'CSC2005', 'Research Methods',           3, 20, 60.00, 0);

INSERT INTO module_results (student_id, module_code, module_name, year_of_study, credits, mark, is_resit) VALUES
(7, 'CSC0001', 'Introduction to Computing',  1, 20, 62.00, 0),
(7, 'CSC0002', 'Mathematics for Computing',  1, 20, 38.00, 0),
(7, 'CSC0003', 'Programming Fundamentals',   1, 20, 65.00, 0),
(7, 'CSC0004', 'Digital Systems',            1, 20, 60.00, 0),
(7, 'CSC0005', 'Professional Skills',        1, 20, 63.00, 0),
(7, 'CSC0006', 'Web Technologies',           1, 20, 61.00, 0),
(7, 'CSC1001', 'Databases 1',                2, 20, 68.00, 0),
(7, 'CSC1002', 'Algorithms and Data Structures', 2, 20, 72.00, 0),
(7, 'CSC1003', 'Software Engineering Principles', 2, 20, 70.00, 0),
(7, 'CSC1004', 'Computer Networks',          2, 20, 65.00, 0),
(7, 'CSC1005', 'Operating Systems',          2, 20, 68.00, 0),
(7, 'CSC1006', 'Professional Development',   2, 20, 66.00, 0),
(7, 'CSC2001', 'Dissertation',               3, 40, 70.00, 0),
(7, 'CSC2002', 'Advanced Topics in SE',      3, 20, 68.00, 0),
(7, 'CSC2003', 'Cloud Architecture',         3, 20, 72.00, 0),
(7, 'CSC2004', 'DevOps and CI/CD',           3, 20, 69.00, 0),
(7, 'CSC2005', 'Research Methods',           3, 20, 71.00, 0);

INSERT INTO module_results (student_id, module_code, module_name, year_of_study, credits, mark, is_resit) VALUES
(8, 'CSC0001', 'Introduction to Computing',  1, 20, 74.00, 0),
(8, 'CSC0002', 'Mathematics for Computing',  1, 20, 78.00, 0),
(8, 'CSC0003', 'Programming Fundamentals',   1, 20, 75.00, 0),
(8, 'CSC0004', 'Digital Systems',            1, 20, 72.00, 0),
(8, 'CSC0005', 'Professional Skills',        1, 20, 70.00, 0),
(8, 'CSC0006', 'Web Technologies',           1, 20, 76.00, 0),
(8, 'CSC1001', 'Databases 1',                2, 20, 72.00, 0),
(8, 'CSC1002', 'Algorithms and Data Structures', 2, 20, 74.00, 0),
(8, 'CSC1003', 'Software Engineering Principles', 2, 20, 70.00, 0),
(8, 'CSC1004', 'Computer Networks',          2, 20, 73.00, 0),
(8, 'CSC1005', 'Operating Systems',          2, 20, 71.00, 0),
(8, 'CSC1006', 'Professional Development',   2, 20, 72.00, 0),
(8, 'CSC2001', 'Dissertation',               3, 40, 75.00, 0),
(8, 'CSC2002', 'Advanced Topics in SE',      3, 20, 73.00, 0),
(8, 'CSC2003', 'Cloud Architecture',         3, 20, 71.00, 0),
(8, 'CSC2004', 'DevOps and CI/CD',           3, 20, 74.00, 0),
(8, 'CSC2005', 'Research Methods',           3, 20, 72.00, 0);

CREATE TABLE classification_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    programme_id INT NOT NULL,
    year2_average DECIMAL(5,2),
    year3_average DECIMAL(5,2),
    final_average DECIMAL(5,2),
    classification_code VARCHAR(10),
    classification_label VARCHAR(100),
    is_eligible TINYINT(1) DEFAULT 1,
    ineligibility_reason TEXT,
    boundary_flag TINYINT(1) DEFAULT 0,
    override_applied TINYINT(1) DEFAULT 0,
    override_rationale TEXT,
    override_by INT,
    override_at TIMESTAMP NULL,
    confirmed_by INT,
    confirmed_at TIMESTAMP NULL,
    rationale_log JSON,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_classification (student_id, programme_id),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (programme_id) REFERENCES programmes(id),
    FOREIGN KEY (override_by) REFERENCES users(id),
    FOREIGN KEY (confirmed_by) REFERENCES users(id)
);

INSERT INTO classification_results
(student_id, programme_id, year2_average, year3_average, final_average,
 classification_code, classification_label, is_eligible, ineligibility_reason,
 boundary_flag, override_applied, override_rationale, override_by, override_at,
 confirmed_by, confirmed_at, rationale_log, calculated_at)
VALUES (1, 1, 71.00, 73.00, 72.40, '1st', 'First Class Honours', 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL,
'[{"type":"ok","message":"Year 1: 120/120 credits passed"},{"type":"ok","message":"Year 2: 120/120 credits passed"},{"type":"ok","message":"Year 3: 120/120 credits passed"},{"type":"info","message":"Resit cap applied to 0 modules"},{"type":"info","message":"Year 2 average: 71.00%"},{"type":"info","message":"Year 3 average: 73.00%"},{"type":"info","message":"Final weighted average: 72.40% (Y2: 30%, Y3: 70%)"},{"type":"ok","message":"Classification: 1st - First Class Honours"}]',
'2026-04-09 09:00:00');

INSERT INTO classification_results
(student_id, programme_id, year2_average, year3_average, final_average,
 classification_code, classification_label, is_eligible, ineligibility_reason,
 boundary_flag, override_applied, override_rationale, override_by, override_at,
 confirmed_by, confirmed_at, rationale_log, calculated_at)
VALUES (2, 1, 63.00, 66.00, 65.10, '2:1', 'Upper Second Class Honours', 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL,
'[{"type":"ok","message":"Year 1: 120/120 credits passed"},{"type":"ok","message":"Year 2: 120/120 credits passed"},{"type":"ok","message":"Year 3: 120/120 credits passed"},{"type":"info","message":"Resit cap applied to 0 modules"},{"type":"info","message":"Year 2 average: 63.00%"},{"type":"info","message":"Year 3 average: 66.00%"},{"type":"info","message":"Final weighted average: 65.10% (Y2: 30%, Y3: 70%)"},{"type":"ok","message":"Classification: 2:1 - Upper Second Class Honours"}]',
'2026-04-09 09:00:00');

INSERT INTO classification_results
(student_id, programme_id, year2_average, year3_average, final_average,
 classification_code, classification_label, is_eligible, ineligibility_reason,
 boundary_flag, override_applied, override_rationale, override_by, override_at,
 confirmed_by, confirmed_at, rationale_log, calculated_at)
VALUES (3, 1, 53.00, 54.00, 53.70, '2:2', 'Lower Second Class Honours', 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL,
'[{"type":"ok","message":"Year 1: 120/120 credits passed"},{"type":"ok","message":"Year 2: 120/120 credits passed"},{"type":"ok","message":"Year 3: 120/120 credits passed"},{"type":"warn","message":"Resit cap applied: CSC2003 capped from 75.00 to 40.00"},{"type":"info","message":"Year 2 average: 53.00%"},{"type":"info","message":"Year 3 average: 54.00% (after resit cap)"},{"type":"info","message":"Final weighted average: 53.70% (Y2: 30%, Y3: 70%)"},{"type":"ok","message":"Classification: 2:2 - Lower Second Class Honours"}]',
'2026-04-09 09:00:00');

INSERT INTO classification_results
(student_id, programme_id, year2_average, year3_average, final_average,
 classification_code, classification_label, is_eligible, ineligibility_reason,
 boundary_flag, override_applied, override_rationale, override_by, override_at,
 confirmed_by, confirmed_at, rationale_log, calculated_at)
VALUES (4, 1, 43.00, 46.17, 45.22, '3rd', 'Third Class Honours', 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL,
'[{"type":"ok","message":"Year 1: 120/120 credits passed"},{"type":"ok","message":"Year 2: 120/120 credits passed"},{"type":"ok","message":"Year 3: 120/120 credits passed"},{"type":"info","message":"Resit cap applied to 0 modules"},{"type":"info","message":"Year 2 average: 43.00%"},{"type":"info","message":"Year 3 average: 46.17%"},{"type":"info","message":"Final weighted average: 45.22% (Y2: 30%, Y3: 70%)"},{"type":"ok","message":"Classification: 3rd - Third Class Honours"}]',
'2026-04-09 09:00:00');

INSERT INTO classification_results
(student_id, programme_id, year2_average, year3_average, final_average,
 classification_code, classification_label, is_eligible, ineligibility_reason,
 boundary_flag, override_applied, override_rationale, override_by, override_at,
 confirmed_by, confirmed_at, rationale_log, calculated_at)
VALUES (8, 2, 72.00, 73.33, 72.67, '1st', 'First Class Honours', 1, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL,
'[{"type":"ok","message":"Year 1: 120/120 credits passed"},{"type":"ok","message":"Year 2: 120/120 credits passed"},{"type":"ok","message":"Year 3: 120/120 credits passed"},{"type":"info","message":"Resit cap not enabled for this programme"},{"type":"info","message":"Year 2 average: 72.00%"},{"type":"info","message":"Year 3 average: 73.33%"},{"type":"info","message":"Final weighted average: 72.67% (Y2: 50%, Y3: 50%)"},{"type":"ok","message":"Classification: 1st - First Class Honours"}]',
'2026-04-09 09:00:00');

