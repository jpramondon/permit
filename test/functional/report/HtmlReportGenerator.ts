var reporter = require('cucumber-html-reporter');

const jsonFile = process.argv[2];
const output = process.argv[3];

var options = {
    theme: 'bootstrap',
    jsonFile,
    output,
    reportSuiteAsScenarios: true,
    scenarioTimestamp: true
};

console.log(`Report options: ${JSON.stringify(options)}`);

reporter.generate(options);