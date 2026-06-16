// Helpers shared across officer-facing controllers.

// The programme an officer is currently acting on: explicit query param,
// else their session's active programme, else their first assignment.
export function resolveProgrammeId(req) {
    return req.query.programme
        || req.session.activeProgrammeId
        || req.session.user.assignments[0]?.programme_id;
}

// Whether the logged-in officer is assigned to the given programme.
export function isAssignedToProgramme(req, programmeId) {
    return req.session.user.assignments.some(
        a => parseInt(a.programme_id) === parseInt(programmeId)
    );
}

// Extract a user-facing message from a failed API response, with a fallback.
export function apiErrorMessage(error, fallback) {
    return error.response && error.response.data && error.response.data.error
        ? error.response.data.error
        : fallback;
}
