@projects
Feature: Projects

    @master
    Scenario: Signup Up With Random User
        Given I am on the sign up page
        When I signup with random credentials
        Then I am logged in

    @master
    Scenario: Once Logged in you are on the Norman Page
        Given I am on the Landing Page
        When  I click New Project
        And  I enter Project Name "Eoin"
        Then Project "Eoin" is created

    @master
    Scenario: Once a project is created
        Given Project "Eoin" exists
        When I click to enter the project
        Then I am in the prototype page
        And I check if there are console errors

    @master
    Scenario: Check Project Hero Banner name exists on refresh
        Given I am in the prototype page
        When I check if the herobanner title is there
        And I Refresh the Page
        Then I check if the herobanner title is correct
