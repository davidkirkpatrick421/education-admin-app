
const MINIMUM_PASS_MARK = 40;
const CREDITS_PER_YEAR = 120;
const BOUNDARY_THRESHOLD = 1.0;

const CLASSIFICATION_BOUNDARIES = [
    { min: 70, max: 100, code: '1st', label: 'First Class Honours' },
    { min: 60, max: 69.99, code: '2:1', label: 'Upper Second Class Honours' },
    { min: 50, max: 59.99, code: '2:2', label: 'Lower Second Class Honours' },
    { min: 40, max: 49.99, code: '3rd', label: 'Third Class Honours' },
    { min: 0, max: 39.99, code: 'fail', label: 'Fail' }
]

function classifyStudent(student, modules, programmeRules) {

    const rationale = [];

    // Filter modules by year of study
    const year1Modules = modules.filter(m => parseInt(m.year_of_study) === 1);
    const year2Modules = modules.filter(m => parseInt(m.year_of_study) === 2);
    const year3Modules = modules.filter(m => parseInt(m.year_of_study) === 3);

    // Calculate credits passed for each year based on minimum pass mark
    const year1CreditsPassed = year1Modules
        .filter(m => m.mark >= MINIMUM_PASS_MARK)
        .reduce((sum, m) => sum + m.credits, 0);

    const year2CreditsPassed = year2Modules
        .filter(m => m.mark >= MINIMUM_PASS_MARK)
        .reduce((sum, m) => sum + m.credits, 0);

    const year3CreditsPassed = year3Modules
        .filter(m => m.mark >= MINIMUM_PASS_MARK)
        .reduce((sum, m) => sum + m.credits, 0);

    // Check if student has passed enough credits in each year to be classified
    if (year1CreditsPassed < CREDITS_PER_YEAR) {
        rationale.push({ type: 'fail', message: `Year 1 failed - ${year1CreditsPassed}/${CREDITS_PER_YEAR} required` });
        return {
            eligible: false,
            ineligibility_reason: `Year 1 failed - ${year1CreditsPassed}/${CREDITS_PER_YEAR} required`,
            rationale: rationale
        };
    }
    rationale.push({ type: 'ok', message: `Year 1 passed - ${year1CreditsPassed}/${CREDITS_PER_YEAR} credits passed` });

    if (year2CreditsPassed < CREDITS_PER_YEAR) {
        rationale.push({ type: 'fail', message: `Year 2 failed - ${year2CreditsPassed}/${CREDITS_PER_YEAR} required` });
        return {
            eligible: false,
            ineligibility_reason: `Year 2 failed - ${year2CreditsPassed}/${CREDITS_PER_YEAR} required`,
            rationale: rationale
        };
    }
    rationale.push({ type: 'ok', message: `Year 2 passed - ${year2CreditsPassed}/${CREDITS_PER_YEAR} credits passed` });

    if (year3CreditsPassed < CREDITS_PER_YEAR) {
        rationale.push({ type: 'fail', message: `Year 3 failed - ${year3CreditsPassed}/${CREDITS_PER_YEAR} required` });
        return {
            eligible: false,
            ineligibility_reason: `Year 3 failed - ${year3CreditsPassed}/${CREDITS_PER_YEAR} required`,
            rationale: rationale
        };
    }
    rationale.push({ type: 'ok', message: `Year 3 passed - ${year3CreditsPassed}/${CREDITS_PER_YEAR} credits passed` });

    // Apply resit cap if enabled in programme rules
    const applyResitCap = (modules, programmeRules) => {
        return modules.map(m => {
            if (m.is_resit && programmeRules.resit_cap_enabled && m.mark > programmeRules.resit_cap_mark) {
                return {
                    id: m.id,
                    student_id: m.student_id,
                    module_code: m.module_code,
                    module_name: m.module_name,
                    credits: m.credits,
                    year_of_study: m.year_of_study,
                    mark: programmeRules.resit_cap_mark,
                    is_resit: m.is_resit
                };
            }
            return m;
        });
    };


    // Calculate yearly averages with resit cap applied if applicable, otherswise use original marks
    const year2ModulesCapped = applyResitCap(year2Modules, programmeRules);
    const year3ModulesCapped = applyResitCap(year3Modules, programmeRules);
    rationale.push({ type: 'ok', message: `Year 2 modules capped - ${year2ModulesCapped.length} modules capped` });
    rationale.push({ type: 'ok', message: `Year 3 modules capped - ${year3ModulesCapped.length} modules capped` });


    // Calculate weighted average based on programme rules
    const year2Average = year2ModulesCapped.reduce((sum, m) => sum + (m.mark * m.credits), 0) / year2CreditsPassed;
    const year3Average = year3ModulesCapped.reduce((sum, m) => sum + (m.mark * m.credits), 0) / year3CreditsPassed;
    rationale.push({ type: 'ok', message: `Year 2 average - ${year2Average.toFixed(2)}` });
    rationale.push({ type: 'ok', message: `Year 3 average - ${year3Average.toFixed(2)}` });


    // Calculate final average based on programme rules
    const finalAverage = (year2Average * programmeRules.y2_weight) + (year3Average * programmeRules.y3_weight);
    rationale.push({ type: 'ok', message: `Final average - ${finalAverage.toFixed(2)}` });

    // Determine classification based on final average and classification boundaries
    const classification = CLASSIFICATION_BOUNDARIES.find(
        b => finalAverage >= b.min && finalAverage <= b.max
    );
    rationale.push({ type: 'ok', message: `Classification - ${classification.label}` });

    // Check if final average is within boundary threshold of next classification and set flag and distance if so
    let boundaryFlag = false;
    let boundaryDistance = null;

    for (const band of CLASSIFICATION_BOUNDARIES) {
        const distanceToBoundary = Math.abs(finalAverage - band.min);
        if (distanceToBoundary <= BOUNDARY_THRESHOLD) {
            boundaryFlag = true;
            boundaryDistance = distanceToBoundary;
            break;
        }
    }
    rationale.push({ type: 'warn', message: `Boundary flag - ${boundaryFlag}` });
    rationale.push({ type: 'warn', message: `Boundary distance - ${boundaryDistance?.toFixed(2)}` });

    return {
        eligible: true,
        ineligibility_reason: null,
        year2Average: parseFloat(year2Average.toFixed(4)),
        year3Average: parseFloat(year3Average.toFixed(4)),
        classification: classification.code,
        classification_label: classification.label,
        final_average: parseFloat(finalAverage.toFixed(4)),
        boundary_flag: boundaryFlag,
        boundary_distance: boundaryDistance,
        rationale: rationale
    };
}

export { classifyStudent };