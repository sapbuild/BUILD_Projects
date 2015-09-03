'use strict';
var _ = require('norman-client-tp').lodash;

// Controller for page showing users invited to a project
// @ngInject
module.exports = function ($rootScope, $scope, $state, $log, AsideFactory, Auth, ProjectFactory, ActiveProjectService, uiError) {

    var vm = this;

    vm.errorStatus = '';

    vm.newInvite = {};

    // Users assigned to the project who have accepted their invites
    vm.userList = [];

    // Users assigned to the project who have accepted their invites
    vm.pendingInviteList = [];

    // Users who have rejected their invite to the project
    vm.rejectInviteList = [];

    // This is used to populate the list of invitees in the popover (should just be a list of email strings)
    vm.addUserInviteList = [];

    // The model object used in the email field
    vm.newUserEmail = '';

    // Flag used to check if popover is already open
    vm.popoverIsOpen = false;

    vm.user = Auth.getCurrentUser();

    vm.showAllTeamMembers = false;

    vm.numOfHidden = 0;

    vm.isCurrentUser = isCurrentUser;
    vm.isOwner = isOwner;
    vm.addEmailToInviteList = addEmailToInviteList;
    vm.getTeamMember = getTeamMember;
    vm.setOwner = setOwner;
    vm.confirmOwner = confirmOwner;
    vm.sendInvites = sendInvites;
    vm.handleOpenPopover = handleOpenPopover;
    vm.cancelInvites = cancelInvites;
    vm.removeInvite = removeInvite;
    vm.closeMe = closePendingPopup;
    vm.revokeEmail = revokeEmail;

    init();



    // ------------------
    // Private functions
    // ------------------

    /**
     * @name init
     * @desc Initialize the controller
     */
    function init() {
        vm.getTeamMember();

        // Keep page title updated
        ActiveProjectService.updateHeading();

        $scope.$on('ANGULAR_DRAG_START', function ($event, channel) {
            if (channel === 'owner') {
                var container = document.getElementsByClassName('team-container')[0];
                var containerElement = angular.element(container);
                containerElement.addClass('team-owner-dragging');
            }

        });
        $scope.$on('ANGULAR_DRAG_END', function ($event, channel) {
            if (channel === 'owner') {
                var container = document.getElementsByClassName('team-container')[0];
                var containerElement = angular.element(container);
                containerElement.removeClass('team-owner-dragging');
            }
        });
    }


    /**
     * @name isCurrentUser
     * @desc
     * @param  {[type]}  user [description]
     * @return {Boolean}      [description]
     */
    function isCurrentUser(user) {
        return (user._id === vm.user._id) ? 0 : 1;
    }

    /**
     * @name isOwner
     * @desc Takes the user object and compares against the project's userList to determine if they are the owner
     * @param  {object}  user The user object to be compared against the userList
     * @return {boolean}      Returns true or false to show if the user is the project owner
     */
    function isOwner(user) {
        for (var i = 0; i < vm.userList.length; i++) {
            if (vm.userList[i]._id === user._id && vm.userList[i].role === 'owner') {
                return true;
            }
        }
        return false;
    }

    /**
     * @name getTeamMember
     * @desc Get the full list of team member for that project
     */
    function getTeamMember() {
        ProjectFactory.getTeam({
            id: ActiveProjectService.id
        }).$promise.then(function (data) {
            handleQueryResponseTeamMember(data);
        }).catch(function (error) {
            uiError.create({
                content: error.data.error,
                dismissOnTimeout: false
            });
        });
    }

    /**
     * @name addEmailToInviteList
     * @desc This is triggered when a user hits add, which adds an email to the invite list,
     * and then resets the email field to make it ready for a new entry
     * @param {String} sEmail The email being added to the project
     **/
    function addEmailToInviteList(sEmail) {
        for (var i = 0; i < vm.pendingInviteList.length; i++) {
            if (sEmail === vm.pendingInviteList[i].email) {
                uiError.create({
                    content: 'An invitation has already been sent to this address',
                    dismissOnTimeout: true,
                    timeout: 3000,
                    dismissButton: true
                });
                return;
            }
        }
        for (var n = 0; n < vm.userList.length; n++) {
            if (sEmail === vm.userList[n].email) {
                uiError.create({
                    content: 'This user is already on your team',
                    dismissOnTimeout: true,
                    timeout: 3000,
                    dismissButton: true
                });
                return;
            }
        }
        for (var m = 0; m < vm.addUserInviteList.length; m++) {
            if (sEmail === vm.addUserInviteList[m].email) {
                uiError.create({
                    content: 'This email has already been added',
                    dismissOnTimeout: true,
                    timeout: 3000,
                    dismissButton: true
                });
                return;
            }
        }
        if (!sEmail) {
            // show invalid email error on UI
            return;
        }
        vm.addUserInviteList.push({
            email: sEmail
        });
        vm.newUserEmail = '';
    }

    /**
     * @name setOwner
     * @desc Updates the owner of the project to be a new user.
     * @param {object} user The user which is going to be set as the project's new owner
     */
    function setOwner(user) {
        if (vm.isOwner(vm.user)) {
            vm.newOwnerUser = user;
            $rootScope.$broadcast('dialog-open', {
                elementId: 'npTeamOwnerChangeDialog',
                payload: user
            });
        }
    }

    /**
     * @name confirmOwner
     * @desc Set the owner of a project
     * @param  {string} ownerId The user ID of the new project owner
     */
    function confirmOwner(ownerId) {
        ProjectFactory.setOwner({
            id: ActiveProjectService.id
        }, {
            userId: ownerId
        }).$promise.then(function () {
            vm.getTeamMember();
            if (vm.user._id !== ownerId) {
                AsideFactory.pop('settings');
            }
        }).catch(function (error) {
            uiError.create({
                content: error.data.message,
                dismissOnTimeout: false
            });
        });
    }

    /**
     * @name sendInvites
     * @desc When a user hits send invites,
     * send an invite to all of the users in the list before resetting the list and the user field
     **/
    function sendInvites() {
        if (vm.addUserInviteList.length) {
            // make call to send invites here
            ProjectFactory.createInvite({
                id: ActiveProjectService.id
            }, {
                email_list: vm.addUserInviteList
            }).$promise.then(function (data) {
                vm.getTeamMember();

                var rejectedEmails = [];
                var optOutEmails = [];
                _.forEach(data.newInvitee, function (n) {
                    if (n.status === 'rejected') {
                        rejectedEmails.push({
                            name: 'Email',
                            value: n.email,
                            message: n.email
                        });
                    }
                    if (n.status === 'opt-out') {
                        optOutEmails.push({
                            name: 'Email',
                            value: n.email,
                            message: n.email
                        });
                    }
                });

                if (rejectedEmails.length > 0) {
                    uiError.create({
                        title: 'These email addresses below can’t currently be added. If you’re sure they are valid, contact the Build Administrator.',
                        content: rejectedEmails
                    });
                }

                if (optOutEmails.length > 0) {
                    uiError.create({
                        title: 'The owners of the following email addresses have told the Build team they don’t want to received e-mail notifications, so they will be invited via their Build Home page:',
                        content: optOutEmails
                    });
                }
            }).catch(function (error) {
                uiError.create({
                    content: error.data.error,
                    dismissOnTimeout: false
                });

            });
        }

        vm.addUserInviteList = [];
        vm.newUserEmail = '';
        vm.popoverIsOpen = false;
    }

    /**
     * @name handleOpenPopover
     * @desc Set the popup status to open
     */
    function handleOpenPopover() {
        vm.popoverIsOpen = true;
    }

    /**
     * @name cancelInvites
     * @desc When a user hits cancel invites, reset the invite list and the new email field
     **/
    function cancelInvites() {
        vm.addUserInviteList = [];
        vm.newUserEmail = '';
        vm.popoverIsOpen = false;
    }

    /**
     * @name removeInvite
     * @desc Removes an email from the new set to emails that the invites will be sent to
     * @param {integer} index The index of the email in the new user list
     */
    function removeInvite(index) {
        vm.addUserInviteList.splice(index, 1);
    }

    /**
     * @name handleQueryResponseTeamMember
     * @desc Handle a query response for the list of team member
     * @param  {obejct} response A response object
     */
    function handleQueryResponseTeamMember(response) {
        vm.pendingInviteList = response.invite_list;
        vm.rejectInviteList = response.reject_list;
        vm.userList = response.user_list;
    }

    /**
     * @name closePendingPopup
     * @desc close the pending popup when the user click on the red bin in the list of pending invite
     */
    function closePendingPopup() {
        $rootScope.$broadcast('popup-close');
    }

    /**
     * @name revokeEmail
     * @desc Revoke an email from the list of pending emails
     * @param  {string} email The email to be removed
     */
    function revokeEmail(email) {
        ProjectFactory.revokePendingInvite({
            email: email
        }, {
            _id: ActiveProjectService.id
        }).$promise.then(function () {
            vm.getTeamMember();
        }).catch(function (res) {
            uiError.create({
                content: res.data.error,
                dismissOnTimeout: false
            });
        });
    }

};
