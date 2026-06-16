import express from 'express';
import axios from 'axios';
import session from 'express-session';
import dotenv from 'dotenv';
dotenv.config();

const web = express();
const PORT = process.env.WEB_PORT;

web.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    rolling: true,
    saveUninitialized: false,
    cookie: {
        secure: false, // HTTP 
        maxAge: 1000 * 60 * 60 // 1 hour

    }
}));

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

web.set("view engine", "ejs");
web.set("views", path.join(__dirname, "views"));

//middleware
web.use(express.static(path.join(__dirname, "/public")));
web.use(express.urlencoded({ extended: true }));

web.use((req, res, next) => {
    res.locals.user = req.session.user || null;

    if (req.session.user && req.session.user.role === 'officer') {
        if (!req.session.activeProgrammeId && req.session.user.assignments.length > 0) {
            req.session.activeProgrammeId = req.session.user.assignments[0].programme_id;
        }
        res.locals.activeProgrammeId = req.session.activeProgrammeId;
    }

    next();
});

// Authentication and role-based access middleware

const isAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

const isAdmin = (req, res, next) => {
    if (req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    next();
};

const isOfficer = (req, res, next) => {
    if (req.session.user.role !== 'officer') {
        return res.redirect('/login');
    }
    next();
};


// Routes

web.get("/", (req, res) => {
    res.redirect("/login");
});

// User login functions as the web landing page if not logged in. so root redirects to it.
web.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Handle login form submission to auth via API

web.post('/login', async (req, res) => {

    const { email, password } = req.body;

    try {
        const authResult = await axios.post(`${process.env.API_URL}/login`, { email, password });

        req.session.user = authResult.data.user;

        if (authResult.data.user.role === 'admin') {

            res.redirect('/admin/dashboard');
        } else if (authResult.data.user.role === 'officer') {

            res.redirect('/officer/dashboard');
        } else {

            res.status(403).send('Access denied');
        }
    } catch (error) {
        console.error('Login error:', error.message);
        res.render('login', { error: 'Invalid email or password' });
    }
});

// Dashboard route that redirects users to their respective dashboards based on role

web.get('/dashboard', isAuthenticated, (req, res) => {

    if (req.session.user.role === 'admin') {
        res.redirect('/admin/dashboard');
    } else if (req.session.user.role === 'officer') {
        res.redirect('/officer/dashboard');
    } else {
        res.status(403).send('Access denied');
    }
});

// Admin dashboard routes

web.get('/admin/dashboard', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const dashboardResult = await axios.get(`${process.env.API_URL}/admin/stats`);
        res.render('admin/dashboard', { stats: dashboardResult.data });
    } catch (error) {
        console.error('Error fetching admin stats:', error.message);
        res.render('admin/dashboard', {
            stats: {
                totalProgrammes: 0,
                totalOfficers: 0,
                totalStudents: 0,
                activeAssignments: 0
            }
        });
    }
});

web.get('/admin/officers', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const response = await axios.get(`${process.env.API_URL}/officers`);
        const officerData = response.data.officers;
        res.render('admin/officers', { officers: officerData });
    } catch (error) {
        console.error('Error fetching officers:', error.message);
        res.status(500).send('Error fetching officers');
    }
});

web.get('/admin/officers/new', isAuthenticated, isAdmin, (req, res) => {
    res.render('admin/officers-add-new', { error: null });
});

web.post('/admin/officers', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { email, first_name, surname, password } = req.body;

        if (!email || !first_name || !surname || !password) {
            return res.render('admin/officers-add-new', { error: 'All fields are required' });
        };

        if (password.length < 8) {
            return res.render('admin/officers-add-new', { error: 'Password must be at least 8 characters' });
        };

        await axios.post(`${process.env.API_URL}/officers`, req.body);

        res.redirect('/admin/officers');
    } catch (error) {
        console.error('Error creating officer:', error.message);
        res.render('admin/officers-add-new', { error: 'Error creating officer' });
    }
});

web.get('/admin/officers/:id/edit', isAuthenticated, isAdmin, async (req, res) => {
    const officerId = req.params.id;
    try {
        const editResponse = await axios.get(`${process.env.API_URL}/officers/${officerId}`);
        res.render('admin/officers-edit', { officer: editResponse.data.officer, error: null });
    } catch (error) {
        console.error('Error fetching officer:', error.message);
        res.redirect('/admin/officers');
    }
});

