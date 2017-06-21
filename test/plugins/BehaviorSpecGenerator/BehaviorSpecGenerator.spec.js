/*jshint node:true, mocha:true*/
/**
 * Generated by PluginGenerator 1.7.0 from webgme on Wed Mar 08 2017 15:24:49 GMT-0600 (Central Standard Time).
 */

'use strict';
var testFixture = require('../../globals');

describe('BehaviorSpecGenerator', function () {
    var gmeConfig = testFixture.getGmeConfig(),
        expect = testFixture.expect,
        logger = testFixture.logger.fork('BehaviorSpecGenerator'),
        PluginCliManager = testFixture.WebGME.PluginCliManager,
        projectName = 'testProject',
        pluginName = 'BehaviorSpecGenerator',
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
                    projectSeed: testFixture.path.join(__dirname, 'BIP_violations.webgmex'),
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

    it('should succeed on valid model', function (done) {
        this.timeout(10000);
        var manager = new PluginCliManager(null, logger, gmeConfig),
            pluginConfig = {},
            context = {
                project: project,
                commitHash: commitHash,
                branchName: 'test',
                activeNode: '/f/t/f',
            };

        manager.executePlugin(pluginName, pluginConfig, context, function (err, pluginResult) {
            try {
                expect(err).to.equal(null);
                expect(typeof pluginResult).to.equal('object');
                expect(pluginResult.success).to.equal(true);
                done();
            }
            catch (e) {
                done(e);
            }
        });
    });

    // it('should succeed on valid model', function (done) {
    //     var manager = new PluginCliManager(null, logger, gmeConfig),
    //         pluginConfig = {},
    //         context = {
    //             project: project,
    //             commitHash: commitHash,
    //             branchName: 'test',
    //             activeNode: '/f/e',
    //         };
    //
    //     manager.executePlugin(pluginName, pluginConfig, context, function (err, pluginResult) {
    //         try {
    //             expect(err).to.equal(null);
    //             expect(typeof pluginResult).to.equal('object');
    //             expect(pluginResult.success).to.equal(true);
    //             done();
    //         }
    //         catch (e) {
    //             done(e);
    //         }
    //     });
    // });

    // it('should succeed on valid model', function (done) {
    //     var manager = new PluginCliManager(null, logger, gmeConfig),
    //         pluginConfig = {},
    //         context = {
    //             project: project,
    //             commitHash: commitHash,
    //             branchName: 'test',
    //             activeNode: '/f/c',
    //         };
    //
    //     manager.executePlugin(pluginName, pluginConfig, context, function (err, pluginResult) {
    //         try {
    //             expect(err).to.equal(null);
    //             expect(typeof pluginResult).to.equal('object');
    //             expect(pluginResult.success).to.equal(true);
    //             done();
    //         }
    //         catch (e) {
    //             done(e);
    //         }
    //     });
    // });

    // it('should succeed on valid model', function (done) {
    //     var manager = new PluginCliManager(null, logger, gmeConfig),
    //         pluginConfig = {},
    //         context = {
    //             project: project,
    //             commitHash: commitHash,
    //             branchName: 'test',
    //             activeNode: '/f/s',
    //         };
    //
    //     manager.executePlugin(pluginName, pluginConfig, context, function (err, pluginResult) {
    //         try {
    //             expect(err).to.equal(null);
    //             expect(typeof pluginResult).to.equal('object');
    //             expect(pluginResult.success).to.equal(true);
    //             done();
    //         }
    //         catch (e) {
    //             done(e);
    //         }
    //     });
    // });

    // it('should succeed on valid model', function (done) {
    //     var manager = new PluginCliManager(null, logger, gmeConfig),
    //         pluginConfig = {},
    //         context = {
    //             project: project,
    //             commitHash: commitHash,
    //             branchName: 'test',
    //             activeNode: '/f/M',
    //         };
    //
    //     manager.executePlugin(pluginName, pluginConfig, context, function (err, pluginResult) {
    //         try {
    //             expect(err).to.equal(null);
    //             expect(typeof pluginResult).to.equal('object');
    //             expect(pluginResult.success).to.equal(true);
    //             done();
    //         }
    //         catch (e) {
    //             done(e);
    //         }
    //     });
    // });

    it('should fail on no initial state', function (done) {
        var manager = new PluginCliManager(null, logger, gmeConfig),
            pluginConfig = {},
            context = {
                project: project,
                commitHash: commitHash,
                branchName: 'test',
                activeNode: '/f/t/1',
            };

        manager.executePlugin(pluginName, pluginConfig, context, function (err, pluginResult) {
            try {
                expect(pluginResult.success).to.equal(false);
                //expect(pluginResult).to.deep.equal({});
                expect(pluginResult.error).to.include('violation(s)');
                expect(pluginResult.messages.length).to.equal(1);
                done();
            }
            catch (e) {
                done(e);
            }
        });
    });

    it('should fail on duplicated transition name', function (done) {
        var manager = new PluginCliManager(null, logger, gmeConfig),
            pluginConfig = {},
            context = {
                project: project,
                commitHash: commitHash,
                branchName: 'test',
                activeNode: '/f/t/U',
            };

        manager.executePlugin(pluginName, pluginConfig, context, function (err, pluginResult) {
            try {
                expect(pluginResult.success).to.equal(false);
                //expect(pluginResult).to.deep.equal({});
                expect(pluginResult.error).to.include('violation(s)');
                expect(pluginResult.messages.length).to.equal(1);
                done();
            }
            catch (e) {
                done(e);
            }
        });
    });

    it('should fail on duplicated guard name', function (done) {
        var manager = new PluginCliManager(null, logger, gmeConfig),
            pluginConfig = {},
            context = {
                project: project,
                commitHash: commitHash,
                branchName: 'test',
                activeNode: '/f/t/k',
            };

        manager.executePlugin(pluginName, pluginConfig, context, function (err, pluginResult) {
            try {
                expect(pluginResult.success).to.equal(false);
                //expect(pluginResult).to.deep.equal({});
                expect(pluginResult.error).to.include('violation(s)');
                expect(pluginResult.messages.length).to.equal(1);
                done();
            }
            catch (e) {
                done(e);
            }
        });
    });

    it('should fail on duplicated state name', function (done) {
        var manager = new PluginCliManager(null, logger, gmeConfig),
            pluginConfig = {},
            context = {
                project: project,
                commitHash: commitHash,
                branchName: 'test',
                activeNode: '/f/t/s',
            };

        manager.executePlugin(pluginName, pluginConfig, context, function (err, pluginResult) {
            try {
                expect(pluginResult.success).to.equal(false);
                //expect(pluginResult).to.deep.equal({});
                expect(pluginResult.error).to.include('violation(s)');
                expect(pluginResult.messages.length).to.equal(1);
                done();
            }
            catch (e) {
                done(e);
            }
        });
    });

    it('should fail on non-defined transition methods', function (done) {
        var manager = new PluginCliManager(null, logger, gmeConfig),
            pluginConfig = {},
            context = {
                project: project,
                commitHash: commitHash,
                branchName: 'test',
                activeNode: '/f/t/B',
            };

        manager.executePlugin(pluginName, pluginConfig, context, function (err, pluginResult) {
            try {
                expect(pluginResult.success).to.equal(false);
                //expect(pluginResult).to.deep.equal({});
                expect(pluginResult.error).to.include('violation(s)');
                expect(pluginResult.messages.length).to.equal(1);
                done();
            }
            catch (e) {
                done(e);
            }
        });
    });

    it('should fail on non-defined guard reference', function (done) {
        var manager = new PluginCliManager(null, logger, gmeConfig),
            pluginConfig = {},
            context = {
                project: project,
                commitHash: commitHash,
                branchName: 'test',
                activeNode: '/f/t/e',
            };

        manager.executePlugin(pluginName, pluginConfig, context, function (err, pluginResult) {
            try {
                expect(pluginResult.success).to.equal(false);
                //expect(pluginResult).to.deep.equal({});
                expect(pluginResult.error).to.include('violation(s)');
                expect(pluginResult.messages.length).to.equal(1);
                done();
            }
            catch (e) {
                done(e);
            }
        });
    });

    it('should fail on non-defined src and dst of transitions', function (done) {
        var manager = new PluginCliManager(null, logger, gmeConfig),
            pluginConfig = {},
            context = {
                project: project,
                commitHash: commitHash,
                branchName: 'test',
                activeNode: '/f/t/v',
            };

        manager.executePlugin(pluginName, pluginConfig, context, function (err, pluginResult) {
            try {
                expect(pluginResult.success).to.equal(false);
                //expect(pluginResult).to.deep.equal({});
                expect(pluginResult.error).to.include('violation(s)');
                expect(pluginResult.messages.length).to.equal(3);
                done();
            }
            catch (e) {
                done(e);
            }
        });
    });

    it('should fail on space in component names', function (done) {
        var manager = new PluginCliManager(null, logger, gmeConfig),
            pluginConfig = {},
            context = {
                project: project,
                commitHash: commitHash,
                branchName: 'test',
                activeNode: '/f/t/z',
            };

        manager.executePlugin(pluginName, pluginConfig, context, function (err, pluginResult) {
            try {
                expect(pluginResult.success).to.equal(false);
                //expect(pluginResult).to.deep.equal({});
                expect(pluginResult.error).to.include('violation(s)');
                expect(pluginResult.messages.length).to.equal(1);
                done();
            }
            catch (e) {
                done(e);
            }
        });
    });

    it('should fail on invalid guard expression', function (done) {
        var manager = new PluginCliManager(null, logger, gmeConfig),
            pluginConfig = {},
            context = {
                project: project,
                commitHash: commitHash,
                branchName: 'test',
                activeNode: '/f/t/q',
            };

        manager.executePlugin(pluginName, pluginConfig, context, function (err, pluginResult) {
            try {
                expect(pluginResult.success).to.equal(false);
                //expect(pluginResult).to.deep.equal({});
                expect(pluginResult.error).to.include('violation(s)');
                expect(pluginResult.messages.length).to.equal(1);
                done();
            }
            catch (e) {
                done(e);
            }
        });
    });

    it('should fail on invalid guard expression with spaces', function (done) {
        var manager = new PluginCliManager(null, logger, gmeConfig),
            pluginConfig = {},
            context = {
                project: project,
                commitHash: commitHash,
                branchName: 'test',
                activeNode: '/f/t/o',
            };

        manager.executePlugin(pluginName, pluginConfig, context, function (err, pluginResult) {
            try {
                expect(pluginResult.success).to.equal(false);
                //expect(pluginResult).to.deep.equal({});
                expect(pluginResult.error).to.include('violation(s)');
                expect(pluginResult.messages.length).to.equal(1);
                done();
            }
            catch (e) {
                done(e);
            }
        });
    });
});
