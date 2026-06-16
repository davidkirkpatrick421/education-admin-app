import apiClient from '../apiClient.js';
import { resolveProgrammeId, isAssignedToProgramme, apiErrorMessage } from '../lib/officerContext.js';

// GET /officer/dashboard
export async function dashboard(req, res) {
    const assignments = req.session.user.assignments;

    if (!assignments || assignments.length === 0) {
        return res.render('officer/dashboard', {
            programme: null,
            error: 'You have no active programme assignments. Please contact administrator.'
        });
    }

    const programmeId = req.session.activeProgrammeId || assignments[0].programme_id;
    const programme = assignments.find(a => a.programme_id === programmeId) || assignments[0];

    try {
        const dashboardResult = await apiClient.get(`/officer/stats/${programme.programme_id}`);
        res.render('officer/dashboard', { programme, stats: dashboardResult.data, error: null });
    } catch (error) {
        console.error('Error fetching officer dashboard data:', error.message);
        res.render('officer/dashboard', { programme: null, stats: null, error: 'Error loading dashboard data' });
    }
}

// POST /officer/select-programme
export function selectProgramme(req, res) {
    const { programme_id } = req.body;
    if (!isAssignedToProgramme(req, programme_id)) {
        return res.redirect('/officer/dashboard');
    }
    req.session.activeProgrammeId = parseInt(programme_id);
    res.redirect('/officer/dashboard');
}

// GET /officer/students/export — CSV download of confirmed classifications.
export async function exportStudents(req, res) {
    if (!req.session.user.assignments || req.session.user.assignments.length === 0) {
        return res.render('officer/dashboard', {
            students: [], assignments: [], programmeId: null,
            error: 'You have no active programme assignments. Please contact administrator.'
        });
    }
    const programmeId = resolveProgrammeId(req);

    try {
        if (!isAssignedToProgramme(req, programmeId)) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to programme ${programmeId}`);
            return res.redirect('/officer/dashboard');
        }

        const exportResponse = await apiClient.get(`/officer/students/export/${programmeId}`);
        const { programme, students } = exportResponse.data;

        if (!students || students.length === 0) {
            return res.render('officer/dashboard', {
                programme, stats: null, error: 'No students found for this programme'
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
        res.send(lines.join('\n'));
    } catch (error) {
        console.error('Error exporting students:', error.message);
        res.redirect(`/officer/students?programme=${programmeId}`);
    }
}

// GET /officer/students — list students on the active programme.
export async function studentsList(req, res) {
    if (!req.session.user.assignments || req.session.user.assignments.length === 0) {
        return res.render('officer/students', {
            students: [], assignments: [], programmeId: null,
            error: 'You have no active programme assignments. Please contact administrator.'
        });
    }
    const assignments = req.session.user.assignments;
    const programmeId = resolveProgrammeId(req);

    try {
        if (!isAssignedToProgramme(req, programmeId)) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to programme ${programmeId}`);
            return res.redirect('/officer/dashboard');
        }

        const studentsResult = await apiClient.get(`/officer/students/programme/${programmeId}`);
        res.render('officer/students', {
            students: studentsResult.data.students, assignments, programmeId, error: null
        });
    } catch (error) {
        console.error('Error fetching students:', error.message);
        res.render('officer/students', { students: [], assignments, programmeId, error: 'Error fetching students' });
    }
}

