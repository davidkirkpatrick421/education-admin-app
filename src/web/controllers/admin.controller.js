import apiClient from '../apiClient.js';
import { apiErrorMessage } from '../lib/officerContext.js';

// GET /admin/dashboard
export async function dashboard(req, res) {
    try {
        const dashboardResult = await apiClient.get('/admin/stats');
        res.render('admin/dashboard', { stats: dashboardResult.data });
    } catch (error) {
        console.error('Error fetching admin stats:', error.message);
        res.render('admin/dashboard', {
            stats: { totalProgrammes: 0, totalOfficers: 0, totalStudents: 0, activeAssignments: 0 }
        });
    }
}

// ----- Officers -----

export async function officersList(req, res) {
    try {
        const response = await apiClient.get('/officers');
        res.render('admin/officers', { officers: response.data.officers });
    } catch (error) {
        console.error('Error fetching officers:', error.message);
        res.status(500).send('Error fetching officers');
    }
}

export function officerNew(req, res) {
    res.render('admin/officers-add-new', { error: null });
}

export async function officerCreate(req, res) {
    try {
        const { email, first_name, surname, password } = req.body;

        if (!email || !first_name || !surname || !password) {
            return res.render('admin/officers-add-new', { error: 'All fields are required' });
        }
        if (password.length < 8) {
            return res.render('admin/officers-add-new', { error: 'Password must be at least 8 characters' });
        }

        await apiClient.post('/officers', req.body);
        res.redirect('/admin/officers');
    } catch (error) {
        console.error('Error creating officer:', error.message);
        res.render('admin/officers-add-new', { error: 'Error creating officer' });
    }
}

export async function officerEditPage(req, res) {
    const officerId = req.params.id;
    try {
        const editResponse = await apiClient.get(`/officers/${officerId}`);
        res.render('admin/officers-edit', { officer: editResponse.data.officer, error: null });
    } catch (error) {
        console.error('Error fetching officer:', error.message);
        res.redirect('/admin/officers');
    }
}

export async function officerUpdate(req, res) {
    const { email, first_name, surname } = req.body;
    const officerId = req.params.id;

    if (!email || !first_name || !surname) {
        return res.render('admin/officers-edit', {
            officer: { id: officerId, email, first_name, surname },
            error: 'All fields are required'
        });
    }

    try {
        await apiClient.post(`/officers/${officerId}/edit`, req.body);
        res.redirect('/admin/officers');
    } catch (error) {
        console.error('Error updating officer:', error.message);
        res.render('admin/officers-edit', {
            officer: { id: officerId, email, first_name, surname },
            error: 'Error updating officer'
        });
    }
}

export async function officerDeactivate(req, res) {
    try {
        await apiClient.post(`/officers/${req.params.id}/deactivate`);
        res.redirect('/admin/officers');
    } catch (error) {
        console.error('Error deactivating officer:', error.message);
        res.redirect('/admin/officers');
    }
}

export async function officerReactivate(req, res) {
    try {
        await apiClient.post(`/officers/${req.params.id}/reactivate`);
        res.redirect('/admin/officers');
    } catch (error) {
        console.error('Error reactivating officer:', error.message);
        res.redirect('/admin/officers');
    }
}

// ----- Programmes -----

export async function programmesList(req, res) {
    try {
        const response = await apiClient.get('/programmes');
        res.render('admin/programmes', { programmes: response.data.programmes });
    } catch (error) {
        console.error('Error fetching programmes:', error.message);
        res.status(500).send('Error fetching programmes');
    }
}

export function programmeNew(req, res) {
    res.render('admin/programmes-new', { error: null });
}

export async function programmeCreate(req, res) {
    const { code, title, y2_weight, y3_weight, resit_cap_enabled, resit_cap_mark, board_deadline } = req.body;
    if (!code || !title || !y2_weight || !y3_weight || !resit_cap_enabled || !resit_cap_mark || !board_deadline) {
        return res.render('admin/programmes-new', { error: 'All fields are required' });
    }

    try {
        await apiClient.post('/programmes', req.body);
        res.redirect('/admin/programmes');
    } catch (error) {
        console.error('Error creating programme:', error.message);
        res.render('admin/programmes-new', { error: 'Error creating programme' });
    }
}

export async function programmeEditPage(req, res) {
    const programmeId = req.params.id;
    try {
        const editResponse = await apiClient.get(`/programmes/${programmeId}`);
        res.render('admin/programmes-edit', { programme: editResponse.data.programme, error: null });
    } catch (error) {
        console.error('Error fetching programme:', error.message);
        res.redirect('/admin/programmes');
    }
}

export async function programmeUpdate(req, res) {
    const { code, title, y2_weight, y3_weight, resit_cap_enabled, resit_cap_mark, board_deadline } = req.body;
    const programmeId = req.params.id;

    if (!code || !title || !y2_weight || !y3_weight || !resit_cap_enabled || !resit_cap_mark || !board_deadline) {
        return res.render('admin/programmes-edit', {
            programme: { id: programmeId, code, title, y2_weight, y3_weight, resit_cap_enabled, resit_cap_mark, board_deadline },
            error: 'All fields are required'
        });
    }

    try {
        await apiClient.post(`/programmes/${programmeId}/edit`, req.body);
        res.redirect('/admin/programmes');
    } catch (error) {
        console.error('Error updating programme:', error.message);
        res.render('admin/programmes-edit', {
            programme: { id: programmeId, code, title, y2_weight, y3_weight, resit_cap_enabled, resit_cap_mark, board_deadline },
            error: 'Error updating programme'
        });
    }
}

// ----- Assignments -----

export async function assignmentsList(req, res) {
    try {
        const response = await apiClient.get('/assignments');
        res.render('admin/assignments', { assignments: response.data.assignments });
    } catch (error) {
        console.error('Error fetching assignments:', error.message);
        res.render('admin/assignments', { assignments: [] });
    }
}

export async function assignmentNew(req, res) {
    try {
        const response = await apiClient.get('/assignments/form-data');
        const { officers, programmes } = response.data;
        res.render('admin/assignments-new', { officers, programmes, error: null });
    } catch (error) {
        console.error('Error fetching form data:', error.message);
        res.render('admin/assignments-new', { officers: [], programmes: [], error: 'Error fetching form data' });
    }
}

export async function assignmentCreate(req, res) {
    const { officer_id, programme_id } = req.body;

    if (!officer_id || !programme_id) {
        const formDataResponse = await apiClient.get('/assignments/form-data');
        return res.render('admin/assignments-new', {
            officers: formDataResponse.data.officers,
            programmes: formDataResponse.data.programmes,
            error: 'All fields are required'
        });
    }

    try {
        await apiClient.post('/assignments', { officer_id, programme_id, assigned_by: req.session.user.id });
        res.redirect('/admin/assignments');
    } catch (error) {
        console.error('Error creating assignment:', error.message);
        const errorMessage = apiErrorMessage(error, 'Error creating assignment');
        const formDataResponse = await apiClient.get('/assignments/form-data');
        res.render('admin/assignments-new', {
            officers: formDataResponse.data.officers,
            programmes: formDataResponse.data.programmes,
            error: errorMessage
        });
    }
}

export async function assignmentRemove(req, res) {
    try {
        await apiClient.post(`/assignments/${req.params.id}/remove`);
        res.redirect('/admin/assignments');
    } catch (error) {
        console.error('Error removing assignment:', error.message);
        res.redirect('/admin/assignments');
    }
}
