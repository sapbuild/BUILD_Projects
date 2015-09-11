'use strict';

var Projects = require('../../pageobjects/projects.po.js');
var Proto = require('../../pageobjects/prototype.po.js');

var tp = require('norman-server-tp');
var _ = tp.lodash;
var chai = require('norman-testing-tp').chai;
var chaiAsPromised = require('norman-testing-tp')['chai-as-promised'];
chai.use(chaiAsPromised);
var expect = chai.expect;
var projPage = new Projects('');
var protoPage = new Proto('');
var projectName = 'SAP-O-MATIC';

var path = require('path');
var sampleUpload1 = '../files/sample1.jpg';
var sampleUpload2 = '../files/sample2.jpg';
var sampleUpload3 = '../files/HELLO.docx';
var sampleUpload4 = '../files/proto.zip';

var uploadPath1 = path.resolve(__dirname,sampleUpload1 );
var uploadPath2 = path.resolve(__dirname,sampleUpload2 );
var uploadPath3 = path.resolve(__dirname,sampleUpload3 );
var uploadPath4 = path.resolve(__dirname,sampleUpload4 );

module.exports = function() {




    this.Given(/^A project exists$/, function (callback) {
        expect(projPage.projectTitle.getText()).to.eventually.equal(projectName).and.notify(callback);
    });

    this.Given(/^Project "([^']*)" exists$/, function (projName, callback) {
        expect(projPage.projectTitle.getText()).to.eventually.equal(projName).and.notify(callback);
    });

    this.Given(/^I Am In A Project$/, function (callback) {
        expect(protoPage.btnAddPage.isPresent()).to.eventually.equal(true).and.notify(callback);
    });

    this.When(/^I click New Project$/, function (callback) {
        browser.waitForAngular();
        projPage.clickNewProject();
        callback();
    });

    this.When(/^I click New Project Link$/, function (callback) {
        browser.waitForAngular();
        projPage.clickNewProjectLink();
        callback();
    });

    this.When(/^I click New Project Button$/, function (callback) {
        browser.waitForAngular();
        projPage.clickNewProject();
        callback();
    });

    this.When(/^I create 7 projects$/, function (callback) {
        browser.waitForAngular();
        for(var i = 1; i <= 7; i++)
        {
            projPage.clickNewProject();
            browser.waitForAngular();
            projPage.createProj(i);
            browser.waitForAngular();
        }
        callback();
    });

    this.When(/^I enter Project Name$/, function (callback) {
        projPage.createProj(projectName);
        browser.waitForAngular();
        callback();
    });

    this.When(/^I enter Project Name "([^']*)"$/, function (projName, callback) {
        projPage.createProj(projName);
        browser.waitForAngular();
        callback();
    });

    this.When(/^I click delete project$/, function (callback) {
        projPage.clickProjDelete();
        callback();
    });

    this.Then(/^The project is deleted$/, function (callback) {
        // Write code here that turns the phrase above into concrete actions
        callback();
    });

    this.Then(/^The project is created$/, function (callback) {
        expect(projPage.projectTitle.getText()).to.eventually.equal(projectName).and.notify(callback);
    });

    this.Then(/^Project "([^']*)" is created$/, function (projName, callback) {
        expect(projPage.projectTitle.getText()).to.eventually.equal(projName).and.notify(callback);
    });

    this.Then(/^Project "([^']*)" is exists/, function (projName, callback) {
        expect(projPage.numProjectTiles.get(projName)).to.eventually.equal(projName).and.notify(callback);
    });


    this.When(/^I click to enter the project$/, function (callback) {
        browser.waitForAngular();
        projPage.clickProject();
        browser.waitForAngular();
        callback();
    });

    this.When(/^I Click on New Project Invite$/, function (callback) {
        browser.waitForAngular();
        projPage.clickProjInvLnk();
        browser.waitForAngular();
        callback();
    });

    this.When(/^I Click on Show more projects$/, function (callback) {
        browser.waitForAngular();
        projPage.clickShowMoreProj();
        browser.waitForAngular();
        callback();
    });

    this.When(/^I Accept the New Invite$/, function (callback) {
        browser.waitForAngular();
        projPage.clickAcceptInvBtn();
        browser.waitForAngular();
        callback();
    });

    this.Then(/^I click on go to data model$/, function (callback) {
        browser.waitForAngular();
        protoPage.btnDataModel.click();
        browser.waitForAngular();
        callback();
    });

    this.Then(/^I click on go to page flow$/, function (callback) {
        browser.waitForAngular();
        protoPage.btnPageFlow.click();
        browser.waitForAngular();
        callback();
    });


    this.When(/^I Upload project files$/, function (callback) {
        browser.waitForAngular();
        projPage.doUpload(uploadPath1);
        browser.sleep(1500);
        projPage.doUpload(uploadPath2);
        browser.sleep(1500);
        projPage.doUpload(uploadPath3);
        browser.sleep(1500);
        projPage.doUpload(uploadPath4);
        browser.sleep(1500);
        callback();
    });

    this.Then(/^"([^']*)" files are uploaded$/, function (num, callback) {
        browser.waitForAngular();
        expect(projPage.files.count()).to.eventually.equal(parseInt(num)).and.notify(callback);
    });



    this.Then(/^I check if there are console errors$/, function (callback) {
        browser.manage().logs().get('browser').then(function (browserLog) {
            var isErrFound = false;
            var whiteList = ['Range.detach', 'privacy_statement_EN.txt'];

            // Was something found in the console?
            if (browserLog.length !== 0) {
                var jsonLogs = JSON.stringify(browserLog);
                // Validate if the errors are known
                // Dev-note: returns true | false if an item is found not to be in the whitelist
                isErrFound = _.some(whiteList, function(item) {
                    return jsonLogs.indexOf(item) === -1;
                });
            }

            if (isErrFound) {
                console.log('Console log: ' + require('util').inspect(browserLog, {colors: true}));
                callback.fail('Unexpected Errors found: ' + browserLog.map(JSON.stringify).join(';\n'));
            } else {
                callback();
            }
        });
    });

    this.Given(/^I am on the prototype page$/, function (callback) {
        var comparisonStr = 'Prototype Pages';
        expect(projPage.protoPageTitle.getText().then(function(value){
            return protractor.promise.fulfilled(value.substr(0, comparisonStr.length))
        })).to.eventually.equal(comparisonStr).and.notify(callback);
    });

    this.When(/^I check if the herobanner title is correct$/, function (callback) {
        browser.waitForAngular();
        expect(projPage.checkHeroBannerTitle.getText()).to.eventually.equal('Eoin').and.notify(callback);
    });

    this.When(/^I Refresh the Page$/, function (callback) {
        browser.waitForAngular();
        browser.driver.navigate().refresh();
        browser.waitForAngular();
        callback();
    });

    this.Then(/^I check if the herobanner title is there$/, function (callback) {
        browser.waitForAngular();
        expect(projPage.checkHeroBannerTitle.getText()).to.eventually.equal('Eoin').and.notify(callback);
    });




};
