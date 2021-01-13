@Health
Feature: Get health status 

    Background:
        Given the test context is initialized
        And the API is up and running
        And the database is available

    Scenario: Get health
        When I perform a GET on path "/_health"
        Then the returned status code is 200
        And the response contains health data