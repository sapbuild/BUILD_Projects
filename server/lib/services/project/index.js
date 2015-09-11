'use strict';

var commonServer = require('norman-common-server');
var tp = require('norman-server-tp');
var RSS = require('rss');
var _ = tp.lodash;
var projectModel = require('./project.model');
var Project;
var serviceLogger = commonServer.logging.createLogger('project-service');
var registry = commonServer.registry;
var aclService;
var userService;
var assetService;

var NormanError = commonServer.NormanError;

var hexadecimal = /^[0-9a-fA-F]+$/;

var OWNER_ROLE_NAME = 'owner-';
var COLLABORATOR_ROLE_NAME = 'collaborator-';

/**
 * @private
 */
function _isString(value) {
    return typeof value === 'string';
}

/**
 * @private
 */
var _isFieldBoolean = function (str) {
    return (typeof str === 'boolean');
};

/**
 * @private
 */
var _isMongoId = function (str) {
    return (hexadecimal.test(str) && str.length === 24);
};

var _validateProjectName = function (name) {
    return _isString(name) && name.length <= 50;
};

var _validateProjectDescription = function (description) {
    return _isString(description) && description.length <= 300;
};

function ProjectService() {
    this.deletionHandlers = [];            // Array to keep registering order
}

module.exports = ProjectService;

ProjectService.prototype.initialize = function (done) {
    Project = projectModel.create();
    done();
};

ProjectService.prototype.checkSchema = function (done) {
    serviceLogger.info('>> checkSchema()');
    projectModel.createIndexes(done);
};

ProjectService.prototype.shutdown = function (done) {
    serviceLogger.info('>> shutdown()');
    projectModel.destroy(done);
};

ProjectService.prototype.getModel = function () {
    serviceLogger.info('>> getModel()');

    if (!Project) {
        Project = projectModel.create();
    }

    return Project;
};

ProjectService.prototype.onInitialized = function (done) {
    serviceLogger.info('>> onInitialized()');
    aclService = registry.getModule('AclService');
    userService = registry.getModule('UserService');
    assetService = registry.getModule('AssetService');
    done();
};

function getRole(projects) {
    serviceLogger.info('>> getRole()');
    var promises = [];
    var allProjects = projects;

    projects.forEach(function (project) {
        promises.push(aclService.getAcl().roleUsers(OWNER_ROLE_NAME + project._id));
    });

    return Promise.all(promises)
        .then(function (result) {
            allProjects.forEach(function (project, index) {
                var ownerUserId = result[index];

                project.user_list.forEach(function (user) {
                    user.role = ownerUserId.indexOf(user.user_id) === -1 ? 'contributor' : 'owner';
                });
            });
            return allProjects;
        });
}

/**
 *
 * Return the project ONLY if the user either created or has accepted the invite to the project
 * User has the option of restricting the fields being returned and/or showing projects that have been archived
 *
 * @param projectId
 * @param userId
 * @param options, currently a place holder so the method signature doesnt have to change down the line
 * @param restrictFields, allow user to restrict which fields are returned
 * @param readOnly, default is true which returns JSON object rather than Mongoose Object
 * @returns {deferred.promise|*}
 */
ProjectService.prototype.getProject = function (projectId, userId, options, restrictFields, readOnly) {
    serviceLogger.info({
        projectId: projectId,
        userId: userId,
        options: options,
        restrictFields: restrictFields,
        readOnly: readOnly
    }, '>> getProject()');

    // Validate fields, showArchived is optional so only validate it's present
    if (!_isFieldBoolean(readOnly) || !_isMongoId(projectId.toString()) || !_isMongoId(userId.toString())) {
        serviceLogger.error('<< getProject(), One of the parameters is not set correctly');
        return Promise.reject(new Error('One of the parameters is not set correctly'));
    }

    var deferred = Promise.defer();

    restrictFields = _.isEmpty(restrictFields) ? {} : restrictFields;

    var queryParams = {
        _id: projectId,
        $and: [
            {
                $or: [
                    {'stats.created_by': userId},
                    {'user_list.user_id': userId}
                ]
            }
        ],
        deleted: false
    };

    Project.findOne(queryParams, restrictFields).lean(readOnly).exec(function (err, project) {
        if (err) {
            serviceLogger.info('<< getProject(), finished with error');
            return deferred.reject(err);
        }

        if (project) {
            return getRole([project])
                .then(function (allProjects) {
                    serviceLogger.info('<< getProject(), returning project');
                    return deferred.resolve(allProjects[0]);
                })
                .catch(function (getRoleErr) {
                    serviceLogger.warn('<< getProject(), returning error from roles, ' + getRoleErr);
                    return deferred.reject(getRoleErr);
                });
        }

        return deferred.resolve(project);
    });

    return deferred.promise;
};

