import { describe, it, expect } from 'vitest';
import { classifyStudent } from './classificationEngine.js';

// Build a single module result object.
const makeModule = (year, mark, credits = 20, isResit = false) => ({
    year_of_study: year,
    mark,
    credits,
    is_resit: isResit,
    module_code: `MOD${year}-${mark}`,
    module_name: `Module ${year}`,
});

// A full passing year: 6 modules x 20 credits = 120 credits, all at `mark`.
const passingYear = (year, mark) => Array.from({ length: 6 }, () => makeModule(year, mark));

// Standard programme rules: 33/67 weighting, resit cap off.
const defaultRules = {
    y2_weight: 0.33,
    y3_weight: 0.67,
    resit_cap_enabled: false,
    resit_cap_mark: 40,
};

describe('classifyStudent', () => {
    it('returns First Class for a final average >= 70', () => {
        const modules = [...passingYear(1, 75), ...passingYear(2, 75), ...passingYear(3, 75)];
        const result = classifyStudent({}, modules, defaultRules);
        expect(result.eligible).toBe(true);
        expect(result.classification_code).toBe('1st');
        expect(result.classification_label).toBe('First Class Honours');
    });

    it('returns 2:1 for a final average in 60-69.99', () => {
        const modules = [...passingYear(1, 65), ...passingYear(2, 65), ...passingYear(3, 65)];
        const result = classifyStudent({}, modules, defaultRules);
        expect(result.classification_code).toBe('2:1');
    });

    it('returns 2:2 for a final average in 50-59.99', () => {
        const modules = [...passingYear(1, 55), ...passingYear(2, 55), ...passingYear(3, 55)];
        const result = classifyStudent({}, modules, defaultRules);
        expect(result.classification_code).toBe('2:2');
    });

    it('returns 3rd for a final average in 40-49.99', () => {
        const modules = [...passingYear(1, 45), ...passingYear(2, 45), ...passingYear(3, 45)];
        const result = classifyStudent({}, modules, defaultRules);
        expect(result.classification_code).toBe('3rd');
    });

    it('is ineligible when Year 1 credits are not all passed', () => {
        const modules = [
            ...passingYear(1, 65).slice(0, 5), // 100 credits passed
            makeModule(1, 35),                 // failing module -> 100/120
            ...passingYear(2, 65),
            ...passingYear(3, 65),
        ];
        const result = classifyStudent({}, modules, defaultRules);
        expect(result.eligible).toBe(false);
        expect(result.ineligibility_reason).toMatch(/Year 1/);
    });

    it('is ineligible when Year 2 credits are not all passed', () => {
        const modules = [
            ...passingYear(1, 65),
            ...passingYear(2, 65).slice(0, 5),
            makeModule(2, 35),
            ...passingYear(3, 65),
        ];
        const result = classifyStudent({}, modules, defaultRules);
        expect(result.eligible).toBe(false);
        expect(result.ineligibility_reason).toMatch(/Year 2/);
    });

    it('applies the resit cap when enabled and the mark exceeds the cap', () => {
        const rules = { ...defaultRules, resit_cap_enabled: true, resit_cap_mark: 40 };
        const modules = [
            ...passingYear(1, 65),
            ...passingYear(2, 65),
            ...passingYear(3, 65).slice(0, 5),
            makeModule(3, 80, 20, true), // resit -> capped to 40
        ];
        const result = classifyStudent({}, modules, rules);
        expect(result.eligible).toBe(true);
        // Year 3 average is pulled below the un-capped 65 by the capped resit.
        expect(result.year3_average).toBeLessThan(65);
        const capEntry = result.rationale.find(r => r.message.includes('Resit cap applied'));
        expect(capEntry).toBeDefined();
    });

    it('does not apply the resit cap when disabled', () => {
        const rules = { ...defaultRules, resit_cap_enabled: false, resit_cap_mark: 40 };
        const modules = [
            ...passingYear(1, 65),
            ...passingYear(2, 65),
            ...passingYear(3, 65).slice(0, 5),
            makeModule(3, 80, 20, true), // full mark stands
        ];
        const result = classifyStudent({}, modules, rules);
        expect(result.year3_average).toBeGreaterThan(65);
    });

    it('flags a result within 1 point of a classification boundary', () => {
        // Final average 69.5 is 0.5 below the 70 boundary.
        const modules = [...passingYear(1, 70), ...passingYear(2, 69.5), ...passingYear(3, 69.5)];
        const result = classifyStudent({}, modules, defaultRules);
        expect(result.boundary_flag).toBe(true);
        expect(result.boundary_distance).toBeLessThanOrEqual(1.0);
    });

    it('applies the year weighting correctly', () => {
        // (60 * 0.33) + (80 * 0.67) = 19.8 + 53.6 = 73.4
        const modules = [...passingYear(1, 70), ...passingYear(2, 60), ...passingYear(3, 80)];
        const result = classifyStudent({}, modules, defaultRules);
        expect(result.final_average).toBeCloseTo(73.4, 1);
        expect(result.classification_code).toBe('1st');
    });

    it('returns averages rounded to 4 decimal places and a rationale log', () => {
        const modules = [...passingYear(1, 65), ...passingYear(2, 65), ...passingYear(3, 65)];
        const result = classifyStudent({}, modules, defaultRules);
        expect(Array.isArray(result.rationale)).toBe(true);
        expect(result.rationale.length).toBeGreaterThan(0);
        expect(result.year2_average).toBe(65);
        expect(result.year3_average).toBe(65);
    });
});