web.post('/admin/officers/:id/edit', isAuthenticated, isAdmin, async (req, res) => {
    const { email, first_name, surname } = req.body;
    const officerId = req.params.id;

    if (!email || !first_name || !surname) {
        return res.render('admin/officers-edit', {
            officer: { id: officerId, email, first_name, surname },
            error: 'All fields are required'
        });
    };

    try {
        await axios.post(`${process.env.API_URL}/officers/${officerId}/edit`, req.body);
        res.redirect('/admin/officers');

    } catch (error) {
        console.error('Error updating officer:', error.message);
        res.render('admin/officers-edit', { officer: { id: officerId, email, first_name, surname }, error: 'Error updating officer' });
    }
});

web.post('/admin/officers/:id/deactivate', isAuthenticated, isAdmin, async (req, res) => {
    const officerId = req.params.id;
    try {
        await axios.post(`${process.env.API_URL}/officers/${officerId}/deactivate`);
        res.redirect('/admin/officers');
    } catch (error) {
        console.error('Error deactivating officer:', error.message);
        res.redirect('/admin/officers');
    }
});

web.post('/admin/officers/:id/reactivate', isAuthenticated, isAdmin, async (req, res) => {
    const officerId = req.params.id;
    try {
        await axios.post(`${process.env.API_URL}/officers/${officerId}/reactivate`);
        res.redirect('/admin/officers');
    } catch (error) {
        console.error('Error reactivating officer:', error.message);
        res.redirect('/admin/officers');
    }
});

web.get('/admin/programmes', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const response = await axios.get(`${process.env.API_URL}/programmes`);
        const programmeData = response.data.programmes;
        res.render('admin/programmes', { programmes: programmeData });
    } catch (error) {
        console.error('Error fetching programmes:', error.message);
        res.status(500).send('Error fetching programmes');
    }
});

web.get('/admin/programmes-new', isAuthenticated, isAdmin, (req, res) => {
    res.render('admin/programmes-new', { error: null });
});

web.post('/admin/programmes', isAuthenticated, isAdmin, async (req, res) => {

    const { code, title, y2_weight, y3_weight, resit_cap_enabled, resit_cap_mark, board_deadline } = req.body;
    if (!code || !title || !y2_weight || !y3_weight || !resit_cap_enabled || !resit_cap_mark || !board_deadline) {
        return res.render('admin/programmes-new', { error: 'All fields are required' });
    };

    try {
        await axios.post(`${process.env.API_URL}/programmes`, req.body);

        res.redirect('/admin/programmes');
    } catch (error) {
        console.error('Error creating programme:', error.message);
        res.render('admin/programmes-new', { error: 'Error creating programme' });
    }
});

web.get('/admin/programmes/:id/edit', isAuthenticated, isAdmin, async (req, res) => {
    const programmeId = req.params.id;
    try {
        const editResponse = await axios.get(`${process.env.API_URL}/programmes/${programmeId}`);
        res.render('admin/programmes-edit', { programme: editResponse.data.programme, error: null });
    } catch (error) {
        console.error('Error fetching programme:', error.message);
        res.redirect('/admin/programmes');
    }
});

web.post('/admin/programmes/:id/edit', isAuthenticated, isAdmin, async (req, res) => {
    const { code, title, y2_weight, y3_weight, resit_cap_enabled, resit_cap_mark, board_deadline } = req.body;
    const programmeId = req.params.id;

    if (!code || !title || !y2_weight || !y3_weight || !resit_cap_enabled || !resit_cap_mark || !board_deadline) {
        return res.render('admin/programmes-edit', { programme: { id: programmeId, code, title, y2_weight, y3_weight, resit_cap_enabled, resit_cap_mark, board_deadline }, error: 'All fields are required' });
    };

    try {
        await axios.post(`${process.env.API_URL}/programmes/${programmeId}/edit`, req.body);
        res.redirect('/admin/programmes');
    } catch (error) {
        console.error('Error updating programme:', error.message);
        res.render('admin/programmes-edit', { programme: { id: programmeId, code, title, y2_weight, y3_weight, resit_cap_enabled, resit_cap_mark, board_deadline }, error: 'Error updating programme' });
    }
});

