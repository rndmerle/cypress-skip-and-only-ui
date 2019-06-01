"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var falafel = require('falafel');
var fs = require('fs');
var R = require('ramda');
var isTestBlock = function (name) { return function (node) {
    return (node.type === 'CallExpression' &&
        node.callee &&
        node.callee.type === 'Identifier' &&
        node.callee.name === name);
}; };
var isDescribe = isTestBlock('describe');
var isContext = isTestBlock('context');
var isIt = isTestBlock('it');
var isItOnly = function (node) {
    return (node.type === 'CallExpression' &&
        node.callee &&
        node.callee.type === 'MemberExpression' &&
        node.callee.object &&
        node.callee.property &&
        node.callee.object.type === 'Identifier' &&
        node.callee.object.name === 'it' &&
        node.callee.object.type === 'Identifier' &&
        node.callee.property.name === 'only');
};
var isItSkip = function (node) {
    return (node.type === 'CallExpression' &&
        node.callee &&
        node.callee.type === 'MemberExpression' &&
        node.callee.object &&
        node.callee.property &&
        node.callee.object.type === 'Identifier' &&
        node.callee.object.name === 'it' &&
        node.callee.object.type === 'Identifier' &&
        node.callee.property.name === 'skip');
};
var getItsName = function (node) { return node.arguments[0].value; };
var parseAndEdit = function (source, callback, _a) {
    var _b = (_a === void 0 ? {} : _a).module, module = _b === void 0 ? false : _b;
    return falafel(source, { sourceType: module ? "module" : "script", ecmaVersion: 9 }, callback);
};
/**
 * Given a spec filename and name of a test, sets "it.only" for give list of tests.
 */
exports.onlyTests = function (specFilename, leaveTests) {
    console.log('onlyTests in spec', specFilename);
    console.log('leave tests', leaveTests);
    var source = fs.readFileSync(specFilename, 'utf8');
    var shouldLeaveTest = function (testName) { return leaveTests.some(R.equals(testName)); };
    var findSuites = function (node, names) {
        if (names === void 0) { names = []; }
        if (!node) {
            return;
        }
        if (isDescribe(node) || isContext(node)) {
            names.push(getItsName(node));
        }
        return findSuites(node.parent, names);
    };
    var skipAllTests = function (node) {
        // console.log(node)
        if (isIt(node)) {
            var names = [getItsName(node)];
            findSuites(node, names);
            // we were searching from inside out, thus need to revert the names
            var testName = names.reverse();
            console.log('found test', testName);
            if (shouldLeaveTest(testName)) {
                console.log('should .only test "%s"', testName);
                node.update('it.only' + node.source().substr(2));
                // console.log(node)
            }
        }
        else if (isItOnly(node)) {
            var testName = [getItsName(node)];
            console.log('found it.only', testName);
            // nothing to do
        }
        else if (isItSkip(node)) {
            var testName = [getItsName(node)];
            console.log('found it.skip', testName);
            node.update('it.only' + node.source().substr(7));
        }
    };
    var output;
    try {
        output = parseAndEdit(source, skipAllTests);
    }
    catch (err) {
        if (err.stack.includes("'import' and 'export' may appear only with 'sourceType: module'")) {
            output = parseAndEdit(source, skipAllTests, { module: true });
        }
    }
    // console.log(output)
    fs.writeFileSync(specFilename, output, 'utf8');
};
/**
 * Given a spec filename and name of a test, sets "it.skip" for give list of tests.
 */
exports.skipTests = function (specFilename, skipTests) {
    console.log('skipTests in spec', specFilename);
    console.log('skip tests', skipTests);
    var source = fs.readFileSync(specFilename, 'utf8');
    var shouldLeaveTest = function (testName) { return skipTests.some(R.equals(testName)); };
    var findSuites = function (node, names) {
        if (names === void 0) { names = []; }
        if (!node) {
            return;
        }
        if (isDescribe(node) || isContext(node)) {
            names.push(getItsName(node));
        }
        return findSuites(node.parent, names);
    };
    var skipAllTests = function (node) {
        // console.log(node)
        if (isIt(node)) {
            var names = [getItsName(node)];
            findSuites(node, names);
            // we were searching from inside out, thus need to revert the names
            var testName = names.reverse();
            console.log('found test', testName);
            if (shouldLeaveTest(testName)) {
                console.log('should .only test "%s"', testName);
                node.update('it.skip' + node.source().substr(2));
                // console.log(node)
            }
        }
        else if (isItOnly(node)) {
            var testName = [getItsName(node)];
            console.log('found it.only', testName);
            node.update('it.skip' + node.source().substr(7));
        }
        else if (isItSkip(node)) {
            var testName = [getItsName(node)];
            console.log('found it.skip', testName);
            // nothing to do
        }
    };
    var output;
    try {
        output = parseAndEdit(source, skipAllTests);
    }
    catch (err) {
        if (err.stack.includes("'import' and 'export' may appear only with 'sourceType: module'")) {
            output = parseAndEdit(source, skipAllTests, { module: true });
        }
    }
    // console.log(output)
    fs.writeFileSync(specFilename, output, 'utf8');
};
/**
 * Removes all .only and .skip from spec file
 */
exports.runAllTests = function (specFilename) {
    console.log('enable all tests in spec', specFilename);
    var source = fs.readFileSync(specFilename, 'utf8');
    var findSuites = function (node, names) {
        if (names === void 0) { names = []; }
        if (!node) {
            return;
        }
        if (isDescribe(node) || isContext(node)) {
            names.push(getItsName(node));
        }
        return findSuites(node.parent, names);
    };
    var enableAllTests = function (node) {
        // console.log(node)
        if (isItOnly(node)) {
            var testName = [getItsName(node)];
            console.log('found it.only', testName);
            node.update('it' + node.source().substr(7));
        }
        else if (isItSkip(node)) {
            var testName = [getItsName(node)];
            console.log('found it.skip', testName);
            node.update('it' + node.source().substr(7));
        }
    };
    var output;
    try {
        output = parseAndEdit(source, enableAllTests);
    }
    catch (err) {
        if (err.stack.includes("'import' and 'export' may appear only with 'sourceType: module'")) {
            output = parseAndEdit(source, enableAllTests, { module: true });
        }
    }
    // console.log(output)
    fs.writeFileSync(specFilename, output, 'utf8');
};
// module.exports = {
//   onlyTests,
//   skipTests,
//   runAllTests
// }
// if (!module.parent) {
//   onlyTests('./cypress/integration/spec.js', [['works b']])
// }
