import * as programmeModel from '../models/programme.model.js';
import * as userModel from '../models/user.model.js';
import * as studentModel from '../models/student.model.js';
import * as assignmentModel from '../models/assignment.model.js';
import * as classificationModel from '../models/classificationResult.model.js';

// GET /admin/stats — headline counts for the admin dashboard.
export async function adminStats(req, res) {
    try {
        const [totalProgrammes, totalOfficers, totalStudents, activeAssignments] = await Promise.all([
            programmeModel.countAll(),
            userModel.countActiveOfficers(),
            studentModel.countAll(),
            assignmentModel.countActive(),
        ]);

        res.json({ totalProgrammes, totalOfficers, totalStudents, activeAssignments });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error.message);
        res.status(500).json({ error: 'Error fetching dashboard stats' });
    }
}

// GET /officer/stats/:programme_id — classification stats for an officer's programme.
export async function officerStats(req, res) {
    const { programme_id } = req.params;

    try {
        const students = await studentModel.listByProgramme(programme_id);
        const confirmed = await classificationModel.listConfirmedByProgramme(programme_id);
        const pending = await classificationModel.listPendingByProgramme(programme_id);
        const pendingReview = await classificationModel.listPendingReviewByProgramme(programme_id);
        const distribution = await classificationModel.distributionByProgramme(programme_id);
        const ineligibleCount = await classificationModel.countIneligibleByProgramme(programme_id);

        const distributionMap = { '1st': 0, '2:1': 0, '2:2': 0, '3rd': 0, 'fail': 0 };
        distribution.forEach(row => {
            distributionMap[row.classification_code] = row.count;
        });
        distributionMap['ineligible'] = ineligibleCount;

        res.json({
            totalStudents: students.length,
            totalConfirmedClassifications: confirmed.length,
            totalPendingClassifications: pending.length,
            pendingReviewClassifications: pendingReview.length,
            distribution: distributionMap
        });
    } catch (error) {
        console.error('Error fetching officer stats:', error.message);
        res.status(500).json({ error: 'Error fetching officer stats' });
    }
}
