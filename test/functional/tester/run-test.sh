#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

# Prepare report destination folder
mkdir /tmp/test-report/
echo "folder /tmp/test-report/ created"
chmod 777 /tmp/test-report/
echo "and chmoded to 777"

cd /home/permit/

# Create Aiven database
echo "Environment variable to use as PG database modifier ${PG_DATABASE_MODIFIER_ENV_VAR}"
DB_NAME_MODIFIER=${!PG_DATABASE_MODIFIER_ENV_VAR}
echo "PG database modifier is ${DB_NAME_MODIFIER}"
AVN_TOKEN="fvZhCupMWh2Og6ciPrmqt5yVam5RRGHOKj6KGUx5ZCdbIyrVqDIsJcipam9BRf2M4H3dAvnRWkiDV77IWGbS29otSE6ZWY5K/2iI4pa4Qdcku3ijTaBCLcDgiVCV+kZfsTz6odaRT7M6kh1y8cUb+pSVxvtGgkyLu2g/r0pISQzLVFT2ly6WyK4Vt9WHUpO3slpmTrh5prboCkhk4YnE2Rvto/4uUhKIIXc8bIuLeNMdJWIQCYHuOr8zHsyjsgz1jG69Dt6KzuGCXnFuIYAOc5ObrKIaaaZHXOXsYlcefc6ou6Aja4SO4JAiwChYS6Cmhsgk6rJ5Gfhjaun82rIqo3XU8ruptm7dMVJQuB3TmHgDv0XH5JFUCQ=="
./test/functional/tester/avn-test-resources.sh -f ./test/functional/tester/.avn-test-resources.json -c create -h ${DB_NAME_MODIFIER} -t ${AVN_TOKEN}
echo "Test database created"

# Run Cucumber 
set +e
npm run test:functional:report
exitCode=$?
echo "Finished running tests with exit code $exitCode"

# Generate html report
echo "Now generating html report"
node dist/test/functional/report/HtmlReportGenerator.js /tmp/test-report/functional_tests_report.json /tmp/test-report/report.html
set -e

# Drop Aiven database
./test/functional/tester/avn-test-resources.sh -f ./test/functional/tester/.avn-test-resources.json -c delete -h ${DB_NAME_MODIFIER} -t ${AVN_TOKEN}
echo "Test database dropped"

exit $exitCode