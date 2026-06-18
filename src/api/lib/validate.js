// Lightweight request-body validators for API write endpoints. Each returns a
// string error message, or null when the value is acceptable.

export function requireFields(body, fields) {
    for (const field of fields) {
        const value = body[field];
        if (value === undefined || value === null || value === '') {
            return `Missing required field: ${field}`;
        }
    }
    return null;
}

export function validMark(mark) {
    const n = Number(mark);
    if (Number.isNaN(n) || n < 0 || n > 100) {
        return 'Mark must be a number between 0 and 100';
    }
    return null;
}

export function validCredits(credits) {
    const n = Number(credits);
    if (Number.isNaN(n) || n <= 0) {
        return 'Credits must be a positive number';
    }
    return null;
}

export function validYearOfStudy(year) {
    const n = Number(year);
    if (![1, 2, 3].includes(n)) {
        return 'Year of study must be 1, 2 or 3';
    }
    return null;
}

export function validEmail(email) {
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return 'A valid email address is required';
    }
    return null;
}
