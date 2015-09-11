'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var commonServer = require('norman-common-server');
var registry = commonServer.registry;

var api = require('./lib/api');
var services = require('./lib/services');
var logger = commonServer.logging.createLogger('project-server');

module.exports = {
    initialize: function (done) {
        logger.info('>> initialize(), project server');
        services.initialize(function (err) {
            if (err) {
                done(err);
            }
            else {
                done();
            }
        });
    },
    onInitialized: function (done) {
        logger.info('>> onInitialized(), project server');
        services.onInitialized(done);
        api.initialize(done);
        var userService = registry.getModule('UserService');
        var projectService = registry.getModule('ProjectService');
        userService.registerUserGlobalChangeHandlers(projectService);
        done();
    },
    checkSchema: function (done) {
        services.checkSchema(done);
    },
    onSchemaChecked: function () {
        services.onSchemaChecked();
    },
    initializeSchema: function (done) {
        services.initializeSchema(done);
    },
    onSchemaInitialized: function () {
        services.onSchemaInitialized();
    },
    prepareSchemaUpgrade: function (version, done) {
        services.prepareSchemaUpgrade(version, done);
    },
    upgradeSchema: function (version, done) {
        services.upgradeSchema(version, done);
    },
    onSchemaUpgraded: function (version, done) {
        services.onSchemaUpgraded(version, done);
    },
    getSchemaInfo: function () {
        return {name: 'Projects', version: '0.0.0'};
    },
    shutdown: function (done) {
        logger.info('>> shutdown(), project server');
        services.shutdown(done);
    },
    getHandlers: function () {
        logger.info('>> getHandlers(), project server');
        api.initialize();
        return api.getHandlers();
    }
};