// GET /officer/students/new
export async function studentNewPage(req, res) {
    if (!req.session.user.assignments || req.session.user.assignments.length === 0) {
        return res.render('officer/dashboard', {
            error: 'You have no active programme assignments. Please contact administrator.'
        });
    }
    const programmeId = resolveProgrammeId(req);

    try {
        if (!isAssignedToProgramme(req, programmeId)) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to programme ${programmeId}`);
            return res.redirect('/officer/dashboard');
        }
        res.render('officer/students-new', { programmeId, error: null });
    } catch (error) {
        console.error('Error fetching form data:', error.message);
        res.render('officer/students-new', { programmeId: null, error: 'Error fetching form data' });
    }
}

// POST /officer/students/new
export async function studentCreate(req, res) {
    const programmeId = resolveProgrammeId(req);
    const { student_number, first_name, surname, academic_year, programme_id } = req.body;

    if (!student_number || !first_name || !surname || !academic_year || !programme_id) {
        return res.render('officer/students-new', {
            programmeId: programme_id,
            error: 'All fields except mitigating circumstances notes are required'
        });
    }

    try {
        if (!isAssignedToProgramme(req, programmeId)) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to programme ${programmeId}`);
            return res.redirect('/officer/dashboard');
        }

        await apiClient.post('/officer/students', req.body);
        res.redirect(`/officer/students?programme=${programme_id}`);
    } catch (error) {
        console.error('Error creating student:', error.message);
        res.render('officer/students-new', {
            programmeId: programme_id,
            error: apiErrorMessage(error, 'Error creating student')
        });
    }
}

// GET /officer/students/:id — student detail page.
export async function studentDetail(req, res) {
    const studentId = req.params.id;
    const programmeId = resolveProgrammeId(req);

    try {
        const studentDetails = await apiClient.get(`/officer/students/${studentId}`);
        const student = studentDetails.data.student;

        if (!isAssignedToProgramme(req, student.programme_id)) {
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
            student: null, modules: [], classification: null, programmeId, error: 'Error fetching student details'
        });
    }
}

// GET /officer/students/:id/edit
export async function studentEditPage(req, res) {
    const studentId = req.params.id;
    const programmeId = resolveProgrammeId(req);

    try {
        const studentDetails = await apiClient.get(`/officer/students/${studentId}`);
        const student = studentDetails.data.student;

        if (!isAssignedToProgramme(req, student.programme_id)) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to edit student ${studentId}`);
            return res.redirect('/officer/dashboard');
        }

        res.render('officer/student-edit', { student: studentDetails.data.student, programmeId, error: null });
    } catch (error) {
        console.error('Error fetching student details for edit:', error.message);
        res.render('officer/student-edit', { student: null, programmeId, error: 'Error fetching student details' });
    }
}

// POST /officer/students/:id/edit
export async function studentUpdate(req, res) {
    const studentId = req.params.id;
    const programmeId = resolveProgrammeId(req);
    try {
        const studentDetails = await apiClient.get(`/officer/students/${studentId}`);
        const student = studentDetails.data.student;

        if (!isAssignedToProgramme(req, student.programme_id)) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to edit student ${studentId}`);
            return res.redirect('/officer/dashboard');
        }

        await apiClient.post(`/officer/students/${studentId}/edit`, req.body);
        res.redirect(`/officer/students/${studentId}?programme=${programmeId}`);
    } catch (error) {
        console.error('Error updating student:', error.message);
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
            error: apiErrorMessage(error, 'Error updating student')
        });
    }
}

// POST /officer/students/:id/delete
export async function studentDelete(req, res) {
    const studentId = req.params.id;
    const programmeId = resolveProgrammeId(req);

    try {
        const studentDetails = await apiClient.get(`/officer/students/${studentId}`);
        const student = studentDetails.data.student;

        if (!isAssignedToProgramme(req, student.programme_id)) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to delete student ${studentId}`);
            return res.redirect('/officer/dashboard');
        }

        await apiClient.post(`/officer/students/${studentId}/delete`);
        res.redirect(`/officer/students?programme=${programmeId}`);
    } catch (error) {
        console.error('Error deleting student:', error.message);
        res.redirect(`/officer/students/${studentId}?programme=${programmeId}`);
    }
}

// GET /officer/students/:id/modules/new
export async function moduleNewPage(req, res) {
    const studentId = req.params.id;
    const programmeId = resolveProgrammeId(req);
    try {
        const studentDetails = await apiClient.get(`/officer/students/${studentId}`);
        const student = studentDetails.data.student;

        if (!isAssignedToProgramme(req, student.programme_id)) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to add module for student ${studentId}`);
            return res.redirect('/officer/dashboard');
        }

        res.render('officer/modules-new', { student, programmeId, error: null });
    } catch (error) {
        console.error('Error fetching student details for adding module:', error.message);
        res.render('officer/modules-new', { student: null, programmeId, error: 'Error fetching student details' });
    }
}

