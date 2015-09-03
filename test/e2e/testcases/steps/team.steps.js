'use strict';

var Team = require('../../pageobjects/team.po.js');
var Proj = require('../../pageobjects/projects.po.js');
var Chance = require('norman-testing-tp').chance, chance = new Chance();
var chai = require('norman-testing-tp').chai;
var chaiAsPromised = require('norman-testing-tp')['chai-as-promised'];
var utility = require('../../support/utility.js');
chai.use(chaiAsPromised);

var localbaseURL = browser.baseUrl;

var expect = chai.expect;
var teamPage = new Team('');
var projPage = new Proj('');
var team = {
    //creates 1st user to be used in the login feature file.
    'email': chance.email(),
    'name': chance.first() + ' ' + chance.last(),
    'password': 'Password1'
};

var second = {
    'email': chance.email(),
    'name': chance.first() + ' ' + chance.last(),
    'password': 'Password1'
};

module.exports = function() {

    this.Before('@createProjectUser', function(scenario, callback) {
        var url = localbaseURL + '/auth/signup';
        utility.post(url, team).then(function(){
            callback();
        });
    });

    this.Before('@create2ndInvitee', function(scenario, callback) {
        var url = localbaseURL + '/auth/signup';
        utility.post(url, second).then(function(){
            callback();
        });
    });


    this.Given(/^I am logged out$/, function(callback){
        var url = localbaseURL + '/login';
        teamPage = new Team(url); //Forces Page back to the login page
        expect(browser.driver.getCurrentUrl()).to.eventually.match(/login/).and.notify(callback);
    });

    this.When(/^I am in the Team Page$/, function (callback) {
        expect(browser.driver.getCurrentUrl()).to.eventually.match(/team/).and.notify(callback);
    });

    this.When(/^I click Add People$/, function (callback) {
        browser.waitForAngular();
        teamPage.clickAddPeople();
        browser.waitForAngular();
        callback();
    });

    this.When(/^I Add A New Team Member$/, function (callback) {
        teamPage.addEmail(team.email);
        browser.waitForAngular();
        callback();
    });

    this.When(/^I Add "([^"]*)" Team Member$/, function (neg, callback) {
        teamPage.addEmail(neg);
        browser.waitForAngular();
        callback();
    });

    this.When(/^I Add a New Team Member using CAPS$/, function (callback) {
        teamPage.add2ndEmail(second.email.toUpperCase());
        browser.waitForAngular();
        callback();
    });

    this.Then(/^Email error toast should display$/, function (callback) {
        browser.waitForAngular();
        expect(teamPage.teamEmailInviteErrorToast.getText()).to.eventually.equal('This is not a valid email address!').and.notify(callback);
    });

    this.Then(/^Pending Invite Count is "([^"]*)"$/, function (count,callback) {
        expect(teamPage.pendingInvitesCount.getText()).to.eventually.to.equal(count).and.notify(callback)
    });

    this.When(/^I Send an Invite$/, function (callback) {
        browser.waitForAngular();
        teamPage.clickSendInvite();
        browser.waitForAngular();
        callback();
    });

    this.Given(/^Invites Exists "([^"]*)"$/, function (visible, callback) {
        browser.waitForAngular();
        if(visible==="true"){
            expect(teamPage.pendingInvites.isEnabled()).to.eventually.equal(true).and.notify(callback);
        }else{
            expect(teamPage.pendingInvites.isPresent()).to.eventually.equal(false).and.notify(callback);
        }

    });

    this.Then(/^Team Invite is Sent$/, function (callback) {
        browser.waitForAngular();
        expect(teamPage.pendingInvites.isEnabled()).to.eventually.equal(true).and.notify(callback);
    });

    this.When(/^I login using Invitee Credentials$/, function (callback) {
        browser.waitForAngular();
        teamPage.login(team.email, team.password);
        browser.waitForAngular();
        callback();
    });

    this.When(/^I Delete Invite$/, function (callback) {
        browser.waitForAngular();
        teamPage.clickInviteLink();
        browser.waitForAngular();
        teamPage.clickRevokeInvite();
        browser.waitForAngular();
        teamPage.clickConfRevoke();
        browser.waitForAngular();
        callback();
    });


    this.Then(/^Project Invite link visible "([^"]*)"$/, function (visible,callback) {
        browser.waitForAngular();
        if(visible==="true"){
            expect(projPage.projInviteLink.isEnabled()).to.eventually.equal(true).and.notify(callback)
        }else{
            expect(projPage.projInviteLink.isPresent()).to.eventually.equal(false).and.notify(callback)
        }
    });


    this.When(/^I login using 2nd Invitee Credentials$/, function (callback) {
        browser.waitForAngular();
        teamPage.login(second.email, second.password);
        callback();
    });

    this.When(/^I Accept the Invite$/, function (callback) {
        browser.waitForAngular();
        projPage.clickAcceptInvite();
        callback();
    });

    this.Then(/^I am Collaborating on the Project$/, function(callback){
        browser.waitForAngular();
        projPage.clickCollabProj();
        browser.waitForAngular();
        expect(browser.driver.getCurrentUrl()).to.eventually.match(/prototype/).and.notify(callback);
    });
};
