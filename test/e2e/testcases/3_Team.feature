@projects
Feature: Team

    @master
    Scenario: Invite User To A Project
        Given: I Am In A Project
        When I click Add People
        And I Add A New Team Member
        And I Add a New Team Member using CAPS
        And I Add a New Team Member using CAPS
        And I Send an Invite
        Then Team Invite is Sent
        Then Pending Invite Count is "2"

    @master
    Scenario: Invite User To A Project
        Given: I Am In A Project
        When I click Add People
        And I Add "test@sap.c" Team Member
        Then Email error toast should display

    @master
    Scenario: Accept Team Invite
        Given I am on the login page
        When I login using Invitee Credentials
        Given I am on the Landing Page
        When I Click on New Project Invite
        And I Accept the New Invite
        Then I am Collaborating on the Project

    @master
    Scenario: Verify User 2 has Invite Link
        Given I am on the login page
        When I login using 2nd Invitee Credentials
        Given I am on the Landing Page
        Then Project Invite link visible "true"

    @master
    Scenario: Delete 2nd User Invite
        Given I am on the login page
        When I enter valid credentials
        Then I am logged in
        Given A project exists
        When I click to enter the project
        Then I am in the prototype page
        Given Invites Exists "true"
        When  I Delete Invite
        Then  Invites Exists "false"

    @master
    Scenario: Verify User 2 No longer has Invite Link
        Given I am on the login page
        When I login using 2nd Invitee Credentials
        Given I am on the Landing Page
        Then Project Invite link visible "false"

