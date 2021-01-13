@Profiles
Feature: Get health status

  Background:
    Given the test context is initialized
    And the API is up and running
    And the database is available
    And the sample data file is imported in the database

  Scenario: Get profile
    When I ask for the profile on application "APP1" for user "kthefrog"
    Then the returned status code is 200
    And the response contains the following application preferences
      | key   | value  |
      | pref1 | value1 |
      | pref2 | 5      |
    And the response contains the following global preferences
      | key   | value  |
      | pref0 | global |
    And the response contains the following permissions
      | role   | target |
      | ROLE_1 |        |
      | ROLE_2 |        |

  Scenario: Get Profile for missing application
    When I ask for the profile on application "APP4" for user "kthefrog"
    Then the returned status code is 404
  
  Scenario: Get profile when no permission for application
    When I ask for the profile on application "APP2" for user "someuser@domain.com"
    Then the returned status code is 404