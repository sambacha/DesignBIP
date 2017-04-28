/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Generated by PluginGenerator 1.7.0 from webgme on Wed Mar 08 2017 15:24:49 GMT-0600 (Central Standard Time).
 * A plugin that inherits from the PluginBase. To see source code documentation about available
 * properties and methods visit %host%/docs/source/PluginBase.html.
 */

define([
    'plugin/PluginConfig',
    'text!./metadata.json',
    'plugin/PluginBase',
    'q',
    'common/util/ejs',
    'bipsrc/util/utils',
    'bipsrc/templates/ejsCache',
    'bipsrc/parsers/javaExtra',
    'bipsrc/bower_components/pegjs/peg-0.10.0'
], function (
    PluginConfig,
    pluginMetadata,
    PluginBase,
    Q,
    ejs,
    utils,
    ejsCache,
    javaParser,
    peg) {
    'use strict';

    pluginMetadata = JSON.parse(pluginMetadata);

    /**
     * Initializes a new instance of ComponentTypeGenerator.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin ComponentTypeGenerator.
     * @constructor
     */
    var BehaviorSpecGenerator = function () {
        // Call base class' constructor.
        PluginBase.call(this);
        this.pluginMetadata = pluginMetadata;
    };

    /**
     * Metadata associated with the plugin. Contains id, name, version, description, icon, configStructue etc.
     * This is also available at the instance at this.pluginMetadata.
     * @type {object}
     */
    BehaviorSpecGenerator.metadata = pluginMetadata;

    // Prototypical inheritance from PluginBase.
    BehaviorSpecGenerator.prototype = Object.create(PluginBase.prototype);
    BehaviorSpecGenerator.prototype.constructor = BehaviorSpecGenerator;

    /**
     * Main function for the plugin to execute. This will perform the execution.
     * Notes:
     * - Always log with the provided logger.[error,warning,info,debug].
     * - Do NOT put any user interaction logic UI, etc. inside this method.
     * - callback always has to be called even if error happened.
     *
     * @param {function(string, plugin.PluginResult)} callback - the result callback
     */
    BehaviorSpecGenerator.prototype.main = function (callback) {
        // Use self to access core, project, result, logger etc from PluginBase.
        // These are all instantiated at this point
        var self = this,
            filesToAdd = {},
            violations = [],
            nodes,
            artifact,
            componentTypes = [],
            guardExpressionParser,
            i;

        function checkComponentModel (componentType, fileName) {
            var deferred = Q.defer();

            utils.getModelOfComponentType(self.core, nodes[componentType]).then(function (componentModel) {
                filesToAdd[fileName] = ejs.render(ejsCache.componentType.complete, componentModel);
                var parseResult = javaParser.checkWholeFile(filesToAdd[fileName]);
                if (parseResult) {
                    violations.push(parseResult);
                }
                guardExpressionParser = self.getGuardExpression(componentModel);
                for (i = 0; i < componentModel.transitions.length; i += 1) {
                    if (componentModel.transitions[i].guard.length > 0) {
                        try {
                            parseResult = guardExpressionParser.parse(componentModel.transitions[i].guard);
                        } catch (e) {
                            violations.push({
                                message: 'Guard expression should be a logical expression ' +
                                'that has only defined guard names as symbols.',
                                node: componentModel.transitions[i]
                            });
                        }
                    }
                }
                deferred.resolve();
            });
            return deferred.promise;
        }

        self.loadNodeMap(self.activeNode)
          .then(function (nodes_) {
                    var promises = [],
                        type,
                        fileName;

                    nodes = nodes_;
                    componentTypes = self.getComponentTypeNodes(nodes);
                    self.logger.debug(componentTypes.length);
                    for (type of componentTypes) {
                        fileName = self.core.getAttribute(nodes[type], 'name') + '.java';
                        self.logger.info('filename ' + fileName);
                        promises.push(checkComponentModel(type, fileName));
                    }
                    return Q.all(promises);})
                    .then(function () {
                        violations.push.apply(violations, self.hasViolations(componentTypes, nodes));
                        if (violations.length > 0) {
                            violations.forEach(function (violation) {
                                if (violation.hasOwnProperty('node')) {
                                    self.createMessage(violation.node, violation.message, 'error');
                                } else {
                                    self.createMessage(violation.line, violation.msg, 'error');
                                }
                            });
                            throw new Error ('Model has ' + violations.length + ' violation(s). See messages for details.');
                        }
                        artifact = self.blobClient.createArtifact('BehaviorSpecifications');
                        return artifact.addFiles(filesToAdd);
                    })
                .then(function (fileHash) {
                    self.result.addArtifact(fileHash);
                    return artifact.save();
                })
                .then(function (artifactHash) {
                    self.result.addArtifact(artifactHash);
                    self.result.setSuccess(true);
                    callback(null, self.result);
                })
                .catch(function (err) {
                    self.logger.error(err.stack);
                    // Result success is false at invocation.
                    callback(err, self.result);
                });

    };

    BehaviorSpecGenerator.prototype.getGuardExpression = function (componentModel) {
        var guardNames = [],
          i,
          guardExpressionParser;

        for (i = 0; i < componentModel.guards.length; i += 1) {
            guardNames.push(componentModel.guards[i].name);
        }
        if (guardNames.length > 0) {
            guardExpressionParser = peg.generate(
              ejs.render(ejsCache.guardExpression, {guardNames: guardNames})
          );
        }
        return guardExpressionParser;
    };

    BehaviorSpecGenerator.prototype.getComponentTypeNodes = function (nodes) {
        var self = this,
            path,
            node,
            componentTypes = [];

        for (path in nodes) {
            node = nodes[path];
            if (self.isMetaTypeOf(node, self.META.ComponentType)) {
                componentTypes.push(path);
            }
        }
        return componentTypes;
    };

    //ehaviorSpecGenerator.prototype.checkState = function()

    BehaviorSpecGenerator.prototype.hasViolations = function (componentTypes, nodes) {
            var violations = [],
            guardNames = {},
            stateWithValidTransitions = {},
            totalStateNames = {},
            transitionNames = {},
            componentTypeNames = {},
            name,
            type,
            state, stateName,
            child, childPath, childName,
            node,
            noInitialState;

            for (type of componentTypes) {
                guardNames = {};
                stateWithValidTransitions = {};
                totalStateNames = {};
                transitionNames = {};
                noInitialState = true;
                node = nodes[type];
                name = this.core.getAttribute(node, 'name');
                this.logger.info(name);

                if (componentTypeNames.hasOwnProperty(name)) {
                    violations.push({
                        node: node,
                        message: 'Name [' + name + '] of component type [' + type + '] is not unique. Please rename. Component types must have unique names. '
                    });
                }
                componentTypeNames[name] = this.core.getPath(node);

                for (childPath of this.core.getChildrenPaths(node)) {
                    child = nodes[childPath];
                    childName = this.core.getAttribute(child, 'name');
                    if ((this.isMetaTypeOf(child, this.META.State)) || (this.isMetaTypeOf(child, this.META.InitialState))) {

                        if (totalStateNames.hasOwnProperty(childName)) {
                            violations.push({
                                node: child,
                                message: 'Name [' + childName + '] of state [' + child + '] is not unique. Please rename. States that belong to the same component type must have unique names.'
                            });
                        }
                        totalStateNames[childName] = this.core.getPath(child);
                        if ((this.isMetaTypeOf(child, this.META.InitialState))) {
                          noInitialState = false;
                        }
                    }

                    if (this.isMetaTypeOf(child, this.META.EnforceableTransition) || this.isMetaTypeOf(child, this.META.SpontaneousTransition) || this.isMetaTypeOf(child, this.META.InternalTransition)) {
                        if (this.core.getPointerPath(child, 'dst') === null) {
                            violations.push({
                                node: child,
                                message: 'Transition [' + childName + '] with no destination encountered. Please connect or remove it.'
                            });
                        }
                        if (this.core.getPointerPath(child, 'src') === null) {
                            violations.push({
                                node: child,
                                message: 'Transition [' + childName + '] with no source encountered. Please connect or remove it.'
                            });
                        }
                        if (this.core.getAttribute(child, 'transitionMethod') === '') {
                            violations.push({
                                node: child,
                                message: 'Attribute transitionMethod of transition [' + childName + '] is not defined. Please define transitionMethod.'
                            });
                        }
                    }
                    if ( this.isMetaTypeOf(child, this.META.EnforceableTransition) || this.isMetaTypeOf(child, this.META.SpontaneousTransition)) {

                        if (this.core.getPointerPath(child, 'dst') !== null) {
                            state = nodes[this.core.getPointerPath(child, 'dst')];
                            stateName = this.core.getAttribute(state, 'name');
                            stateWithValidTransitions[stateName] = this.core.getPath(state);
                        }

                        if (this.core.getPointerPath(child, 'src') !== null) {
                            state = nodes[this.core.getPointerPath(child, 'src')];
                            stateName = this.core.getAttribute(state, 'name');
                            stateWithValidTransitions[stateName] = this.core.getPath(state);
                        }

                        if (transitionNames.hasOwnProperty(childName)) {
                            violations.push({
                                node: child,
                                message: 'Name [' + childName + '] of transition [' + child + '] is not unique. Please rename. Enforceable and spontaneous transitions of the same component type must have unique names.'
                            });
                        }
                        transitionNames[childName] = this.core.getPath(child);
                    }
                    if (this.isMetaTypeOf(child, this.META.Guard)) {
                        if (guardNames.hasOwnProperty(childName)) {
                            violations.push({
                                node: child,
                                message: 'Name [' + childName + '] of guard [' + child + '] is not unique. Please rename. Guards of the same component type must have unique names.'
                            });
                        }
                        guardNames[childName] = this.core.getPath(child);

                        if (this.core.getAttribute(child, 'guardMethod') === '') {
                            violations.push({
                                node: child,
                                message: 'Attribute guardMethod of transition [' + childName + '] is not defined. Please define guardMethod.'
                            });
                        }
                    }
                }
                if (noInitialState) {
                    violations.push({
                        node: node,
                        message: 'Component type [' + name + '] does not have an initial state. Please define an initial state.'
                    });
                }
                for (stateName in totalStateNames) {
                    if (!stateWithValidTransitions.hasOwnProperty(stateName)) {
                        this.logger.warn('State [' + stateName + '] of component type ' + name +  ' has no transitions associated with it. Please remove or connect.');
                    }
                }

            }
            return violations;
        };
    return BehaviorSpecGenerator;
});
