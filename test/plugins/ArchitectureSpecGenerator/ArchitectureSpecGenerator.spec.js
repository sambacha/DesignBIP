/*jshint node:true, mocha:true*/
/**
 * Generated by PluginGenerator 1.7.0 from webgme on Sun Feb 19 2017 20:48:34 GMT-0600 (CST).
 */

'use strict';
var testFixture = require('../../globals');

describe('ArchitectureSpecGenerator', function () {
    var gmeConfig = testFixture.getGmeConfig(),
        expect = testFixture.expect,
        logger = testFixture.logger.fork('ArchitectureSpecGenerator'),
        PluginCliManager = testFixture.WebGME.PluginCliManager,
        projectName = 'testProject',
        pluginName = 'ArchitectureSpecGenerator',
        project,
        gmeAuth,
        storage,
        commitHash;

    before(function (done) {
        testFixture.clearDBAndGetGMEAuth(gmeConfig, projectName)
            .then(function (gmeAuth_) {
                gmeAuth = gmeAuth_;
                // This uses in memory storage. Use testFixture.getMongoStorage to persist test to database.
                storage = testFixture.getMemoryStorage(logger, gmeConfig, gmeAuth);
                return storage.openDatabase();
            })
            .then(function () {
                var importParam = {
                    projectSeed: testFixture.path.join(testFixture.SEED_DIR, 'Architecture_violations.webgmex'),
                    projectName: projectName,
                    branchName: 'master',
                    logger: logger,
                    gmeConfig: gmeConfig
                };

                return testFixture.importProject(storage, importParam);
            })
            .then(function (importResult) {
                project = importResult.project;
                commitHash = importResult.commitHash;
                return project.createBranch('test', commitHash);
            })
            .nodeify(done);
    });

    after(function (done) {
        storage.closeDatabase()
            .then(function () {
                return gmeAuth.unload();
            })
            .nodeify(done);
    });

    it('should fail on non-existance of enforceable transitions', function (done) {
        var manager = new PluginCliManager(null, logger, gmeConfig),
            pluginConfig = {
            },
            context = {
                project: project,
                commitHash: commitHash,
                branchName: 'test',
                activeNode: '/f/R',
            };

        manager.executePlugin(pluginName, pluginConfig, context, function (err, pluginResult) {
            try {
                expect(pluginResult.success).to.equal(false);
                //expect(pluginResult).to.deep.equal({});
                expect(pluginResult.error).to.include('violation(s)');
                expect(pluginResult.messages.length).to.equal(1);
                done();
            }
            catch(e) {
                done(e);
            }
        });
    });

    it('should fail on non-defined src and dst of connections and connectors', function (done) {
        var manager = new PluginCliManager(null, logger, gmeConfig),
            pluginConfig = {
            },
            context = {
                project: project,
                commitHash: commitHash,
                branchName: 'test',
                activeNode: '/f/t',
            };

        manager.executePlugin(pluginName, pluginConfig, context, function (err, pluginResult) {
            try {
                expect(pluginResult.success).to.equal(false);
                //expect(pluginResult).to.deep.equal({});
                expect(pluginResult.error).to.include('violation(s)');
                expect(pluginResult.messages.length).to.equal(2);
                done();
            }
            catch(e) {
                done(e);
            }
        });
    });

    it('should fail on unconnected connector ends', function (done) {
        var manager = new PluginCliManager(null, logger, gmeConfig),
            pluginConfig = {
            },
            context = {
                project: project,
                commitHash: commitHash,
                branchName: 'test',
                activeNode: '/f/Y',
            };

        manager.executePlugin(pluginName, pluginConfig, context, function (err, pluginResult) {
            try {
                expect(pluginResult.success).to.equal(false);
                //expect(pluginResult).to.deep.equal({});
                expect(pluginResult.error).to.include('violation(s)');
                expect(pluginResult.messages.length).to.equal(2);
                done();
            }
            catch(e) {
                done(e);
            }
        });
    });
});