/**
 * Return all projects ONLY if the user either created or has accepted the invite to the project
 * User has the option of restricting the fields being returned and/or showing projects that have been archived
 *
 * option: showArchived, A. All projects [default] B. Filtered by archived Projects C. Filtered by active only
 *
 * @param userId
 * @param userEmail
 * @param options, contains additional options that can be used
 * @param restrictFields, allow user to restrict which fields are returned
 * @param readOnly, default is true which returns JSON object rather than Mongoose Object
 * @returns {*}
 */
ProjectService.prototype.getProjects = function (userId, userEmail, options, restrictFields, readOnly) {
    serviceLogger.info({
        userId: userId,
        userEmail: userEmail,
        options: options,
        restrictFields: restrictFields,
        readOnly: readOnly
    }, '>> getProjects()');

    if ((!_.isEmpty(options) && !_isFieldBoolean(options.showArchived)) || !_isFieldBoolean(readOnly) || !_isMongoId(userId.toString())) {
        serviceLogger.error('<< getProjects(), One of the parameters is not set correctly');
        return Promise.reject(new Error('One of the parameters is not set correctly'));
    }

    var deferred = Promise.defer();
    restrictFields = _.isEmpty(restrictFields) ? {} : restrictFields;

    var queryParams = {
        $or: [
            {'stats.created_by': userId},
            {'user_list.user_id': userId},
            {'invite_list.user_id': userId},
            {'invite_list.email': userEmail}
        ],
        deleted: false
    };

    // Return 1. All projects [default] 2. Filtered by archived Projects 3. Filtered by active only
    if (!_.isEmpty(options) && options.showArchived) {
        queryParams.archived = true;
    }
    else if (!_.isEmpty(options) && !options.showArchived) {
        queryParams.archived = false;
    }

    Project.find(queryParams, restrictFields).lean(readOnly).exec(function (err, projects) {
        if (err) {
            serviceLogger.info('<< getProjects(), returning err, ' + err);
            return deferred.reject(err);
        }
        return getRole(projects)
            .then(function (allProjects) {
                serviceLogger.info('<< getProjects(), returning project(s)');
                return deferred.resolve(allProjects);
            })
            .catch(function (error) {
                serviceLogger.info('<< getProjects(), returning err from roles, ' + error);
                return deferred.reject(error);
            });
    });

    return deferred.promise;
};

ProjectService.prototype.updateProject = function (projectId, userId, updateFields) {
    serviceLogger.info({
        projectId: projectId,
        userId: userId,
        updateFields: updateFields
    }, '>> updateProject()');

    updateFields = _.isEmpty(updateFields) ? {} : updateFields;

    // Certain fields need to be exist
    if (!_isMongoId(projectId.toString()) || !_isMongoId(userId.toString())) {
        serviceLogger.error('<< updateProject(), One of the parameters is not set correctly');
        return Promise.reject(new Error('One of the parameters is not set correctly'));
    }

    // Ensure that name is a string value and has a valid length
    if (updateFields.name && !_validateProjectName(updateFields.name)) {
        return Promise.reject(new Error('Name field is not set correctly'));
    }

    // Ensure that description is a string value and has a valid length
    if (updateFields.description && !_validateProjectDescription(updateFields.description)) {
        return Promise.reject(new Error('Description field is not set correctly'));
    }

    // If user archives project then handle invite list
    if (updateFields.archived) {
        // If field is present then it enforces true|false
        if (_isFieldBoolean(updateFields.archived)) {
            updateFields.invite_list = [];
        }
        else {
            return Promise.reject(new Error('Archived field is not set correctly'));
        }
    }

    var deferred = Promise.defer();

    Project.findOneAndUpdate(
        {
            _id: projectId,
            $and: [
                {
                    $or: [
                        {'stats.created_by': userId},
                        {'user_list.user_id': userId}
                    ]
                }
            ],
            deleted: false
        }, updateFields).lean(false).exec(function (err, project) {
            if (err) {
                serviceLogger.warn('<< updateProject(), returning error');
                return deferred.reject(err);
            }
            serviceLogger.info('<< updateProject(), returning updated project');
            return deferred.resolve(project);
        });

    return deferred.promise;
};

