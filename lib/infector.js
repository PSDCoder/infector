'use strict';

var _ = require('lodash');

/**
 * Expose `infector`.
 */

var infector = module.exports = {};

/**
 * Holds the registered modules.
 */

infector.modules = {};

/**
 * Registers modules and defines how they are to be returned. Objects should
 * define required dependencies using the registered names.
 *
 * There are two ways a module can be obtained from the infector:
 *
 * * `type`: a new instance will be created via `new` and returned.
 * * `value`: the registered value will be returned.
 *
 * Example:
 *
 * ```js
 * infector.register({
 *   'moduleOne': { type: require('./moduleOne') },
 *   'moduleTwo': { value: require('./moduleTwo') }
 * });
 * ```
 *
 * @param {Object} obj Modules to register.
 * @api public
 */

infector.register = function(obj){
  _.extend(this.modules, obj);
};

/**
 * Returns a module.
 *
 * Example:
 *
 * ```js
 * infector.get('moduleOne');
 * ```
 *
 * @param {String} name The name of the module to return.
 * @return {Object} The module instance or value.
 * @api public
 */

infector.get = function(name){
  var module = this.modules[name];
  if (!module) throw new Error(name + ' has not been configured');
  if (module.type) return this._construct(module.type);
  else if (module.value) return module.value;
  else throw new Error(name + ' has an unknown return instruction');
};

/**
 * Constructs an object and injects it's dependencies via an `args` array.
 * 
 * @param {Function} Constructor
 * @return {Object}
 * @api private
 */

infector._construct = function(Constructor){
  var args = [];
  _.each(this._getDependencies(Constructor), function(key, i){
    args[i] = infector.get(key);
  });
  function F() { Constructor.apply(this, args); }
  F.prototype = Constructor.prototype;
  return new F();
};

 /**
 * Returns an object's dependency array.
 * 
 * @param {Function} Constructor
 * @return {Array}
 * @api private
 */

infector._getDependencies = function(Constructor){
  return this._getExplicitDependencies(Constructor) ||
    this._getInferredDependencies(Constructor);
};

/**
 * Returns an object's explicit dependencies specified by the
 * `inject` property. If you want to stay consistent with the whole
 * `infector` thing, you can use an `infect` property as well. Either
 * way, they both do the same thing ;)
 * 
 * @param {Function} Constructor
 * @return {Array}
 * @api private
 */

infector._getExplicitDependencies = function(Constructor){
  return Constructor.infect || Constructor.inject;
};

/**
 * Returns an object's inferred dependencies. Constructor argument names refer
 * to registered module names.
 *
 * @param {Function} Constructor
 * @return {Array}
 * @api private
 */

infector._getInferredDependencies = function(Constructor){
  var regex = /function.*?\((.*?)\)\s*?{/;
  var result = regex.exec(Constructor.toString());
  var arr = result[1].split(/, */);
  return arr[0] === '' ? null : arr;
};