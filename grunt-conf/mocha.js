'use strict';
module.exports = {

    options: {
        coverage: true,
        reporter: 'mocha-jenkins-reporter',
        coverageFolder: 'reports/coverage/server',
        mask: '**/*.spec.js',
        root: './node_modules/norman-projects-server/lib',
        reportFormats: ['lcov'],
        check: {
            statements: 82,
            branches: 72,
            functions: 78,
            lines: 82
        }
    },
    src: [
        'server/**/*.spec.js',
        'test/int/**/*.spec.js',
        '!server/node_modules/**'
    ]
};