web.get('/admin/assignments', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const response = await axios.get(`${process.env.API_URL}/assignments`);
        const assignmentData = response.data.assignments;
        res.render('admin/assignments', { assignments: assignmentData });
    } catch (error) {
        console.error('Error fetching assignments:', error.message);
        res.render('admin/assignments', { assignments: [] });
    }
});

web.get('/admin/assignments-new', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const response = await axios.get(`${process.env.API_URL}/assignments/form-data`);
        const { officers, programmes } = response.data;
        res.render('admin/assignments-new', { officers, programmes, error: null });
    } catch (error) {
        console.error('Error fetching form data:', error.message);
        res.render('admin/assignments-new', {
            officers: [],
            programmes: [],
            error: 'Error fetching form data'
        });
    }
});

web.post('/admin/assignments', isAuthenticated, isAdmin, async (req, res) => {
    const { officer_id, programme_id } = req.body;

    if (!officer_id || !programme_id) {
        const formDataResponse = await axios.get(`${process.env.API_URL}/assignments/form-data`);
        return res.render('admin/assignments-new', {
            officers: formDataResponse.data.officers,
            programmes: formDataResponse.data.programmes,
            error: 'All fields are required'
        });
    };

    try {
        await axios.post(`${process.env.API_URL}/assignments`, { officer_id, programme_id, assigned_by: req.session.user.id });

        res.redirect('/admin/assignments');
    } catch (error) {
        console.error('Error creating assignment:', error.message);
        const errorMessage = error.response && error.response.data && error.response.data.error
            ? error.response.data.error
            : 'Error creating assignment';

        const formDataResponse = await axios.get(`${process.env.API_URL}/assignments/form-data`);
        res.render('admin/assignments-new', {
            officers: formDataResponse.data.officers,
            programmes: formDataResponse.data.programmes,
            error: errorMessage
        });
    }
});

web.post('/admin/assignments/:id/remove', isAuthenticated, isAdmin, async (req, res) => {
    const assignmentId = req.params.id;
    try {
        await axios.post(`${process.env.API_URL}/assignments/${assignmentId}/remove`);
        res.redirect('/admin/assignments');

    } catch (error) {
        console.error('Error removing assignment:', error.message);
        res.redirect('/admin/assignments');
    }
});



// Officer dashboard routes 

web.get('/officer/dashboard', isAuthenticated, isOfficer, async (req, res) => {

    const assignments = req.session.user.assignments;

    if (!req.session.user.assignments || req.session.user.assignments.length === 0) {
        return res.render('officer/dashboard', {
            programme: null,
            error: 'You have no active programme assignments. Please contact administrator.'
        });
    }

    const programmeId = req.session.activeProgrammeId || req.session.user.assignments[0].programme_id;
    const programme = assignments.find(a => a.programme_id === programmeId) || assignments[0];

    try {
        const dashboardResult = await axios.get(`${process.env.API_URL}/officer/stats/${programme.programme_id}`);
        res.render('officer/dashboard', {
            programme: programme,
            stats: dashboardResult.data,
            error: null
        });

    } catch (error) {
        console.error('Error fetching officer dashboard data:', error.message);
        return res.render('officer/dashboard', {
            programme: null,
            stats: null,
            error: 'Error loading dashboard data'
        });
    }

});

web.post('/officer/select-programme', isAuthenticated, isOfficer, (req, res) => {
    const { programme_id } = req.body;
    const isAssigned = req.session.user.assignments.some(
        a => parseInt(a.programme_id) === parseInt(programme_id)
    );
    if (!isAssigned) {
        return res.redirect('/officer/dashboard');
    }
    req.session.activeProgrammeId = parseInt(programme_id);
    res.redirect('/officer/dashboard');
});

