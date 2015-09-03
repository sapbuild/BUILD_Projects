'use strict';

var expect = require('norman-testing-tp').chai.expect;
var ProjectAPI = require('../api/ProjectsRestApi');
var api = new ProjectAPI();

var USER_ID = '5507028694267057674862a3';
var projectId;

describe('Project Service Test', function () {
    this.timeout(15000);
    var projectService;

    before('Setup assetService', function (done) {
        var registry = require('norman-common-server').registry;
        projectService = registry.getModule('ProjectService');
        done();
    });

    after(function (done) {
        // Only required for one user to do this task!
        api.resetDB(done);
    });

    it('projectService create model', function (done) {
        projectService.checkSchema(done);
    });

    it('projectService shutdown', function (done) {
        projectService.shutdown(done);
    });

    it('projectService Get Project - should not return a project if the state of fields is not correct', function (done) {
        var projectId = '5507028694267057674862a3';
        var userId = '5507028694267057674862a3';

        projectService.getProject(projectId, userId)
            .then(function () {
                done(new Error('Should have failed'));
            }).catch(function (err) {
                expect(err.message).to.eq('One of the parameters is not set correctly');
                done();
            });
    });

    it('projectService Get Project - should not return a project if the state of fields is not correct', function (done) {
        var userId = '5507028694267057674862a3';

        projectService.getProjects(userId, {}, {showArchived: 'StringValue'}, {}, false)
            .then(function () {
                done(new Error('Should have failed'));
            }).catch(function (err) {
                expect(err.message).to.eq('One of the parameters is not set correctly');
                done();
            });
    });

    it('projectService Create Project - should not create a new project is missing params', function (done) {
        projectService.createProject({})
            .then(function () {
                done(new Error('Should have failed'));
            }).catch(function (err) {
                expect(err.message).to.eq('One of the parameters is not set correctly');
                done();
            });
    });

    it('projectService Create Project - should not create a new project if name is an object', function (done) {
        var project = {};
        project.name = {name: 'test'};
        project.description = 'This is the project description';
        var userObject = {_id: USER_ID, email: 'user1@test.com'};

        projectService.createProject(userObject, project)
            .then(function () {
                done(new Error('Should have failed'));
            }).catch(function (err) {
                expect(err.message).to.eq('One of the parameters is not set correctly');
                done();
            });
    });

    it('projectService Create Project - should not create a new project if the description is an object', function (done) {
        var project = {};
        project.name = 'Test Project';
        project.description = {description: 'This is the project description'};
        var userObject = {_id: USER_ID, email: 'user1@test.com'};

        projectService.createProject(userObject, project)
            .then(function () {
                done(new Error('Should have failed'));
            }).catch(function (err) {
                expect(err.message).to.eq('One of the parameters is not set correctly');
                done();
            });
    });

    it('projectService Create Project - should create a new project', function (done) {
        var project = {};
        project.name = 'Test Project';
        project.description = 'This is a test project. This is the description';
        var userObject = {_id: USER_ID, email: 'user1@test.com'};

        projectService.createProject(userObject, project, {})
            .then(function (project) {
                expect(project).not.to.be.empty;
                expect(project.name).to.eq('Test Project');
                expect(project.description).to.eq('This is a test project. This is the description');
                expect(project.archived).to.eq(false);
                expect(project.deleted).to.eq(false);
                done();
            }).catch(done);
    });

    it('projectService Create Project - should not create a new project if the name is typeof function', function (done) {
        var project = {};
        project.name = function () {
            console.log("I am a function");
        };
        project.description = 'This is the project description';
        var userObject = {_id: USER_ID, email: 'user1@test.com'};

        projectService.createProject(userObject, project, {})
            .then(function () {
                done(new Error('Should have failed'));
            }).catch(function (err) {
                expect(err.message).to.eq('One of the parameters is not set correctly');
                done();
            });
    });

    it('projectService Create Project - should not create a new project if the name is too long (more than 50 chars)', function (done) {
        var project = {};
        project.name = 'ThisProjectNameIsLongerThanTheValidationRulesWillAllow';
        project.description = 'this is the project description';
        var userObject = {_id: USER_ID, email: 'user1@test.com'};

        projectService.createProject(userObject, project, {})
            .then(function () {
                done(new Error('Should have failed'));
            }).catch(function (err) {
                expect(err.message).to.eq('One of the parameters is not set correctly');
                done();
            });
    });

    it('projectService Create Project - should not create a new project if the description is too long (more than 300 chars)', function (done) {
        var project = {};
        project.name = 'Test project';
        project.description = 'This is a project description that will be too long to be added to a project that the user would like to create. ' +
            'This is a project description that will be too long to be added to a project that the user would like to create. This is a project ' +
            'description that will be too long to be added to a project that the user would like to create.';
        var userObject = {_id: USER_ID, email: 'user1@test.com'};

        projectService.createProject(userObject, project, {})
            .then(function () {
                done(new Error('Should have failed'));
            }).catch(function (err) {
                expect(err.message).to.eq('One of the parameters is not set correctly');
                done();
            });
    });

    it('projectService Update Project - should not be allowed update a project if the archived flag is not set correctly i.e. true|false', function (done) {
        var projectId = '5507028694267057674862a3';
        var updateFields = {archived: 'SomeValue'};

        projectService.updateProject(projectId, USER_ID, updateFields)
            .then(function () {
                done(new Error('Should have failed'));
            }).catch(function (err) {
                expect(err.message).to.eq('Archived field is not set correctly');
                done();
            });
    });

    it('projectService Update Project - should not be allowed update a project if the name field is not set correctly', function (done) {
        var projectId = '5507028694267057674862a3';
        var updateFields = {archived: 'SomeValue'};
        updateFields.name = {};

        projectService.updateProject(projectId, USER_ID, updateFields)
            .then(function () {
                done(new Error('Should have failed'));
            }).catch(function (err) {
                expect(err.message).to.eq('Name field is not set correctly');
                done();
            });
    });

    it('projectService Update Project - should not be allowed update a project if the description field is not set correctly', function (done) {
        var projectId = '5507028694267057674862a3';
        var updateFields = {archived: 'SomeValue'};
        updateFields.description = {};

        projectService.updateProject(projectId, USER_ID, updateFields)
            .then(function () {
                done(new Error('Should have failed'));
            }).catch(function (err) {
                expect(err.message).to.eq('Description field is not set correctly');
                done();
            });
    });

    it('projectService Update Project - should not be allowed update a project if the new name is too long (more than 50 chars)', function (done) {
        var projectId = '5507028694267057674862a3';
        var updateFields = {archived: 'SomeValue'};
        updateFields.name = 'ThisProjectNameIsLongerThanTheValidationRulesWillAllow';

        projectService.updateProject(projectId, USER_ID, updateFields)
            .then(function () {
                done(new Error('Should have failed'));
            }).catch(function (err) {
                expect(err.message).to.eq('Name field is not set correctly');
                done();
            });
    });

    it('projectService Update Project - should not be allowed update a project if the new description is too long (more than 300 chars)', function (done) {
        var projectId = '5507028694267057674862a3';
        var updateFields = {archived: 'SomeValue'};
        updateFields.description = 'This is a project description that will be too long to be added to a project that the user would like to create. ' +
            'This is a project description that will be too long to be added to a project that the user would like to create. This is a project ' +
            'description that will be too long to be added to a project that the user would like to create.';

        projectService.updateProject(projectId, USER_ID, updateFields)
            .then(function () {
                done(new Error('Should have failed'));
            }).catch(function (err) {
                expect(err.message).to.eq('Description field is not set correctly');
                done();
            });
    });

    it('Step1. Create Project - create a new project with the invite list updated', function (done) {
        var userObject = {_id: USER_ID, email: 'user1@test.com'};

        var projectFields = {name: 'Test Project', invite_list: [{email: 'user2@test.com'}]};

        projectService.createProject(userObject, projectFields, {})
            .then(function (project) {
                expect(project).not.to.be.empty;
                expect(project.name).to.eq('Test Project');
                expect(project.archived).to.eq(false);
                expect(project.deleted).to.eq(false);
                expect(project.invite_list).not.to.be.empty;
                expect(project.invite_list[0].email).to.eq('user2@test.com');
                projectId = project._id;
                done();
            }).catch(done);
    });

    it('Step2. Update Project - should return a populated invite list when archived: false', function (done) {
        var userId = '5507028694267057674862a3';
        var updateFields = {name: 'Update Project', archived: false};

        projectService.updateProject(projectId, userId, updateFields)
            .then(function (project) {
                expect(project).not.to.be.empty;
                expect(project.name).to.eq('Update Project');
                expect(project.archived).to.eq(false);
                expect(project.invite_list).not.to.be.empty;
                expect(project.invite_list[0].email).to.eq('user2@test.com');
                done();
            }).catch(function (err) {
                done(new Error('Should not have failed, err: ' + err));
            });
    });


    it('Step3. Update Project - should return an empty invite list when archived: true', function (done) {
        var userId = '5507028694267057674862a3';
        var updateFields = {name: 'Update Project', archived: true};

        projectService.updateProject(projectId, userId, updateFields)
            .then(function (project) {
                expect(project).not.to.be.empty;
                expect(project.name).to.eq('Update Project');
                expect(project.archived).to.eq(true);
                expect(project.invite_list).to.be.empty;
                done();
            }).catch(function (err) {
                done(new Error('Should not have failed, err: ' + err));
            });
    });

    it('Step5. Publish Project', function (done) {
        var userId = '5507028694267057674862a3';
        var tags = ['tag1', 'tag2', 'tag3'];
        var flag = true;
        projectService.setPublicFlag(projectId, flag, userId, tags)
            .then(function () {
                projectService.getProject(projectId, USER_ID, null, null, true)
                    .then(function (project) {
                        expect(project).not.to.be.empty;
                        expect(project.isPublic).to.eq(true);
                        expect(project.tags[0]).to.eq(tags[0]);
                        expect(project.tags[0]).to.eq(tags[0]);
                        expect(project.tags[0]).to.eq(tags[0]);
                        done();
                    }).catch(done);

            }).catch(done);
    });

    it('Step6. Unpublish Project', function (done) {
        var userId = '5507028694267057674862a3';
        var flag = false;
        projectService.setPublicFlag(projectId, flag, userId, ['tag1', 'tag2'])
            .then(function (project) {
                expect(project).not.to.be.empty;
                expect(project.isPublic).to.eq(false);
                expect(project.tags.length).to.eq(5);
                done();
            }).catch(done);
    });

    it('Unpublish Project with an incorrect flag', function (done) {
        var userId = '5507028694267057674862a3';
        projectService.setPublicFlag(projectId, false, userId, ['tag1', 'tag2'])
            .then(function (project) {
                expect(project).not.to.be.empty;
                expect(project.isPublic).to.eq(false);
                expect(project.tags.length).to.eq(5);
                done();
            }).catch(done);
    });

    it('Set Deleted Project - create a new project and set deleted', function (done) {
        var userObject = {_id: USER_ID, email: 'user1@test.com'};

        var projectFields = {name: 'Test Delete Project'};

        projectService.createProject(userObject, projectFields, {})
            .then(function (project) {
                expect(project).not.to.be.empty;
                expect(project.name).to.eq('Test Delete Project');
                projectId = project._id;
                projectService.setDeletedFlag(projectId, true).then(function (id) {
                    done();
                }).catch(function (err) {
                    done(new Error('Should not have failed, err: ' + err));
                });
            }).catch(done);
    });

    it('Delete Project - create a new project and delete it', function (done) {
        var userObject = {_id: USER_ID, email: 'user1@test.com'};

        var projectFields = {name: 'Test Delete Project'};

        projectService.createProject(userObject, projectFields, {})
            .then(function (project) {
                expect(project).not.to.be.empty;
                expect(project.name).to.eq('Test Delete Project');
                projectId = project._id;
                var changeInfo = {
                    action: 'delete'
                };
                projectService.onUserGlobalChange(USER_ID, changeInfo).then(function (id) {
                    done();
                }).catch(function (err) {
                    done(new Error('Should not have failed, err: ' + err));
                });
            }).catch(done);
    });

    it('Try to update a project profile image when the project has a status of deleted', function (done) {
        projectService.updatePicture(projectId, '109cf2ed5356c6bf0a8cf0ff', USER_ID)
            .then(function (project) {
                expect(project).to.be.empty;
                done();
            }).catch(done);
    });

    it('Ensure error is thrown based on input params', function (done) {
        try{
            projectService.registerProjectDeletionHandlers({_id: 'TestObject'});
        } catch( error ){
            expect(error.message).to.be.eq('Invalid project deletion callback');
            expect(error instanceof TypeError).to.eq(true);
            done();
        }
    });

});