ProjectService.prototype.findProject = function (findParams, updateFields) {
    serviceLogger.info({
        findParams: findParams,
        updateFields: updateFields
    }, '>> findProject');

    var deferred = Promise.defer();

    updateFields = _.isEmpty(updateFields) ? {} : updateFields;

    Project.findOneAndUpdate(findParams, updateFields).lean(true).exec(function (err, project) {
        if (err) {
            serviceLogger.warn('<< findProject(), returning error');
            return deferred.reject(err);
        }
        serviceLogger.info('<< findProject(), returning updated project');
        return deferred.resolve(project);
    });

    return deferred.promise;
};

/**
 * @param {String} userId
 * @returns An object containing the query result
 */
ProjectService.prototype.onUserGlobalChange = function (userId, changeInfo, context) {
    serviceLogger.debug({
        UserId: userId,
        changeInfo: changeInfo
    }, '>> onUserGlobalChange');

    var deferred = Promise.defer();
    var self = this;

    if (changeInfo.action === 'delete' || (changeInfo.action === 'roleChange' && changeInfo.newRole === 'guest')) {
        // we need to clear all projects he owns
        serviceLogger.debug({userId: userId}, 'Deleting projects owned by user');
        Project.find({'stats.created_by': userId}, function (err, projects) {
            if (err) {
                var error = new NormanError('Failed to find projects owned by user ' + userId, err);
                serviceLogger.error(error);
                return deferred.reject(err);
            }
            serviceLogger.info(projects.length + ' Projects found to be deleted');
            projects.forEach(function (currProject) {
                self.delete(currProject._id, context);
            });
            return deferred.resolve(userId);
        });
        // we need to clear all his participants in projects
        serviceLogger.debug({userId: userId}, 'Deleting participations in projects');
        Promise.resolve(Project.find({'user_list.user_id': userId, deleted: false}).exec())
            .then(function (projects) {
                var promises = [];
                projects.forEach(function (project) {
                    project.user_list = project.user_list.filter(function (user) {
                        return (user.user_id && user.user_id !== userId);
                    });
                    var savePromise = Promise.invoke(project, 'save')
                        .catch(function (error) {
                            var normanError = new NormanError('Failed to delete user ' + userId + ' in participant list of project ' + project._id, error);
                            serviceLogger.error(normanError);
                            throw normanError;
                        });
                    promises.push(savePromise);
                });
                return Promise.waitAll(promises);
            })
            .then(function (results) {
                var len = (Array.isArray(results) && results.length) || 0;
                serviceLogger.info(len + ' projects cleared from user ' + userId + ' participation');
                return userId;
            })
            .catch(function (error) {
                var normanError = new NormanError('Deleting participant in projects for user ' + userId, error);
                serviceLogger.error(normanError);
                throw normanError;
            });
    }
    else {
        deferred.resolve(userId);
    }

    return deferred.promise;
};

