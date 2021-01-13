@Admin
Feature: Get health status

  Background:
    Given the test context is initialized
    And the API is up and running
    And the database is available
    And the sample data file is imported in the database
    And the user is properly authenticated

  Scenario: Delete a complete role
    When I try to delete the role "ROLE_TO_DELETE1" on application "APP3" for target "CTX1"
    Then the returned status code is 204
    And the database does not contain role "ROLE_TO_DELETE1" on application "APP3" for target "CTX1"

  Scenario: Delete a permission with name reused in an other target
    When I try to delete the role "ROLE_TO_DELETE2" on application "APP3" for target "CTX1"
    Then the returned status code is 204
    And the database does not contain role "ROLE_TO_DELETE2" on application "APP3" for target "CTX1"
    And the database contains role "ROLE_TO_DELETE2" on application "APP3" for target "CTX2"