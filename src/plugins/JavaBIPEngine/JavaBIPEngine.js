/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Generated by PluginGenerator 1.7.0 from webgme on Mon Mar 20 2017 21:44:14 GMT-0500 (CDT).
 * A plugin that inherits from the PluginBase. To see source code documentation about available
 * properties and methods visit %host%/docs/source/PluginBase.html.
 */

define([
    'plugin/PluginConfig',
    'text!./metadata.json',
    'plugin/PluginBase'
], function (
    PluginConfig,
    pluginMetadata,
    PluginBase) {
    'use strict';

    pluginMetadata = JSON.parse(pluginMetadata);

    /**
     * Initializes a new instance of JavaBIPEngine.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin JavaBIPEngine.
     * @constructor
     */
    var JavaBIPEngine = function () {
        // Call base class' constructor.
        PluginBase.call(this);
        this.pluginMetadata = pluginMetadata;
    };

    /**
     * Metadata associated with the plugin. Contains id, name, version, description, icon, configStructue etc.
     * This is also available at the instance at this.pluginMetadata.
     * @type {object}
     */
    JavaBIPEngine.metadata = pluginMetadata;

    // Prototypical inheritance from PluginBase.
    JavaBIPEngine.prototype = Object.create(PluginBase.prototype);
    JavaBIPEngine.prototype.constructor = JavaBIPEngine;

    /**
     * Main function for the plugin to execute. This will perform the execution.
     * Notes:
     * - Always log with the provided logger.[error,warning,info,debug].
     * - Do NOT put any user interaction logic UI, etc. inside this method.
     * - callback always has to be called even if error happened.
     *
     * @param {function(string, plugin.PluginResult)} callback - the result callback
     */
    JavaBIPEngine.prototype.main = function (callback) {
        // Use self to access core, project, result, logger etc from PluginBase.
        // These are all instantiated at this point.
        var self = this;

        self.loadNodeMap(self.activeNode)
                .then(function (nodes) {
                    self.logger.debug(Object.keys(nodes));

                    var violations = self.hasViolations(nodes);
                    if (violations.length > 0) {
                        violations.forEach(function (violation) {
                            self.createMessage(violation.node, violation.message, 'error');
                        });
                        throw new Error('Model has ' + violations.length + '  violation(s), see messages for details');
                    }
                    var inconsistencies = self.checkConsistency(nodes);
                    if (inconsistencies.length === 0) {
                        self.startJavaBIPEngine();
                    } else {
                        for (var problem in inconsistencies) {
                            violations.push({
                                message: 'ConnectorMotif connected with ends [' + problem + '] is inconsistent'
                            });
                        }
                        throw new Error('Model has ' + violations.length + '  inconsistencies, see messages for details');
                    }
                })
        .then(function () {
                        self.result.setSuccess(true);
                        callback(null, self.result);
                    })
                    .catch(function (err) {
                        self.logger.error(err.stack);
                        // Result success is false at invocation.
                        callback(err, self.result);
                    });
    };

    JavaBIPEngine.prototype.checkConsistency = function (nodes) {
        var self = this,
         inconsistencies = [],
         componentTypes = [],
         ports = [],
         subConnectors = [],
         connectorEnds = [],
         connectors = [];

        for (var path in nodes) {
            var node = nodes[path];
            if (self.isMetaTypeOf(node, self.META.ComponentType)) {
                var cardinality = self.core.getAttribute(node, 'cardinality');
                var component = node;
                componentTypes.push(component);
                for (var child of self.core.getChildrenPaths(node)) {
                    if (self.isMetaTypeOf(nodes[child], self.META.EnforceableTransition)) {
                        var port = nodes[child];
                        ports.push(port);
                        if (!/^[1-9][0-9]*$/.test(cardinality)) {
                            component.cardinalityParameter = cardinality;
                        }
                        while (!/^[1-9][0-9]*$/.test(cardinality) ) {
                            //TODO: add parser for expressions
                            cardinality = 3;
                            //cardinality = prompt('Please enter number of component instances for ' + self.core.getAttribute(node, 'name') + 'component type');
                        }
                        nodes[child].cardinality = cardinality;
                    }
                }
                component.cardinalityValue = cardinality;

            } else if (self.isMetaTypeOf(node, self.META.Connector)) {
                /* If the connector is binary */
                if (self.getMetaType(nodes[self.core.getPointerPath(node, 'dst')]) !== self.META.Connector) {
                    var connector = node;
                    connectors.push(connector);
                    var srcConnectorEnd = nodes[self.core.getPointerPath(node, 'src')];
                    var dstConnectorEnd = nodes[self.core.getPointerPath(node, 'dst')];
                    srcConnectorEnd.connector = connector;
                    dstConnectorEnd.connector = connector;
                    connector.ends = [srcConnectorEnd, dstConnectorEnd];
                /* If it is part of an n-ary connector */
                } else {
                    subConnectors.push(node);
                }
            } else if (self.isMetaTypeOf(node, self.META.Connection) && self.getMetaType(node) !== node) {
                var gmeEnd = nodes[self.core.getPointerPath(node, 'src')];
                if (self.getMetaType(gmeEnd) !== self.META.Connector) {
                    var connectorEnd = gmeEnd;
                    connectorEnd.cardinality = nodes[self.core.getPointerPath(node, 'dst')].cardinality;
                    connectorEnds.push(connectorEnd);
                    connectorEnd.degree = self.core.getAttribute(gmeEnd, 'degree');
                    connectorEnd.multiplicity = self.core.getAttribute(gmeEnd, 'multiplicity');
                }
                //TODO: add export ports for hierarchical connector motifs
            }
        }
        for (var subpart of subConnectors) {
            var auxNode = nodes[self.core.getPointerPath(subpart, 'dst')];
            var srcAuxNode = nodes[self.core.getPointerPath(auxNode, 'src')];
            var srcEnd = nodes[self.core.getPointerPath(subpart, 'src')];
            if (connectors.includes(auxNode)) {
                auxNode.ends.push(srcEnd);
                srcEnd.connector = auxNode;
            } else if (connectorEnds.includes(srcAuxNode)) {
                for (var existingConnector in connectors) {
                    if (existingConnector.ends.includes(srcAuxNode)) {
                        existingConnector.ends.push(srcEnd);
                        srcEnd.connector = existingConnector;
                    }
                }
            }
        }
        for (var motif of connectors) {
            var matchingFactor = -1;
            for (var end of motif.ends) {
                if (!/^[0-9]+$/.test(end.degree)) {
                    //TODO: update for expressions
                    self.logger.debug('length ' + componentTypes.length);
                    for (var type of componentTypes) {
                        self.logger.debug('component.cardinalityParameter ' + type.cardinalityParameter);
                        self.logger.debug('component.cardinalityValue ' + type.cardinalityValue);
                        if (type.cardinalityParameter === end.degree) {
                            end.degree = type.cardinalityValue;
                        }
                    }
                }
                if (!/^[0-9]+$/.test(end.multiplicity)) {
                  //TODO: update for expressions
                    for (var type of componentTypes) {
                        if (type.cardinalityParameter === end.multiplicity) {
                            end.multiplicity = type.cardinalityValue;
                        }
                    }
                }
                if (matchingFactor === -1) {
                    matchingFactor = (end.degree * end.cardinality) / end.multiplicity;
                } else if (matchingFactor !== (end.degree * end.cardinality) / end.multiplicity) {
                    inconsistencies.push(motif);
                }
                self.logger.debug('matching factor ' + matchingFactor);
            }
        }
        return inconsistencies;
    };

    JavaBIPEngine.prototype.startJavaBIPEngine = function () {

    };

    JavaBIPEngine.prototype.hasViolations = function (nodes) {
        var violations = [],
        cardinalities = [],
        connectorEnds = [],
        self = this,
        nodePath,
        node;

        /*TODO: 1. Check if multiplicities are less than cardinalities
        2. Check that multiplicities, degrees are arithmetic expressions of cardinalities*/
        for (nodePath in nodes) {
            node = nodes[nodePath];
            if (self.isMetaTypeOf(node, this.META.ComponentType)) {
                // Checks cardinality whether it is non zero natural number or a character
                if (/^[a-z]|[1-9][0-9]*$/.test(self.core.getAttribute(node, 'cardinality'))) {
                    cardinalities.push(self.core.getAttribute(node, 'cardinality'));
                } else {
                    violations.push({
                        node: node,
                        message: 'Cardinality [' + this.core.getAttribute(node, 'cardinality') + '] of component type [' + this.core.getAttribute(node, 'name') + '] is not a natural non-zero number or a character'
                    });
                }

            } else if (self.isMetaTypeOf(node, this.META.Synchron) || self.isMetaTypeOf(node, this.META.Trigger)) {
                connectorEnds.push(node);
            }
        }
        for (var end of connectorEnds) {
            // Checks multiplicities and degrees
            //TODO: update for expressions
            self.logger.debug(self.core.getAttribute(end, 'name'));
            self.logger.debug(self.core.getAttribute(end, 'multiplicity'));
            if (!/^[0-9]+$/.test(self.core.getAttribute(end,  'multiplicity')) && !cardinalities.includes(self.core.getAttribute(end, 'multiplicity'))) {
                violations.push({
                    node: end,
                    message: 'Multiplicity [' + self.core.getAttribute(end, 'multiplicity') + '] of component end [' + this.core.getPath(end) + '] is not a natural number or an arithmetic expression involving cardinality parameters'
                });
                //TODO: update for expressions
                self.logger.debug(self.core.getAttribute(end, 'degree'));
            } else if (!/^[0-9]+$/.test(self.core.getAttribute(end, 'degree')) && !cardinalities.includes(self.core.getAttribute(end, 'degree'))) {
                violations.push({
                    node: end,
                    message: 'Degree [' + self.core.getAttribute(end, 'degree') + '] of component end [' + this.core.getPath(end) + '] is not a natural number or an arithmetic expression involving cardinality parameters'
                });
            }
        }
        return violations;
    };

    return JavaBIPEngine;
});