ProjectService.prototype.delete = function (projectId, context) {
    serviceLogger.debug({
        projectId: projectId
    }, '>> delete');
    var deletionHandlers = this.deletionHandlers;

    return this.setDeletedFlag(projectId, true)
        .then(function () {
            var k = 0, n = deletionHandlers.length;

            function nextHandler() {
                var handler;
                if (k >= n) {
                    return Promise.resolve(projectId);
                }
                handler = deletionHandlers[k++];

                if (typeof handler === 'function') {
                    return handler(projectId).then(nextHandler);
                }
                return handler.onProjectDeleted(projectId).then(nextHandler);
            }

            return nextHandler();
        })
        .then(function () {
            // Remove associated Roles
            var deferred = Promise.defer();
            Project.findById(projectId, 'user_list')
                .lean()
                .exec(function (err, project) {
                    if (err) {
                        serviceLogger.error(new NormanError(err));
                        return deferred.reject(err);
                    }
                    aclService.removeProjectRoles(projectId.toString(), context);
                    if (project) {
                        serviceLogger.info('delete(), removing users from ACL project list');
                        _.forEach(project.user_list, function (user) {
                            aclService.removeProjectAccess(user.user_id, projectId.toString(), context);
                        });
                    }
                    else {
                        serviceLogger.warn('delete(), no project found');
                    }
                    deferred.resolve(projectId);
                });
            return deferred.promise;
        })
        .then(function () {
            var deferred = Promise.defer();
            Project.findByIdAndRemove(projectId, function (err) {
                if (err) {
                    return deferred.reject(err);
                }
                serviceLogger.debug({projectId: projectId}, 'delete successfully project');
                deferred.resolve(projectId);
            });
            return deferred.promise;
        })
        .catch(function (err) {
            var error = new NormanError('Failed to delete Project ' + projectId, err);
            serviceLogger.error(error);
            throw error;
        });
};

/**
 * Set Project's deleted flag, if it's set to true the Project is about to be deleted but cleaning it's data is done before
 * @param {String}  ProjectId
 * @param {Object}  context
 * @param {Boolean} flag
 */
ProjectService.prototype.setDeletedFlag = function (projectId, flag) {
    serviceLogger.debug({
        projectId: projectId,
        flag: flag
    }, '>> setDeletedFlag');
    var deferred = Promise.defer();
    Project.findById(projectId, function (err, project) {
        if (err) {
            serviceLogger.error(new NormanError(err));
            return deferred.reject(new NormanError(err));
        }

        if (project.deleted !== flag) {
            project.deleted = flag;
            project.save(function (error) {
                if (error) {
                    serviceLogger.error(new NormanError(error));
                    return deferred.reject(error);
                }
                deferred.resolve(projectId);
            });
        }
        else {
            deferred.resolve(projectId);
        }
    });
    return deferred.promise;
};

/**
 * Create a new project with the associated ACL roles attached
 *
 * @param userObject
 * @param inputParams
 * @returns {*} a POJO not a mongoose document
 */
ProjectService.prototype.createProject = function (userObject, inputParams, reqContext) {

    serviceLogger.info({
        userObject: userObject,
        inputParams: inputParams
    }, '>> createProject');

    // Ensure certain fields are present and in a correct state
    // TODO: keeping description optional for now, needs to be made mandatory once the description is passed in
    if (!reqContext || !inputParams || !_validateProjectName(inputParams.name)
        || (inputParams.description && !_validateProjectDescription(inputParams.description)) || !_isMongoId(userObject._id.toString())) {
        serviceLogger.error('<< createProject(), One of the parameters is not set correctly');
        return Promise.reject(new Error('One of the parameters is not set correctly'));
    }

    var deferred = Promise.defer();

    // Setup default settings for a new project
    inputParams._id = commonServer.utils.shardkey();
    inputParams.archived = false;
    inputParams.deleted = false;
    inputParams.stats = {};
    inputParams.stats.created_by = userObject._id;
    inputParams.stats.created_at = new Date();
    inputParams.stats.updated_by = userObject._id;
    inputParams.stats.updated_at = new Date();

    // Add user to the user_list, they will see themselves in the teams page so they need to be added here
    inputParams.user_list = [
        {
            user_id: userObject._id,
            email: userObject.userEmail
        }
    ];

    var tmpProject = {};

    Project.create(inputParams)
        .then(function (project) {
            serviceLogger.info('createProject(), project created');
            tmpProject = project;
            return project;
        })
        .then(function (project) {
            // Setup user with ACL access
            serviceLogger.info('createProject(), Project ACL roles created');
            return aclService.createAclProjectRoles(project._id, reqContext);
        })
        .then(function () {
            // Setup roles
            serviceLogger.info('createProject(), User roles created');
            return aclService.getAcl().addUserRoles(tmpProject.stats.created_by.toString(), 'owner-' + tmpProject._id, null, reqContext);
        })
        .then(function () {
            serviceLogger.info('<< createProject(), returning project');
            return deferred.resolve(tmpProject.toObject());
        })
        .then(null, function (err) {
            // Dev-note: http://mongoosejs.com/docs/api.html#promise_Promise-then
            serviceLogger.err('<< createProject(), error found ' + err);
            return deferred.reject(err);
        });

    return deferred.promise;
};

