@projects
Feature: Check if Show More Projects works

    @master
    Scenario: Login with Valid Credentials
        Given I am on the login page
        When I enter Participant 1 User credentials
        Then I am logged in

    @master
    Scenario: Create 7 projects
        Given I am on the Landing Page
        When  I click New Project
        And I create 7 projects

    Scenario: Show more projects
        Given I am on the Landing Page
        When I Click on Show more projects
        Then Project "7" is created

    Scenario: Hide more projects
        Given I am on the Landing Page
        When I Click on Show more projects
        Then Project "7" is created

    Scenario: Show more to enter hidden project
        Given I am on the Landing Page
        When I Click on Show more projects
        Then Project "7" is created