// POST /officer/students/:id/modules
export async function moduleCreate(req, res) {
    const studentId = req.params.id;
    const programmeId = resolveProgrammeId(req);
    const { module_code, module_name, year_of_study, credits, mark } = req.body;

    let studentDetails;
    try {
        studentDetails = await apiClient.get(`/officer/students/${studentId}`);
        const student = studentDetails.data.student;

        if (!isAssignedToProgramme(req, student.programme_id)) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to add module for student ${studentId}`);
            return res.redirect('/officer/dashboard');
        }

        if (!module_code || !module_name || !year_of_study || !credits || !mark) {
            return res.render('officer/modules-new', { student: { id: studentId }, programmeId, error: 'All fields are required' });
        }
        if (mark < 0 || mark > 100) {
            return res.render('officer/modules-new', { student: { id: studentId }, programmeId, error: 'Mark must be between 0 and 100' });
        }

        await apiClient.post(`/officer/students/${studentId}/modules`, req.body);
        res.redirect(`/officer/students/${studentId}?programme=${programmeId}`);
    } catch (error) {
        console.error('Error adding module:', error.message);
        res.render('officer/modules-new', {
            student: studentDetails ? studentDetails.data.student : { id: studentId },
            programmeId,
            error: apiErrorMessage(error, 'Error adding module')
        });
    }
}

// GET /officer/students/:id/modules/:moduleId/edit
export async function moduleEditPage(req, res) {
    const studentId = req.params.id;
    const moduleId = req.params.moduleId;
    const programmeId = resolveProgrammeId(req);

    let studentDetails;
    try {
        studentDetails = await apiClient.get(`/officer/students/${studentId}`);
        const student = studentDetails.data.student;

        if (!isAssignedToProgramme(req, student.programme_id)) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to edit module for student ${studentId}`);
            return res.redirect('/officer/dashboard');
        }

        const moduleDetails = await apiClient.get(`/officer/students/${studentId}/modules/${moduleId}`);
        res.render('officer/modules-edit', { student, module: moduleDetails.data.module, programmeId, error: null });
    } catch (error) {
        console.error('Error fetching module details for edit:', error.message);
        res.render('officer/modules-edit', {
            student: studentDetails ? studentDetails.data.student : { id: studentId },
            module: null, programmeId, error: 'Error fetching module details'
        });
    }
}

// POST /officer/students/:id/modules/:moduleId/edit
export async function moduleUpdate(req, res) {
    const studentId = req.params.id;
    const moduleId = req.params.moduleId;
    const programmeId = resolveProgrammeId(req);

    let studentDetails;
    try {
        studentDetails = await apiClient.get(`/officer/students/${studentId}`);
        const student = studentDetails.data.student;

        if (!isAssignedToProgramme(req, student.programme_id)) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to edit module for student ${studentId}`);
            return res.redirect('/officer/dashboard');
        }

        await apiClient.post(`/officer/students/${studentId}/modules/${moduleId}/edit`, req.body);
        res.redirect(`/officer/students/${studentId}?programme=${programmeId}`);
    } catch (error) {
        console.error('Error updating module:', error.message);
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
            error: apiErrorMessage(error, 'Error updating module')
        });
    }
}

// POST /officer/students/:id/classify
export async function classify(req, res) {
    const studentId = req.params.id;
    const programmeId = resolveProgrammeId(req);

    try {
        const studentDetails = await apiClient.get(`/officer/students/${studentId}`);
        const student = studentDetails.data.student;

        if (!isAssignedToProgramme(req, student.programme_id)) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to programme ${programmeId}`);
            return res.redirect('/officer/dashboard');
        }

        await apiClient.post(`/officer/students/${studentId}/classify`, { programme_id: programmeId });
        res.redirect(`/officer/students/${studentId}?programme=${programmeId}`);
    } catch (error) {
        console.error('Error calculating classification:', error.message);
        res.redirect(`/officer/students/${studentId}?programme=${programmeId}`);
    }
}

