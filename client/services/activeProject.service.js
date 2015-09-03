'use strict';

var _ = require('norman-client-tp').lodash;

// @ngInject
module.exports = function ($rootScope, $log, globals, ProjectFactory, NavBarService) {

    var _id = null;
    var _name = null;

    var that = {
        set id(val) {
            if (_id !== val) {
                _id = val;
                globals.displayNonPersistant = (_id !== null);
                $rootScope.$broadcast('projectChanged', val);
            }
        },
        get id() {
            return _id;
        },
        set name(val) {
            _name = val;
        },
        get name() {
            return _name;
        }
    };
    // Method to ensure that the heading is updated, used in Team and Prototype - this will also ensure that upon a page
    // refresh, the project title is maintained on different pages i.e hero banner.
    that.updateHeading = function () {
        if (_.isEmpty(that.name)) {
            ProjectFactory.get({
                    id: that.id
                }).$promise
                .then(function (res) {
                    NavBarService.updateHeading(res.name);
                    that.name = res.name;
                })
                .catch(function error(res) {
                    // uiError is not used here as the user should not be shown an error if the page title is not displayed - the next time
                    // they select a project, the title will be updated automatically
                    $log.log(res);
                });
        }
        else {
            // Keep heading updated
            NavBarService.updateHeading(that.name);
        }
    };

    return that;
};
