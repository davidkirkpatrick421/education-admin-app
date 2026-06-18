// Renders the classification distribution chart on the officer dashboard.
// Data is provided by the server via the canvas `data-distribution` attribute,
// which keeps the page free of inline scripts (stricter Content-Security-Policy).
(function () {
    const canvas = document.getElementById('classificationChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const distributionData = JSON.parse(canvas.dataset.distribution || '[]');
    const ctx = canvas.getContext('2d');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['1st', '2:1', '2:2', '3rd', 'Fail', 'Ineligible'],
            datasets: [{
                label: 'Students',
                data: distributionData,
                backgroundColor: [
                    '#bfa5a3',
                    'rgb(39, 41, 109)',
                    '#787586',
                    '#484554',
                    '#ada9bb',
                    '#484554'
                ]
            }]
        },
        options: {
            indexAxis: 'y',
            layout: {},
            responsive: true,
            aspectRatio: 2,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: 'rgb(39, 41, 109)',
                        font: { size: '12%', weight: 'bold' }
                    }
                },
                title: { display: true, text: 'Student Classification Distribution', color: 'rgb(0,0,0)' }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
})();
