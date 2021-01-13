@Permissions
Feature: Get health status

  Background:
    Given the test context is initialized
    And the API is up and running
    And the database is available
    And the sample data file is imported in the database

  Scenario: Get permissions
    When I ask for the permissions on application "APP2" for user "kthefrog"
    Then the returned status code is 200
    And the response contains the following permissions
      | role        | target  |
      | ROLE_ADMIN  | SG1     |
      | ROLE_READER | SG1,SG2 |

  Scenario: Get permissions for missing application
    When I ask for the permissions on application "APP4" for user "kthefrog"
    Then the returned status code is 404
  
  Scenario: Get permissions when no permission for application
    When I ask for the permissions on application "APP2" for user "someuser@domain.com"
    Then the returned status code is 404