web.get('/officer/students/export', isAuthenticated, isOfficer, async (req, res) => {

    if (!req.session.user.assignments || req.session.user.assignments.length === 0) {
        return res.render('officer/dashboard', {
            students: [],
            assignments: [],
            programmeId: null,
            error: 'You have no active programme assignments. Please contact administrator.'
        });
    }
    const assignments = req.session.user.assignments;
    const programmeId = req.query.programme || req.session.activeProgrammeId || req.session.user.assignments[0].programme_id;

    try {
        const isAssigned = req.session.user.assignments.some(
            a => parseInt(a.programme_id) === parseInt(programmeId));

        if (!isAssigned) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to programme ${programmeId}`);
            return res.redirect('/officer/dashboard');
        }

        const exportResponse = await axios.get(`${process.env.API_URL}/officer/students/export/${programmeId}`);

        const { programme, students } = exportResponse.data;

        if (!students || students.length === 0) {
            return res.render('officer/dashboard', {
                programme: programme,
                stats: null,
                error: 'No students found for this programme'
            });
        }

        const lines = [];
        lines.push('HEdClass Export');
        lines.push(`Programme: ${programme.code} - ${programme.title}`);
        lines.push(`Export Date: ${new Date().toLocaleDateString('en-GB')}`);
        lines.push(`Officer: ${req.session.user.first_name} ${req.session.user.surname}`);
        lines.push(`Total Confirmed Students: ${students.length}`);
        lines.push('');
        lines.push('Student Number,First Name,Surname,Final Average,Classification,Ineligibility Reason,Classification Override Applied,Override Rationale, Confirmed Date');

        students.forEach(s => {
            lines.push([
                s.student_number,
                `${s.first_name}`,
                `${s.surname}`,
                s.final_average ? parseFloat(s.final_average).toFixed(2) : 'N/A',
                s.classification_code || 'Ineligible',
                s.ineligibility_reason || '',
                s.override_applied ? 'Yes' : 'No',
                s.override_rationale ? `${s.override_rationale}` : '',
                new Date(s.confirmed_at).toLocaleDateString('en-GB')
            ].join(','));
        });

        res.setHeader('Content-Disposition', `attachment; filename="HEdClass Export - ${programme.code} ${programme.title} - ${new Date().toLocaleDateString('en-GB')}.csv"`);
        res.setHeader('Content-Type', 'text/csv');

        const csvData = lines.join('\n');
        res.send(csvData);

    } catch (error) {
        console.error('Error exporting students:', error.message);
        res.redirect(`/officer/students?programme=${programmeId}`);
    }
});

web.get('/officer/students', isAuthenticated, isOfficer, async (req, res) => {

    if (!req.session.user.assignments || req.session.user.assignments.length === 0) {
        return res.render('officer/students', {
            students: [],
            assignments: [],
            programmeId: null,
            error: 'You have no active programme assignments. Please contact administrator.'
        });
    }
    const assignments = req.session.user.assignments;
    const programmeId = req.query.programme || req.session.activeProgrammeId || req.session.user.assignments[0].programme_id;

    try {
        const isAssigned = req.session.user.assignments.some(
            a => parseInt(a.programme_id) === parseInt(programmeId));

        if (!isAssigned) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to programme ${programmeId}`);
            return res.redirect('/officer/dashboard');
        }

        const studentsResult = await axios.get(`${process.env.API_URL}/officer/students/programme/${programmeId}`);
        res.render('officer/students', {
            students: studentsResult.data.students,
            assignments: assignments,
            programmeId: programmeId,
            error: null
        });
    } catch (error) {
        console.error('Error fetching students:', error.message);
        res.render('officer/students', {
            students: [],
            assignments,
            programmeId: programmeId,
            error: 'Error fetching students'
        });
    }
});

web.get('/officer/students/new', isAuthenticated, isOfficer, async (req, res) => {
    if (!req.session.user.assignments || req.session.user.assignments.length === 0) {
        return res.render('officer/dashboard', {
            error: 'You have no active programme assignments. Please contact administrator.'
        });
    }

    const programmeId = req.query.programme || req.session.activeProgrammeId || req.session.user.assignments[0].programme_id;

    try {
        const isAssigned = req.session.user.assignments.some(
            a => parseInt(a.programme_id) === parseInt(programmeId));

        if (!isAssigned) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to programme ${programmeId}`);
            return res.redirect('/officer/dashboard');
        }

        res.render('officer/students-new', {
            programmeId,
            error: null
        });
    } catch (error) {
        console.error('Error fetching form data:', error.message);
        res.render('officer/students-new', {
            programmeId: null,
            error: 'Error fetching form data'
        });
    }

});

web.post('/officer/students/new', isAuthenticated, isOfficer, async (req, res) => {
    const programmeId = req.query.programme || req.session.activeProgrammeId || req.session.user.assignments[0].programme_id;
    const { student_number, first_name, surname, academic_year, has_mc, mc_notes, programme_id } = req.body;

    if (!student_number || !first_name || !surname || !academic_year || !programme_id) {
        return res.render('officer/students-new', {
            programmeId: programme_id,
            error: 'All fields except mitigating circumstances notes are required'
        });
    };

    try {
        const isAssigned = req.session.user.assignments.some(
            a => parseInt(a.programme_id) === parseInt(programmeId));

        if (!isAssigned) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to programme ${programmeId}`);
            return res.redirect('/officer/dashboard');
        }

        await axios.post(`${process.env.API_URL}/officer/students`, req.body);
        res.redirect(`/officer/students?programme=${programme_id}`);
    } catch (error) {
        console.error('Error creating student:', error.message);
        const errorMessage = error.response && error.response.data && error.response.data.error
            ? error.response.data.error
            : 'Error creating student';

        res.render('officer/students-new', {
            programmeId: programme_id,
            error: errorMessage
        });
    }
});