// POST /officer/students/:id/classify/override
export async function classifyOverride(req, res) {
    const studentId = req.params.id;
    const programmeId = resolveProgrammeId(req);
    const { classification_code, override_rationale } = req.body;

    if (!override_rationale) {
        return res.redirect(`/officer/students/${studentId}?programme=${programmeId}&error=Override rationale is required`);
    }

    try {
        const studentDetails = await apiClient.get(`/officer/students/${studentId}`);
        const student = studentDetails.data.student;

        if (!isAssignedToProgramme(req, student.programme_id)) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to override classification for student ${studentId}`);
            return res.redirect('/officer/dashboard');
        }

        await apiClient.post(`/officer/students/${studentId}/classify/override`, {
            classification_code,
            override_rationale,
            override_by: req.session.user.id
        });

        res.redirect(`/officer/students/${studentId}?programme=${programmeId}`);
    } catch (error) {
        console.error('Error overriding classification:', error.message);
        const errorMessage = apiErrorMessage(error, 'Error overriding classification');
        res.redirect(`/officer/students/${studentId}?programme=${programmeId}&error=${encodeURIComponent(errorMessage)}`);
    }
}

// GET /officer/students/:id/classify/override
export async function classifyOverridePage(req, res) {
    const studentId = req.params.id;
    const programmeId = resolveProgrammeId(req);

    try {
        const studentDetails = await apiClient.get(`/officer/students/${studentId}`);
        const student = studentDetails.data.student;
        const classification = studentDetails.data.classification;

        if (!isAssignedToProgramme(req, student.programme_id)) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to access classification override for student ${studentId}`);
            return res.redirect('/officer/dashboard');
        }

        if (!classification) {
            return res.redirect(`/officer/students/${studentId}?programme=${programmeId}`);
        }

        res.render('officer/classify-override', { student, classification, programmeId, error: null });
    } catch (error) {
        console.error('Error fetching student details for classification override:', error.message);
        res.render('officer/classify-override', { student: null, classification: null, programmeId, error: 'Error fetching student details' });
    }
}

// POST /officer/students/:id/classify/confirm
export async function classifyConfirm(req, res) {
    const studentId = req.params.id;
    const programmeId = resolveProgrammeId(req);

    try {
        const studentDetails = await apiClient.get(`/officer/students/${studentId}`);
        const student = studentDetails.data.student;
        const classification = studentDetails.data.classification;

        if (!isAssignedToProgramme(req, student.programme_id)) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to confirm classification for student ${studentId}`);
            return res.redirect('/officer/dashboard');
        }

        if (!classification) {
            return res.redirect(`/officer/students/${studentId}?programme=${programmeId}`);
        }

        await apiClient.post(`/officer/students/${studentId}/classify/confirm`, {
            confirmed_by: req.session.user.id
        });

        res.redirect(`/officer/students/${studentId}?programme=${programmeId}`);
    } catch (error) {
        console.error('Error confirming classification:', error.message);
        const errorMessage = apiErrorMessage(error, 'Error confirming classification');
        res.redirect(`/officer/students/${studentId}?programme=${programmeId}&error=${encodeURIComponent(errorMessage)}`);
    }
}

// POST /officer/students/:id/classify/remove
export async function classifyRemove(req, res) {
    const studentId = req.params.id;
    const programmeId = resolveProgrammeId(req);

    try {
        const studentDetails = await apiClient.get(`/officer/students/${studentId}`);
        const student = studentDetails.data.student;
        const classification = studentDetails.data.classification;

        if (!isAssignedToProgramme(req, student.programme_id)) {
            console.warn(`Unauthorized access attempt by user ${req.session.user.id} to remove classification for student ${studentId}`);
            return res.redirect('/officer/dashboard');
        }

        if (!classification) {
            return res.redirect(`/officer/students/${studentId}?programme=${programmeId}`);
        }

        await apiClient.post(`/officer/students/${studentId}/classify/remove`);
        res.redirect(`/officer/students/${studentId}?programme=${programmeId}`);
    } catch (error) {
        console.error('Error removing classification:', error.message);
        const errorMessage = apiErrorMessage(error, 'Error removing classification');
        res.redirect(`/officer/students/${studentId}?programme=${programmeId}&error=${encodeURIComponent(errorMessage)}`);
    }
}
