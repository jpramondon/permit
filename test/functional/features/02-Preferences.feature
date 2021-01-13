@Preferences
Feature: Get health status

  Background:
    Given the test context is initialized
    And the API is up and running
    And the database is available
    And the sample data file is imported in the database

  Scenario: Get preferences
    When I ask for the preferences on application "APP1" for user "kthefrog"
    Then the returned status code is 200
    And the response contains the following application preferences
      | key   | value  |
      | pref1 | value1 |
      | pref2 | 5      |
    And the response contains the following global preferences
      | key   | value  |
      | pref0 | global |

  Scenario: Get preferences for missing application
    When I ask for the preferences on application "APP4" for user "kthefrog"
    Then the returned status code is 404
  
  Scenario: Get preferences when no preferences for application
    When I ask for the preferences on application "APP2" for user "someuser@domain.com"
    Then the returned status code is 404

  Scenario: Put preferences
    When I modify the preferences on application "APP3" for user "kthefrog" with the following preferences
      | key   | value  |
      | pref1 | value1 |
      | pref2 | 1      |
    Then the returned status code is 201
    And I ask for the preferences on application "APP3" for user "kthefrog"
    Then the returned status code is 200
    And the response contains the following application preferences
      | key   | value  |
      | pref1 | value1 |
      | pref2 | 1      |