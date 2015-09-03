'use strict';

var expect = chai.expect;

describe('ActiveProjectService Test', function () {

    beforeEach(module('globals'));
    beforeEach(module('shell.navbar'));
    beforeEach(module('project.services'));
    beforeEach(module('account.auth'));

    it('Testing ActiveProject defaults', inject(function (ActiveProjectService) {
        expect(ActiveProjectService.id).to.be.eq(null);
        expect(ActiveProjectService.name).to.be.eq(null);
        ActiveProjectService.id = '12345abc';
        ActiveProjectService.name = 'Build Project x';
        expect(ActiveProjectService.id).to.be.eq('12345abc');
        expect(ActiveProjectService.name).to.be.eq('Build Project x');
    }));

    it('should broadcast an event whenever the project id changes', inject(function ($rootScope, ActiveProjectService) {
        var spy = sinon.spy($rootScope, '$broadcast');
        var projectId = '12345abc';
        expect(ActiveProjectService.id).to.not.be.equal(projectId);
        ActiveProjectService.id = projectId;
        expect(spy.calledWith('projectChanged', projectId)).to.be.ok;
        $rootScope.$broadcast.restore();
    }));

    it('should not broadcast the project changed event if the same id is set again', inject(function ($rootScope, ActiveProjectService) {
        var spy = sinon.spy($rootScope, '$broadcast');
        var projectId = '12345abc';
        ActiveProjectService.id = projectId;
        ActiveProjectService.id = projectId;
        expect(spy.callCount).to.be.equal(1);
        $rootScope.$broadcast.restore();
    }));
});
