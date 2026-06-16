import { classifyStudent } from '../../shared/classificationEngine.js';
import * as studentModel from '../models/student.model.js';
import * as moduleModel from '../models/moduleResult.model.js';
import * as programmeModel from '../models/programme.model.js';
import * as classificationModel from '../models/classificationResult.model.js';

// Custom error carrying an HTTP status so the controller can map it to a response.
class ServiceError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

// Run a student through the classification engine using their programme's rules,
// persist the result (insert or update) and return the computed result object.
export async function classifyAndPersist(studentId) {
    const student = await studentModel.findBasicById(studentId);
    if (!student) {
        throw new ServiceError(404, 'Student not found');
    }

    const modules = await moduleModel.listByStudent(studentId);

    const programmeRules = await programmeModel.findById(student.programme_id);
    if (!programmeRules) {
        throw new ServiceError(404, 'Programme rules not found');
    }

    const result = classifyStudent(student, modules, programmeRules);

    await classificationModel.upsert(student.id, student.programme_id, result);

    return result;
}

export { ServiceError };