web.get('/officer/students/:id', isAuthenticated, isOfficer, async (req, res) => {
    const studentId = req.params.id;
    const programmeId = req.query.programme || req.session.activeProgrammeId || req.session.user.assignments[0].programme_id;

    try {
        const studentDetails = await axios.get(`${process.env.API_URL}/officer/students/${studentId}`);
        const student = studentDetails.data.student;

        const isAssigned = req.session.user.assignments.some(
            a => parseInt(a.programme_id) === parseInt(student.programme_id));

        if (!isAssigned) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to student ${studentId}`);
            return res.redirect('/officer/dashboard');
        }

        res.render('officer/student-details', {
            student: studentDetails.data.student,
            modules: studentDetails.data.modules,
            classification: studentDetails.data.classification || null,
            programmeId,
            error: null
        });
    } catch (error) {
        console.error('Error fetching student details:', error.message);
        res.render('officer/student-details', {
            student: null,
            modules: [],
            classification: null,
            programmeId,
            error: 'Error fetching student details'
        });
    }
});

web.get('/officer/students/:id/edit', isAuthenticated, isOfficer, async (req, res) => {
    const studentId = req.params.id;
    const programmeId = req.query.programme || req.session.activeProgrammeId || req.session.user.assignments[0].programme_id;

    try {
        const studentDetails = await axios.get(`${process.env.API_URL}/officer/students/${studentId}`);
        const student = studentDetails.data.student;

        const isAssigned = req.session.user.assignments.some(
            a => parseInt(a.programme_id) === parseInt(student.programme_id));

        if (!isAssigned) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to edit student ${studentId}`);
            return res.redirect('/officer/dashboard');
        }

        res.render('officer/student-edit', {
            student: studentDetails.data.student,
            programmeId,
            error: null
        });
    } catch (error) {
        console.error('Error fetching student details for edit:', error.message);
        res.render('officer/student-edit', {
            student: null,
            programmeId,
            error: 'Error fetching student details'
        });
    }
});

web.post('/officer/students/:id/edit', isAuthenticated, isOfficer, async (req, res) => {
    const studentId = req.params.id;
    const programmeId = req.query.programme || req.session.activeProgrammeId || req.session.user.assignments[0].programme_id;
    try {
        const studentDetails = await axios.get(`${process.env.API_URL}/officer/students/${studentId}`);
        const student = studentDetails.data.student;

        const isAssigned = req.session.user.assignments.some(
            a => parseInt(a.programme_id) === parseInt(student.programme_id));

        if (!isAssigned) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to edit student ${studentId}`);
            return res.redirect('/officer/dashboard');
        }

        await axios.post(`${process.env.API_URL}/officer/students/${studentId}/edit`, req.body);
        res.redirect(`/officer/students/${studentId}?programme=${programmeId}`);

    } catch (error) {
        console.error('Error updating student:', error.message);
        const errorMessage = error.response && error.response.data && error.response.data.error
            ? error.response.data.error
            : 'Error updating student';

        res.render('officer/student-edit', {
            student: {
                id: studentId,
                student_number: req.body.student_number,
                first_name: req.body.first_name,
                surname: req.body.surname,
                academic_year: req.body.academic_year,
                has_mc: req.body.has_mc,
                mc_notes: req.body.mc_notes
            },
            programmeId,
            error: errorMessage
        });
    }
});

web.post('/officer/students/:id/delete', isAuthenticated, isOfficer, async (req, res) => {
    const studentId = req.params.id;
    const programmeId = req.query.programme || req.session.activeProgrammeId || req.session.user.assignments[0].programme_id;

    try {
        const studentDetails = await axios.get(`${process.env.API_URL}/officer/students/${studentId}`);
        const student = studentDetails.data.student;

        const isAssigned = req.session.user.assignments.some(
            a => parseInt(a.programme_id) === parseInt(student.programme_id));

        if (!isAssigned) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to delete student ${studentId}`);
            return res.redirect('/officer/dashboard');
        }

        await axios.post(`${process.env.API_URL}/officer/students/${studentId}/delete`);
        res.redirect(`/officer/students?programme=${programmeId}`);
    } catch (error) {
        console.error('Error deleting student:', error.message);
        res.redirect(`/officer/students/${studentId}?programme=${programmeId}`);
    }
});

