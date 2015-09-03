/*eslint no-unused-expressions: 0 */
'use strict';

var expect = chai.expect;

describe('Unit Test: SettingsCtrl', function () {
    var scope;
    var httpBackend;
    var uiError = {
        create: function () {
        }
    };
    var httpError = {
        create: function () {
        }
    };
    var projectSettings = {id: '123456', name: 'Tester'};
    var errorSpy = sinon.spy(uiError, 'create');
    var httpErrorSpy = sinon.spy(httpError, 'create');
    var activeProjectService = null;
    var activeProjectServiceSpy = null;

    beforeEach(module('ui.router'));
    beforeEach(module('shell.aside'));
    beforeEach(module('shell.navbar'));
    beforeEach(module('project.settings'));
    beforeEach(module('project.services'));
    beforeEach(module('ngResource'));
    beforeEach(module('account.auth'));
    beforeEach(module('common.ui.elements'));

    beforeEach(inject(function ($injector, $controller, $rootScope, $httpBackend) {
        scope = $rootScope.$new();
        httpBackend = $httpBackend;

        activeProjectService = $injector.get('ActiveProjectService');
        activeProjectService.id = projectSettings.id;
        activeProjectService.name = projectSettings.name;
        activeProjectServiceSpy = sinon.spy(activeProjectService, 'updateHeading');
        $controller('ProjectSettingsCtrl', {
            $scope: scope,
            ActiveProjectService: activeProjectService,
            ProjectFactory: $injector.get('ProjectFactory'),
            uiError: uiError,
            httpError: httpError
        });
    }));

    afterEach(function () {
        httpBackend.verifyNoOutstandingRequest();
        errorSpy.reset();
        httpErrorSpy.reset();
    });

    it('Should initialise', function () {
        httpBackend
            .expect('GET', '/api/projects/' + projectSettings.id)
            .respond(200, projectSettings);

        expect(scope.projectLoaded).to.eq(false);
        expect(scope.project.archived).to.eq(false);

        httpBackend.flush();
        expect(scope.projectLoaded).to.eq(true);
        activeProjectServiceSpy.should.not.have.been.called;
    });

    it('Should initialise when server error', function () {
        httpBackend
            .expect('GET', '/api/projects/' + projectSettings.id)
            .respond(400, {data: {error: ''}});

        expect(scope.projectLoaded).to.eq(false);
        expect(scope.project.archived).to.eq(false);

        httpBackend.flush();
        expect(scope.projectLoaded).to.eq(false);
        errorSpy.should.have.been.called;
        httpErrorSpy.should.have.been.called;
    });

    it('Should get the archive action name', function () {
        scope.project.archived = false;
        expect(scope.archiveActionName()).to.eq('archive');

        scope.project.archived = true;
        expect(scope.archiveActionName()).to.eq('unarchive');
    });

    it('Should archive/unarchive a project', function () {
        httpBackend
            .expect('PUT', '/api/projects/' + projectSettings.id + '/settings?archived=true')
            .respond(200, {});

        scope.enableArchiveButton = true;
        scope.project.archived = false;
        expect(scope.enableArchiveButton).to.eq(true);
        expect(scope.project.archived).to.eq(false);

        scope.archiveProject();
        expect(scope.enableArchiveButton).to.eq(false);
        expect(scope.project.archived).to.eq(true);

        scope.archiveProject();
        expect(scope.enableArchiveButton).to.eq(false);
        expect(scope.project.archived).to.eq(false);
    });

    it('Should catch errors when archiving/unarchiving a project', function () {
        httpBackend
            .expect('GET', '/api/projects/' + projectSettings.id)
            .respond(200, projectSettings);

        httpBackend
            .expect('PUT', '/api/projects/' + projectSettings.id + '/settings?archived=true')
            .respond(400, {});

        scope.archiveProject();
        httpBackend.flush();

        errorSpy.should.have.been.called;
        httpErrorSpy.should.have.been.called;
    });
});