ProjectService.prototype.changeOwner = function (projectId, ownerId, context) {
    serviceLogger.info('>> changeOwner()');
    var acl = aclService.getAcl(), ownerRole = OWNER_ROLE_NAME + projectId;

    return acl.roleUsers(ownerRole)
        .then(function (users) {
            var promises = [];
            users.forEach(function (userId) {
                promises.push(acl.removeUserRoles(userId, [ownerRole], null, context));
                promises.push(acl.addUserRoles(userId, COLLABORATOR_ROLE_NAME + projectId, null, context));
            });

            return Promise.all(promises);
        })
        .then(function () {
            return acl.addUserRoles(ownerId, ownerRole, null, context);
        })
        .then(function () {
            serviceLogger.info('<< changeOwner()');
        })
        .catch(function (err) {
            serviceLogger.err('<< changeOwner() - error: \n', err);
            throw err;
        });
};
/**
 * Update the picture for a project
 *
 * @projectId id of the project to update
 * @pictureURL the URL to the picture to render
 */
ProjectService.prototype.updatePicture = function (projectId, assetId, userId) {
    serviceLogger.info({
                projectId: projectId,
                assetId: assetId,
                userId: userId
            }, '>> updatePicture()');

    var deferred = Promise.defer();
    var queryParams = {
        _id: projectId,
        deleted: false
    };
    Project.findOne(queryParams, function (err, project) {
        if (err) {
            serviceLogger.error(new NormanError(err));
            return deferred.reject(new NormanError(err));
        }
        if (!project) {
            serviceLogger.error('<< updatePicture(), project not found');
            return deferred.resolve();
        }

        assetService.getAssetWithContent(assetId, null, true)
            .then(function (asset) {
                var thumbnail = asset.fileContent.toString('base64');
                if (project.thumbnail !== thumbnail) {
                    project.thumbnail = thumbnail;
                    project.stats.updated_by = userId;
                    project.stats.updated_at = new Date();

                    project.save(function (error) {
                        if (error) {
                            serviceLogger.error(new NormanError(error));
                            return deferred.reject(error);
                        }
                        serviceLogger.info('<< updatePicture(), project updated, returning projectId');
                        deferred.resolve(project);
                    });
                }
                else {
                    serviceLogger.info('<< updatePicture(), no update needed, returning projectId');
                    deferred.resolve(project);
                }
            })
            .catch(function (error) {
                serviceLogger.err('<< updatePicture() - error: \n', error);
                throw error;
            });
    });
    return deferred.promise;
};


/**
 * Set Project's isPublic flag, if it's set to true the Project is publicly avaiable for people to view.
 * This requires special publishing rights.
 * @param {String}  ProjectId
 * @param {Boolean} flag
 * @param {Date} date it was published (optional)
 */
