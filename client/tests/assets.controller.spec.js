'use strict';

var expect = chai.expect;
var assert = chai.assert;

describe('Unit Test: AssetsCtrl', function () {
    var scope;
    var httpBackend;
    var location;
    var mockedAuthFactory;
    var mockedProjectFactory;
    var PROJECT_ID = '548634330dad778c2dcbd9fb';
    var projectSettings = {
        id: PROJECT_ID,
        name: 'Test Project'
    };
    var mockedAsideFactoryService = {
        pop: function () {},
        push: function () {}
    };
    var mockedUiError = {},
        mockedHttpError = {};
    var USER_ID = '548634330dad778c2dcbd9fb';
    var projectFactoryGetSpy;
    var projectFactoryDeleteSpy;
    var newProject = {
        _id: '12344323',
        name: 'Test project Three',
        isOwner: true,
        archived: true,
        created_by: 'ABC1234',
        user_list: [{
            _id: 'ABC1234',
            role: 'owner'
        }],
        invite_list: [],
        reject_list: [],
        picture: 'assets/images/user01.jpg',
        created_at: '2014-12-08T23:28:51.859Z',
        updated_at: '2014-12-08T23:28:51.859Z'
    };

    beforeEach(module('globals'));
    beforeEach(module('ui.router'));
    beforeEach(module('shell.navbar'));
    beforeEach(module('ngResource'));
    beforeEach(module('project.document'));
    beforeEach(module('project.services'));

    beforeEach(inject(function ($injector, $rootScope, $state, $location, $httpBackend, $q) {
        httpBackend = $httpBackend;

        // The $controller service is used to create instances of controllers
        var $controller = $injector.get('$controller');

        scope = $rootScope.$new();
        $rootScope.currentProject = 'abcd1234'; // currentProject is just a string id
        location = $location;

        mockedAuthFactory = {
            getCurrentUser: function () {
                return {
                    _id: USER_ID,
                    email: 'test.user@admin.com'
                };
            }
        };

        mockedProjectFactory = {
            deleteDocument: function () {
                var deferred = $q.defer();
                deferred.$promise = deferred.promise;
                deferred.resolve(
                    [newProject]
                );
                return deferred;
            },
            getDocument: function () {
                var deferred = $q.defer();
                deferred.$promise = deferred.promise;
                deferred.resolve([{
                    _id: '55db09fe5dd2c21c6b47a9cf',
                    filename: 'LargeImageOne.png',
                    length: 8283876,
                    uploadDate: '2015-08-24T12:11:42.989Z',
                    metadata: {
                        created_at: '2015-08-24T12:11:42.834Z',
                        updated_at: '2015-08-24T12:11:42.834Z',
                        project: '0af426a8604c87d80a9ddcf9',
                        contentType: 'image/png',
                        extension: 'png',
                        version: 1,
                        isThumb: false,
                        hasThumb: true,
                        created_by: '55db09e35dd2c21c6b47a9c7'
                    },
                    md5: '96e5cc21ff8e88d76cab4abe347fedbc'
                }, {
                    _id: '55db11f2995f900c6d41db5a',
                    filename: 'LargeImageTwo.jpeg',
                    length: 320614,
                    uploadDate: '2015-08-24T12:45:38.175Z',
                    metadata: {
                        created_at: '2015-08-24T12:45:38.146Z',
                        updated_at: '2015-08-24T12:45:38.146Z',
                        project: '0af426a8604c87d80a9ddcf9',
                        contentType: 'image/jpeg',
                        extension: 'jpeg',
                        version: 1,
                        isThumb: false,
                        hasThumb: false,
                        created_by: '55db09e35dd2c21c6b47a9c7'
                    },
                    md5: 'cf4ffcc0fa1c5cff148a75b02c1b5121'
                }]);
                return deferred;
            }
        };

        var activeProjectService = $injector.get('ActiveProjectService');
        activeProjectService.id = projectSettings.id;
        activeProjectService.name = projectSettings.name;

        projectFactoryGetSpy = sinon.spy(mockedProjectFactory, 'getDocument');
        projectFactoryDeleteSpy = sinon.spy(mockedProjectFactory, 'deleteDocument');

        $controller('DocumentCtrl as vm', {
            $location: location,
            $scope: scope,
            Auth: mockedAuthFactory,
            ProjectFactory: mockedProjectFactory,
            AsideFactory: mockedAsideFactoryService,
            ActiveProjectService: activeProjectService,
            uiError: mockedUiError,
            httpError: mockedHttpError
        });
    }));

    beforeEach(function () {
        projectFactoryDeleteSpy.reset();
        projectFactoryGetSpy.reset();
        scope.$apply();
    });

    it('Testing the DocumentCtrl', function () {
        expect(scope.vm.user._id).to.be.eq(USER_ID);
        assert(Array.isArray(scope.vm.docs), 'Should be empty when loaded first');
        projectFactoryGetSpy.should.have.been.calledOnce;
        expect(scope.vm.docs.length).to.be.eq(2);
        expect(scope.vm.docs[1].url).to.have.string('thumbOnly=true');
        expect(scope.vm.docs[0].url).not.to.have.string('thumbOnly=true');
        expect(scope.vm.docs[0].fileurl).not.to.have.string('download');
        expect(scope.vm.loading).to.be.false;
    });
});