web.get('/officer/students/:id/modules/new', isAuthenticated, isOfficer, async (req, res) => {
    const studentId = req.params.id;
    const programmeId = req.query.programme || req.session.activeProgrammeId || req.session.user.assignments[0].programme_id;
    try {
        const studentDetails = await axios.get(`${process.env.API_URL}/officer/students/${studentId}`);
        const student = studentDetails.data.student;

        const isAssigned = req.session.user.assignments.some(
            a => parseInt(a.programme_id) === parseInt(student.programme_id));

        if (!isAssigned) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to add module for student ${studentId}`);
            return res.redirect('/officer/dashboard');
        }

        res.render('officer/modules-new', {
            student: student,
            programmeId,
            error: null
        });
    } catch (error) {
        console.error('Error fetching student details for adding module:', error.message);
        res.render('officer/modules-new', {
            student: null,
            programmeId,
            error: 'Error fetching student details'
        });
    }
});

web.post('/officer/students/:id/modules', isAuthenticated, isOfficer, async (req, res) => {
    const studentId = req.params.id;
    const programmeId = req.query.programme || req.session.activeProgrammeId || req.session.user.assignments[0].programme_id;

    const { module_code, module_name, year_of_study, credits, mark } = req.body;


    let studentDetails;
    try {
        studentDetails = await axios.get(`${process.env.API_URL}/officer/students/${studentId}`);
        const student = studentDetails.data.student;

        const isAssigned = req.session.user.assignments.some(
            a => parseInt(a.programme_id) === parseInt(student.programme_id));

        if (!isAssigned) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to add module for student ${studentId}`);
            return res.redirect('/officer/dashboard');
        }

        if (!module_code || !module_name || !year_of_study || !credits || !mark) {
            return res.render('officer/modules-new', {
                student: { id: studentId },
                programmeId,
                error: 'All fields are required'
            });
        };

        if (mark < 0 || mark > 100) {
            return res.render('officer/modules-new', {
                student: { id: studentId },
                programmeId,
                error: 'Mark must be between 0 and 100'
            });
        };

        await axios.post(`${process.env.API_URL}/officer/students/${studentId}/modules`, req.body);
        res.redirect(`/officer/students/${studentId}?programme=${programmeId}`);
    } catch (error) {
        console.error('Error adding module:', error.message);
        const errorMessage = error.response && error.response.data && error.response.data.error
            ? error.response.data.error
            : 'Error adding module';

        res.render('officer/modules-new', {
            student: studentDetails ? studentDetails.data.student : { id: studentId },
            programmeId,
            error: errorMessage
        });
    }
});

