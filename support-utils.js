"use strict";
/// <reference types="cypress" />
Object.defineProperty(exports, "__esModule", { value: true });
var ramda_1 = require("ramda");
var _ = Cypress._;
exports.getRootSuite = function (runnable) {
    if (runnable.parent) {
        return exports.getRootSuite(runnable.parent);
    }
    return runnable;
};
exports.getTests = function (rootRunnable, title) {
    if (title === void 0) { title = []; }
    var testNames = _.map(rootRunnable.tests, 'title');
    var fullTestNames = title.length
        ? testNames.map(function (name) { return ramda_1.append(name, title); })
        : testNames.map(function (name) { return [name]; });
    // for each suite
    var fullSuiteNames = ramda_1.unnest(rootRunnable.suites.map(function (suite) {
        var fullSuiteName = ramda_1.append(suite.title, title);
        return exports.getTests(suite, fullSuiteName);
    }));
    return ramda_1.concat(fullSuiteNames, fullTestNames);
};
