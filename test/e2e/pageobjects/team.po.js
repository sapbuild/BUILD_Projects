/**
 * Login Selenium Page Object for Norman
 */

'use strict';

var Team = function (value, cb) {
    if(value.length > 0){
        //var url = value.charAt(0) == '/' ? value : "/" + value;
        browser.get(value);
    }
    if (typeof cb === 'function') cb();
};


Team.prototype = Object.create({}, {

    //SELECTORS
    btnAddPeople:       { get:   function ()     { return element(by.css('.team-add-people-button')); }},
    btnAdd:             { get:   function ()     { return element(by.css('.team-invite-popover-add-button')); }},
    btnSendInvites:     { get:   function ()     { return element(by.buttonText('INVITE')); }},
    confirmRevoke:     { get:   function ()     { return element(by.buttonText('REVOKE')); }},
    txtEmail:     {   get: function ()     { return element(by.model('user.principal'));}},
    txtPassword:  {   get: function ()     { return element(by.model('user.password'));}},
    btnLogIn:     {   get: function ()     { return element(by.css('.login-btn-submit'));}},

    inviteesItem:       { get:   function ()     { return element(by.binding('invitee.email')); }},
    inviteesItemCount:       { get:   function ()     { return element.all(by.binding('invitee.email')); }},

    pendingInvites:     { get:   function ()     { return element(by.css('.pending-invite-count-text')); }},
    pendingInvitesCount:     { get:   function ()     { return element(by.binding('team.pendingInviteList.length')); }},

    clickInviteLink:{   value: function()           { this.pendingInvites.click()}},

    emailTeamMbr:       { get:   function ()     { return element(by.model('team.newUserEmail')); }},

    revokeInvite:      { get:   function ()     { return element(by.css('.revoke')); }},
    clickRevokeInvite:  {   value: function()           { this.revokeInvite.click()}},
    clickConfRevoke: {   value: function()           { this.confirmRevoke.click()}},
    clickAddPeople:     {   value: function()           { this.btnAddPeople.click()}},
    clickEmailAdd:      {   value: function()           { this.emailTeamMbr.click()}},
    clickAdd:           {   value: function()           { this.btnAdd.click()}},
    clickSendInvite:    {   value: function()           { this.btnSendInvites.click()}},

    enterEmail: {   value: function (keys)      { return this.emailTeamMbr.sendKeys(keys);}},

    teamEmailInviteErrorToast: {get:   function ()            { return element(by.css('[ng-if="userEmailForm.newUserEmail.$dirty"]'));}},

    //actions
    loginEnterEmail:     {   value: function (keys)      { return this.txtEmail.sendKeys(keys);}},
    enterPassword:  {   value: function (keys)      { return this.txtPassword.sendKeys(keys);}},
    clickLogin:     {   value: function()           { this.btnLogIn.click()}},

    addEmail:{ value: function (email) {
        this.enterEmail(email);
        this.clickAdd();
    }},

    add2ndEmail:{ value: function (email) {
        this.enterEmail(email);
        this.clickAdd();
    }},

    login:        {   value: function (email, password)  {
        this.loginEnterEmail(email);
        this.enterPassword(password);
        this.clickLogin();
    }}
});

module.exports = Team;