web.get('/officer/students/:id/modules/:moduleId/edit', isAuthenticated, isOfficer, async (req, res) => {
    const studentId = req.params.id;
    const moduleId = req.params.moduleId;
    const programmeId = req.query.programme || req.session.activeProgrammeId || req.session.user.assignments[0].programme_id;

    let studentDetails;
    try {
        studentDetails = await axios.get(`${process.env.API_URL}/officer/students/${studentId}`);
        const student = studentDetails.data.student;

        const isAssigned = req.session.user.assignments.some(
            a => parseInt(a.programme_id) === parseInt(student.programme_id));

        if (!isAssigned) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to edit module for student ${studentId}`);
            return res.redirect('/officer/dashboard');
        }

        const moduleDetails = await axios.get(`${process.env.API_URL}/officer/students/${studentId}/modules/${moduleId}`);

        res.render('officer/modules-edit', {
            student: student,
            module: moduleDetails.data.module,
            programmeId,
            error: null
        });
    } catch (error) {
        console.error('Error fetching module details for edit:', error.message);
        res.render('officer/modules-edit', {
            student: studentDetails ? studentDetails.data.student : { id: studentId },
            module: null,
            programmeId,
            error: 'Error fetching module details'
        });
    }
});

web.post('/officer/students/:id/modules/:moduleId/edit', isAuthenticated, isOfficer, async (req, res) => {
    const studentId = req.params.id;
    const moduleId = req.params.moduleId;
    const programmeId = req.query.programme || req.session.activeProgrammeId || req.session.user.assignments[0].programme_id;

    let studentDetails;
    try {
        studentDetails = await axios.get(`${process.env.API_URL}/officer/students/${studentId}`);
        const student = studentDetails.data.student;

        const isAssigned = req.session.user.assignments.some(
            a => parseInt(a.programme_id) === parseInt(student.programme_id));

        if (!isAssigned) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to edit module for student ${studentId}`);
            return res.redirect('/officer/dashboard');
        }

        await axios.post(`${process.env.API_URL}/officer/students/${studentId}/modules/${moduleId}/edit`, req.body);
        res.redirect(`/officer/students/${studentId}?programme=${programmeId}`);
    } catch (error) {
        console.error('Error updating module:', error.message);
        const errorMessage = error.response && error.response.data && error.response.data.error
            ? error.response.data.error
            : 'Error updating module';

        res.render('officer/modules-edit', {
            student: studentDetails ? studentDetails.data.student : { id: studentId },
            module: {
                id: moduleId,
                module_code: req.body.module_code,
                module_name: req.body.module_name,
                credits: req.body.credits,
                level: req.body.level,
                mark: req.body.mark
            },
            programmeId,
            error: errorMessage
        });
    }
});

web.post('/officer/students/:id/classify', isAuthenticated, isOfficer, async (req, res) => {
    const studentId = req.params.id;
    const programmeId = req.query.programme || req.session.activeProgrammeId || req.session.user.assignments[0].programme_id;

    let studentDetails;
    try {
        studentDetails = await axios.get(`${process.env.API_URL}/officer/students/${studentId}`);
        const student = studentDetails.data.student;

        const isAssigned = req.session.user.assignments.some(
            a => parseInt(a.programme_id) === parseInt(student.programme_id));

        if (!isAssigned) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to programme ${programmeId}`);
            return res.redirect('/officer/dashboard');
        }

        await axios.post(`${process.env.API_URL}/officer/students/${studentId}/classify`, { programme_id: programmeId });
        res.redirect(`/officer/students/${studentId}?programme=${programmeId}`);
    } catch (error) {
        console.error('Error calculating classification:', error.message);
        res.redirect(`/officer/students/${studentId}?programme=${programmeId}`);
    }
});

web.post('/officer/students/:id/classify/override', isAuthenticated, isOfficer, async (req, res) => {
    const studentId = req.params.id;
    const programmeId = req.query.programme || req.session.activeProgrammeId || req.session.user.assignments[0].programme_id;
    const { classification_code, classification_label, override_rationale } = req.body;

    if (!override_rationale) {
        return res.redirect(`/officer/students/${studentId}?programme=${programmeId}&error=Override rationale is required`);
    }

    let studentDetails;
    try {
        studentDetails = await axios.get(`${process.env.API_URL}/officer/students/${studentId}`);
        const student = studentDetails.data.student;
        const isAssigned = req.session.user.assignments.some(
            a => parseInt(a.programme_id) === parseInt(student.programme_id));

        if (!isAssigned) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to override classification for student ${studentId}`);
            return res.redirect('/officer/dashboard');
        }

        await axios.post(`${process.env.API_URL}/officer/students/${studentId}/classify/override`, {
            classification_code,
            override_rationale,
            override_by: req.session.user.id
        });

        res.redirect(`/officer/students/${studentId}?programme=${programmeId}`);
    } catch (error) {
        console.error('Error overriding classification:', error.message);
        const errorMessage = error.response && error.response.data && error.response.data.error
            ? error.response.data.error
            : 'Error overriding classification';
        res.redirect(`/officer/students/${studentId}?programme=${programmeId}&error=${encodeURIComponent(errorMessage)}`);
    }

});