ProjectService.prototype.setPublicFlag = function (projectId, flag, userId, tags) {
    serviceLogger.debug({
        projectId: projectId,
        flag: flag,
        userId: userId,
        tags: tags
    }, '>> setPublicFlag');
    var deferred = Promise.defer();
    var queryParams = {
        _id: projectId,
        deleted: false
    };
    Project.findOne(queryParams, function (err, project) {

        if (err) {
            serviceLogger.error(new NormanError(err));
            return deferred.reject(new NormanError(err));
        }

        if (!project) {
            serviceLogger.warn('<< setPublicFlag(), project not found');
            return deferred.resolve(project);
        }

        if (project.isPublic !== flag) {
            project.isPublic = flag;
            if (!project.publishDate) {
                project.publishDate = new Date();
            }
            project.stats.updated_by = userId;
            project.stats.updated_at = new Date();

            if (tags) {
                if (project.tags) {
                    project.tags = _.uniq(project.tags.concat(tags), true);
                }
                else {
                    project.tags = tags;
                }
            }
            project.save(function (error) {
                if (error) {
                    serviceLogger.error(new NormanError(error));
                    return deferred.reject(error);
                }
                serviceLogger.info('<< setPublicFlag(), returning updated project');
                deferred.resolve(project);
            });
        }
        else {
            serviceLogger.info('<< setPublicFlag(), isPublic not eqaul to flag, returning project');
            deferred.resolve(project);
        }
    });
    return deferred.promise;
};

/**
 * Modules to call this API in order to register handlers for user deletion cleanup. These Function will take User_Id (type ObjectId) as parameter
 * @param {function|object} deletion handler
 */
ProjectService.prototype.registerProjectDeletionHandlers = function (handler) {
    serviceLogger.debug({}, '>> registerProjectDeletionHandlers()');
    var t = typeof handler;
    var valid = (t === 'function') || ((t === 'object') && (typeof handler.onProjectDeleted === 'function'));
    if (!valid) {
        throw new TypeError('Invalid project deletion callback');
    }
    this.deletionHandlers.push(handler);
};


/**
 * Builds RSS feed using published projects
 * @param reqContext
 */
ProjectService.prototype.generateRSS = function (reqContext) {
    serviceLogger.debug({
        reqContext: reqContext
    }, '>> generateRSS()');

    var deferred = Promise.defer();
    var queryParams = {
        isPublic: true
    };

    Project.find(queryParams).lean(true).exec(function (err, projects) {
        if (err) {
            serviceLogger.error('<< generateRSS(), finished with error:' + err);
            return deferred.reject(err);
        }

        var feed = new RSS({
           title: 'Published Projects',
           description: 'List Of Published Projects',
           feed_url: reqContext.request.host + reqContext.request.url,
           site_url: reqContext.request.host,
           pubDate: new Date()
        });

        if (projects && projects.length > 0) {
            // Build a list of author ids to fetch
            var authorList = [];
            projects.forEach(function (project) {
                authorList.push(project.stats.created_by);
            });

            userService.showAvatarListBin(authorList).then(function (authors) {
                projects.forEach(function (project) {
                    var projectAuthor = _.find(authors, function (author) {
                        return author._id.toString() === project.stats.created_by;
                    });
                    if (!projectAuthor) {
                        // prevents access on undefined in author attributes
                        projectAuthor = {};
                    }
                    var item = {};
                    item.title = project.name;
                    item.description = project.description;
                    item.guid = project._id.toString();
                    item.categories = project.tags;
                    item.date = project.publishDate;
                    item.custom_elements = [];
                    item.custom_elements.push({projectPreviewDeeplinkUrl: reqContext.request.host + '/norman/projects/' + project._id.toString() + '/prototype'});
                    item.custom_elements.push({thumbnail: project.thumbnail});
                    item.custom_elements.push({clones: 0});
                    item.custom_elements.push({authorId: projectAuthor._id.toString()});
                    item.custom_elements.push({authorName: projectAuthor.name});
                    item.custom_elements.push({authorAvatar: projectAuthor.avatar_bin});
                    feed.item(item);
                });
                serviceLogger.info('<< generateRSS(), returning feed xml');
                deferred.resolve(feed.xml());
            });
        }
        else {
            serviceLogger.warn('<< generateRSS(), No Projects Found, returning feed header');
            var xml = feed.xml();
            deferred.resolve(xml);
        }
    });
    return deferred.promise;
};
