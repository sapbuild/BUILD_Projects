'use strict';

var expect = chai.expect;
var assert = chai.assert;

describe('Unit Test: ProjectsWidgetCtrl', function () {
    var scope;
    var httpBackend;
    var rootScope;
    var location;
    var mockedProjectFactory;
    var mockedAuthFactory;
    var mockedNavBarService;
    var mockedAsideFactoryService;
    var userId = 'ABC1234';
    var projectSettings = {id: '123456', name: 'Tester'};
    var userProfile = {
        _id: userId,
        email: 'test.user@sap.com',
        provider: 'local',
        acl_roles: ['standard', 'owner-8de1a2f5adceee1f09fa3cff']
    };
    var singleProject = {
        _id: '12344321',
        name: 'Test project One',
        isOwner: true,
        archived: false,
        created_by: 'ABC1234',
        user_list: [{_id: 'ABC1234', role: 'owner'}],
        invite_list: [],
        reject_list: [],
        picture: 'assets/images/user01.jpg',
        created_at: '2014-12-08T23:28:51.859Z',
        updated_at: '2014-12-08T23:28:51.859Z'
    };
    var archivedProject = {
        _id: '12344322',
        name: 'Test project Two',
        isOwner: true,
        archived: true,
        created_by: 'ABC1234',
        user_list: [{_id: 'ABC1234', role: 'owner'}],
        invite_list: [],
        reject_list: [],
        picture: 'assets/images/user01.jpg',
        created_at: '2014-12-08T23:28:51.859Z',
        updated_at: '2014-12-08T23:28:51.859Z'
    };
    var newProject = {
        _id: '12344323',
        name: 'Test project Three',
        isOwner: true,
        archived: true,
        created_by: 'ABC1234',
        user_list: [{_id: 'ABC1234', role: 'owner'}],
        invite_list: [],
        reject_list: [],
        picture: 'assets/images/user01.jpg',
        created_at: '2014-12-08T23:28:51.859Z',
        updated_at: '2014-12-08T23:28:51.859Z'
    };
    var projectsArray = [singleProject, archivedProject];

    var currentUserSpy;
    var currentPrefSpy;
    var currentUpdatePrefSpy;
    var projectFactoryQuerySpy;
    var projectFactorySaveSpy;
    var rootBroadcastSpy;
    var navBarServiceSpy;
    var orderByFilter;

    beforeEach(module('globals'));
    beforeEach(module('ui.router'));
    beforeEach(module('shell.navbar'));
    beforeEach(module('shell.aside'));
    beforeEach(module('account.auth'));
    beforeEach(module('common.utils'));
    beforeEach(module('project.projectsHomeWidget'));
    beforeEach(module('ngResource'));
    beforeEach(module('common.ui.elements'));
    beforeEach(module('project.services'));

    beforeEach(inject(function ($injector, $rootScope, $state, $location, $httpBackend, $q) {

        httpBackend = $httpBackend;

        // The $controller service is used to create instances of controllers
        var $controller = $injector.get('$controller');
        orderByFilter = $injector.get('$filter')('orderBy');

        scope = $rootScope.$new();
        $rootScope.currentProject = {}; // currentProject is a string id
        rootScope = $rootScope;
        location = $location;

        // Injected services
        var activeProjectService = $injector.get('ActiveProjectService');
        var navBarService = $injector.get('NavBarService');
        var asideFactory = $injector.get('AsideFactory');

        mockedProjectFactory = {
            query: function () {
                var deferred = $q.defer();
                deferred.$promise = deferred.promise;
                deferred.resolve(
                    projectsArray
                );
                return deferred;
            },
            save: function () {
                var deferred = $q.defer();
                deferred.$promise = deferred.promise;
                deferred.resolve(
                    newProject
                );
                return deferred;
            }
        };

        mockedAuthFactory = {
            getCurrentUser: function () {
                var deferred = $q.defer();
                deferred.$promise = deferred.promise;
                deferred.resolve(userProfile);
                return deferred;
            },
            getPreferences: function () {
                var deferred = $q.defer();
                deferred.$promise = deferred.promise;
                deferred.resolve(
                    {
                        _id: userId,
                        preferences: {
                            projectsHelp: {
                                disable: false
                            },
                            help: {
                                disable: false
                            }
                        }
                    }
                );
                return deferred.$promise;
            },
            updatePreferences: function () {
                var deferred = $q.defer();
                deferred.$promise = deferred.promise;
                deferred.resolve(
                    {
                        _id: userId,
                        preferences: {
                            projectsHelp: {
                                disable: false
                            },
                            help: {
                                disable: false
                            }
                        }
                    }
                );
                return deferred.$promise;
            }
        };

        // Create spy
        currentUserSpy = sinon.spy(mockedAuthFactory, 'getCurrentUser');
        currentPrefSpy = sinon.spy(mockedAuthFactory, 'getPreferences');
        currentUpdatePrefSpy = sinon.spy(mockedAuthFactory, 'updatePreferences');
        projectFactoryQuerySpy = sinon.spy(mockedProjectFactory, 'query');
        projectFactorySaveSpy = sinon.spy(mockedProjectFactory, 'save');
        rootBroadcastSpy = sinon.spy(rootScope, '$broadcast');
        navBarServiceSpy = sinon.spy(navBarService, 'updateHeading');

        // Set projectService to match test project, no other way to set it
        activeProjectService.id = projectSettings.id;
        activeProjectService.name = projectSettings.name;

        var mockState = {
            params: {
                currentProject: ''
            },
            go: function (to, params, options) {

                scope.TESTparams = params;
            }
        };
        $controller('ProjectsWidgetCtrl as projectsHomeWidget', {
            $state: mockState,
            $location: location,
            $scope: scope,
            Auth: mockedAuthFactory,
            ProjectFactory: mockedProjectFactory,
            ActiveProjectService: activeProjectService,
            AsideFactory: asideFactory,
            NavBarService: navBarService,
            uiError: $injector.get('uiError'),
            httpError: $injector.get('httpError')
        });

    }));

    beforeEach(function () {
        currentUserSpy.reset();
        currentPrefSpy.reset();
        currentUpdatePrefSpy.reset();
        projectFactorySaveSpy.reset();
        projectFactoryQuerySpy.reset();
        rootBroadcastSpy.reset();
        navBarServiceSpy.reset();
        scope.projectsHomeWidget.init();
        scope.$apply();
    });

    it('Testing the ProjectsWidgetCtrl: default options', function () {
        expect(rootScope.currentProject).to.eql({});
        expect(scope.projectsHomeWidget.loading).to.eql(false);
        expect(scope.projectsHomeWidget.user._id).to.be.eq(userId);
        expect(scope.projectsHomeWidget.user.acl_roles[0]).to.be.eq('standard');
        expect(scope.projectsHomeWidget.canCreate).to.be.eq(true);
        expect(currentUserSpy.called).to.eql(true);
        expect(currentPrefSpy.called).to.eql(true);
        expect(navBarServiceSpy.called).to.eq(true);
        assert(Array.isArray(scope.projectsHomeWidget.activeProjects), 'Should be empty when loaded first');
        expect(scope.projectsHomeWidget.activeProjects.length).to.equal(1);
        expect(scope.projectsHomeWidget.inviteProjects.length).to.equal(0);
        expect(scope.projectsHomeWidget.archivedProjects.length).to.equal(1);
        expect(scope.projectsHomeWidget.isCreatingNewProject).to.equal(false);
        expect(projectFactoryQuerySpy.called).to.eql(true);
    });

    it('Testing the ProjectsWidgetCtrl: validate create project functionality', function () {
        httpBackend.expect('POST', '/api/projects').respond(200, {
            _id: '12344324',
            name: 'Test project Four',
            isOwner: true,
            archived: false,
            created_by: 'ABC1234',
            user_list: [{_id: 'ABC1234', role: 'owner'}],
            invite_list: [],
            reject_list: [],
            picture: 'assets/images/user01.jpg',
            created_at: '2014-12-08T23:28:51.859Z',
            updated_at: '2014-12-08T23:28:51.859Z'
        });

        // These need to be called before tests pass
        expect(currentUserSpy.called).to.eql(true);
        expect(currentPrefSpy.called).to.eql(true);

        expect(scope.projectsHomeWidget.canCreate).to.eql(true);
        expect(projectFactoryQuerySpy.called).to.eql(true);
        expect(scope.projectsHomeWidget.loading).to.eql(false);
        expect(scope.projectsHomeWidget.user._id).to.be.eq(userId);
        expect(scope.projectsHomeWidget.activeProjects.length).to.equal(1);

        scope.projectsHomeWidget.createProject();

        expect(scope.projectsHomeWidget.activeProjects.length).to.equal(1);

        expect(scope.projectsHomeWidget.inviteProjects.length).to.equal(0);
        expect(scope.projectsHomeWidget.archivedProjects.length).to.equal(1);
        expect(scope.projectsHomeWidget.isCreatingNewProject).to.equal(false);

        expect(projectFactorySaveSpy.called).to.eql(true);
    });

    it('Testing the ProjectsWidgetCtrl: validate open project functionality', function () {
        expect(rootScope.currentProject).to.eql({});
        expect(scope.TESTparams).to.be.undefined;
        scope.projectsHomeWidget.openProject(2, 'Test', true);

        expect(scope.TESTparams.currentProject).to.equal(2);
        expect(rootScope.currentProject).to.equal(2);
        expect(scope.projectsHomeWidget.isCreatingNewProject).to.equal(false);
        expect(rootBroadcastSpy.calledWith('shell.aside.updated', {
            menuSelected: 'prototype'
        })).to.be.true;
        expect(scope.projectsHomeWidget.isCreatingNewProject).to.equal(false);
    });

    it('Testing the ProjectsWidgetCtrl: validate show new project functionality', function () {
        expect(scope.projectsHomeWidget.isCreatingNewProject).to.equal(false);
        scope.projectsHomeWidget.showNewProjectForm();
        expect(scope.projectsHomeWidget.isCreatingNewProject).to.equal(true);
    });

    it('Testing the ProjectsWidgetCtrl: validate close project functionality', function () {
        scope.projectsHomeWidget.activeProjects = [];
        expect(scope.projectsHomeWidget.isCreatingNewProject).to.equal(false);
        scope.projectsHomeWidget.showNewProjectForm();
        expect(scope.projectsHomeWidget.isCreatingNewProject).to.equal(true);

        expect(scope.projectsHomeWidget.activeProjects.length).to.equal(1);
        expect(scope.projectsHomeWidget.activeProjects[0].archived).to.equal(false);
        expect(scope.projectsHomeWidget.activeProjects[0].isNew).to.equal(true);
        expect(scope.projectsHomeWidget.activeProjects[0].name).to.equal('');
        scope.projectsHomeWidget.cancelNewProject();
        expect(scope.projectsHomeWidget.isCreatingNewProject).to.equal(false);
        expect(scope.projectsHomeWidget.activeProjects.length).to.equal(0);
    });


     it('Testing the ProjectsWidgetCtrl: Project list - orderBy filter test', function () {

        var  predicateArray = ['+isNew', '-stats.created_at', '-orderByIndex'];
        expect(scope.projectsHomeWidget.predicate).to.eql(predicateArray)

        var arrayToBeOrder = [];
        arrayToBeOrder.push({archived: false, isNew: true, name: '1', stats: {created_at: '2014-12-08T23:28:51.859Z'}, orderByIndex: 1});
        arrayToBeOrder.push({archived: false, isNew: true, name: '3', stats: {created_at: '2014-12-08T23:28:51.859Z'}, orderByIndex: 3});
        arrayToBeOrder.push({archived: false, isNew: true, name: '11', stats: {created_at: '2014-12-08T23:28:55.859Z'}, orderByIndex: 11});
        arrayToBeOrder.push({archived: false, isNew: true, name: '4', stats: {created_at: '2014-12-08T23:28:51.859Z'}, orderByIndex: 4});
        arrayToBeOrder.push({archived: false, isNew: true, name: '7', stats: {created_at: '2014-12-08T23:28:51.859Z'}, orderByIndex: 7});
        arrayToBeOrder.push({archived: false, isNew: true, name: '12(1)', stats: {created_at: '2014-12-06T23:28:55.859Z'}, orderByIndex: 12});
        arrayToBeOrder.push({archived: false, isNew: true, name: '2', stats: {created_at: '2014-12-08T23:28:51.859Z'}, orderByIndex: 2});
        arrayToBeOrder.push({archived: false, isNew: true, name: '12', stats: {created_at: '2014-12-08T23:28:55.859Z'}, orderByIndex: 12});
        arrayToBeOrder.push({archived: false, isNew: true, name: '8', stats: {created_at: '2014-12-08T23:28:51.859Z'}, orderByIndex: 8});
        arrayToBeOrder.push({archived: false, isNew: true, name: '11(0)', stats: {created_at: '2014-12-07T23:28:55.859Z'}, orderByIndex: 1});
        arrayToBeOrder.push({archived: false, isNew: true, name: '9', stats: {created_at: '2014-12-08T23:28:51.859Z'}, orderByIndex: 9});
        arrayToBeOrder.push({archived: false, name: '10', stats: {created_at: '2014-12-08T23:28:55.859Z'}});
        arrayToBeOrder.push({archived: false, isNew: true, name: '5', stats: {created_at: '2014-12-08T23:28:51.859Z'}, orderByIndex: 5});
        arrayToBeOrder.push({archived: false, isNew: true, name: '6', stats: {created_at: '2014-12-08T23:28:51.859Z'}, orderByIndex: 6});
        arrayToBeOrder.push({archived: false, isNew: true, name: '12(0)', stats: {created_at: '2014-12-05T23:28:55.859Z'}, orderByIndex: 12});
        arrayToBeOrder.push({archived: false, name: '13', stats: {created_at: '2014-12-10T23:27:55.859Z'}});
        arrayToBeOrder.push({archived: false, isNew: true, name: '11(1)', stats: {created_at: '2014-12-07T23:28:55.859Z'}, orderByIndex: 11});
        arrayToBeOrder.push({archived: false, name: '14', stats: {created_at: '2014-12-09T23:27:55.859Z'}});

        var filterResult = orderByFilter(arrayToBeOrder, scope.projectsHomeWidget.predicate);

        expect(filterResult[0].name).to.eql('12');
        expect(filterResult[1].name).to.eql('11');
        expect(filterResult[2].name).to.eql('9');
        expect(filterResult[3].name).to.eql('8');
        expect(filterResult[4].name).to.eql('7');
        expect(filterResult[5].name).to.eql('6');
        expect(filterResult[6].name).to.eql('5');
        expect(filterResult[7].name).to.eql('4');
        expect(filterResult[8].name).to.eql('3');
        expect(filterResult[9].name).to.eql('2');
        expect(filterResult[10].name).to.eql('1');

        //+isNew & -orderByIndex
        expect(filterResult[11].name).to.eql('11(1)'); //11, 2014-12-07
        expect(filterResult[12].name).to.eql('11(0)'); //1, 2014-12-07

         //+isNew , -orderByIndex & -stats.created_at
        expect(filterResult[13].name).to.eql('12(1)'); //12, 2014-12-06
        expect(filterResult[14].name).to.eql('12(0)'); //12, 2014-12-05

        //based on -stats.created_at
        expect(filterResult[15].name).to.eql('13'); //2014-12-10
        expect(filterResult[16].name).to.eql('14'); //2014-12-09
        expect(filterResult[17].name).to.eql('10'); //2014-12-08

    });

    it('Testing the ProjectsWidgetCtrl: user is a guest', function () {
        // Reset spy, will have been set by the beforeEach but needs to be reset for this test
        projectFactoryQuerySpy.reset();
        currentUserSpy.reset();
        navBarServiceSpy.reset();

        // Reset user with guest role
        userProfile = {
            _id: userId,
            email: 'guest.user@example.com',
            provider: 'local',
            acl_roles: ['guest', 'owner-8de1a2f5adceee1f09fa3cff']
        };

        // Manually need to call this as beforeEach to ensure getCurrentUser has the new profile
        scope.projectsHomeWidget.init();
        scope.$apply();

        expect(rootScope.currentProject).to.eql({});
        expect(scope.projectsHomeWidget.loading).to.eql(false);
        expect(scope.projectsHomeWidget.user._id).to.be.eq(userId);
        expect(scope.projectsHomeWidget.user.email).to.be.eq('guest.user@example.com');
        expect(scope.projectsHomeWidget.user.acl_roles[0]).to.be.eq('guest');
        expect(scope.projectsHomeWidget.canCreate).to.be.eq(false);
        expect(currentUserSpy.called).to.eq(true);
        expect(projectFactoryQuerySpy.called).to.eq(false);
        expect(navBarServiceSpy.called).to.eq(true);
        assert(Array.isArray(scope.projectsHomeWidget.activeProjects), 'Should be empty when loaded first');
        expect(scope.projectsHomeWidget.activeProjects.length).to.equal(0);
        expect(scope.projectsHomeWidget.inviteProjects.length).to.equal(0);
        expect(scope.projectsHomeWidget.archivedProjects.length).to.equal(0);
        expect(scope.projectsHomeWidget.isCreatingNewProject).to.equal(false);
    });

});