web.get('/officer/students/:id/classify/override', isAuthenticated, isOfficer, async (req, res) => {
    const studentId = req.params.id;
    const programmeId = req.query.programme || req.session.activeProgrammeId || req.session.user.assignments[0].programme_id;

    let studentDetails;
    try {
        studentDetails = await axios.get(`${process.env.API_URL}/officer/students/${studentId}`);
        const student = studentDetails.data.student;
        const classification = studentDetails.data.classification;

        const isAssigned = req.session.user.assignments.some(
            a => parseInt(a.programme_id) === parseInt(student.programme_id));

        if (!isAssigned) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to access classification override for student ${studentId}`);
            return res.redirect('/officer/dashboard');
        }

        if (!classification) {
            return res.redirect(`/officer/students/${studentId}?programme=${programmeId}`);
        }

        res.render('officer/classify-override', {
            student: student,
            classification: classification,
            programmeId,
            error: null
        });
    } catch (error) {
        console.error('Error fetching student details for classification override:', error.message);
        res.render('officer/classify-override', {
            student: null,
            classification: null,
            programmeId,
            error: 'Error fetching student details'
        });
    }
});

web.post('/officer/students/:id/classify/confirm', isAuthenticated, isOfficer, async (req, res) => {
    const studentId = req.params.id;
    const programmeId = req.query.programme || req.session.activeProgrammeId || req.session.user.assignments[0].programme_id;
    const { confirmed_by } = req.body;

    let studentDetails;
    try {
        studentDetails = await axios.get(`${process.env.API_URL}/officer/students/${studentId}`);
        const student = studentDetails.data.student;
        const classification = studentDetails.data.classification;

        const isAssigned = req.session.user.assignments.some(
            a => parseInt(a.programme_id) === parseInt(student.programme_id));

        if (!isAssigned) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to confirm classification for student ${studentId}`);
            return res.redirect('/officer/dashboard');
        }

        if (!classification) {
            return res.redirect(`/officer/students/${studentId}?programme=${programmeId}`);
        }

        await axios.post(`${process.env.API_URL}/officer/students/${studentId}/classify/confirm`, {
            confirmed_by: req.session.user.id
        });

        res.redirect(`/officer/students/${studentId}?programme=${programmeId}`);
    } catch (error) {
        console.error('Error confirming classification:', error.message);
        const errorMessage = error.response && error.response.data && error.response.data.error
            ? error.response.data.error
            : 'Error confirming classification';
        res.redirect(`/officer/students/${studentId}?programme=${programmeId}&error=${encodeURIComponent(errorMessage)}`);
    }
});

web.post('/officer/students/:id/classify/remove', isAuthenticated, isOfficer, async (req, res) => {
    const studentId = req.params.id;
    const programmeId = req.query.programme || req.session.activeProgrammeId || req.session.user.assignments[0].programme_id;

    let studentDetails;
    try {
        studentDetails = await axios.get(`${process.env.API_URL}/officer/students/${studentId}`);
        const student = studentDetails.data.student;
        const classification = studentDetails.data.classification;

        const isAssigned = req.session.user.assignments.some(
            a => parseInt(a.programme_id) === parseInt(student.programme_id));

        if (!isAssigned) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to remove classification for student ${studentId}`);
            return res.redirect('/officer/dashboard');
        }

        if (!classification) {
            return res.redirect(`/officer/students/${studentId}?programme=${programmeId}`);
        }

        await axios.post(`${process.env.API_URL}/officer/students/${studentId}/classify/remove`);

        res.redirect(`/officer/students/${studentId}?programme=${programmeId}`);
    } catch (error) {
        console.error('Error removing classification:', error.message);
        const errorMessage = error.response && error.response.data && error.response.data.error
            ? error.response.data.error
            : 'Error removing classification';
        res.redirect(`/officer/students/${studentId}?programme=${programmeId}&error=${encodeURIComponent(errorMessage)}`);
    }
});

web.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');

});



web.listen(PORT, (err) => {
    console.log(`listening on port http://localhost:${PORT}`);
});