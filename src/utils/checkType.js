import { TYPE_MUST_BE, VALUE_EXISTS } from "./errorMessages.js";
import deepFreezer from "./deepFreezer.js";
export const checkType = (function () {//No I18n
  const symbolMap = {};
  const checkInSymbols = function (mightBeSymbol) {
    if (typeof mightBeSymbol === 'symbol') {//No I18n
      const type = symbolMap[mightBeSymbol];
      return typeChecks[type] || mightBeSymbol;
    }
    return mightBeSymbol;
  }
  const basicTypeChecks = {
    STRING: function (baseConstraints, callback) {
      baseConstraints = baseConstraints ? baseConstraints : {};
      return function (value, runTimeConstraints, onConstraintFailure) {
        const constraints = Object.assign({}, baseConstraints, runTimeConstraints);
        const constraintFailure = typeof onConstraintFailure === 'boolean' ? onConstraintFailure : false;//No I18n
        if (typeof value !== 'string') {//No I18n
          return false;
        }
        let valid = true;
        for (let key in constraints) {
          const constraint = checkInSymbols(constraints[key]);
          if (typeof constraint !== 'symbol') {//No I18n
            switch (key) {
              case 'nonEmptyString': {
                if (typeof constraint === 'boolean') {
                  if (constraint) {
                    valid = value.trim().length > 0;
                  }
                } else if (constraintFailure) {
                  valid = false;
                }
              }
                break;
              case 'length': {
                if (typeof constraint === 'function') {//No I18n
                  if (!constraint(value.length)) {
                    valid = false;
                  }
                } else if (typeof constraint === 'number' && constraint === constraint) {//No I18n
                  if (constraint !== value.length) {
                    valid = false;
                  }
                } else if (constraintFailure) {
                  valid = false;
                }
              }
                break;
              case 'allowableValues': {
                if (Array.isArray(constraint)) {
                  if (!constraint.includes(value)) {
                    valid = false;
                  }
                } else if (constraintFailure) {
                  valid = false;
                }
              }
                break;
              case 'matchRegex': {
                if (constraint instanceof RegExp) {
                  if (!constraint.test(value)) {
                    valid = false;
                  }
                } else if (constraintFailure) {
                  valid = false;
                }
              }
            }
          } else {
            valid = false;
          }
        }
        return (valid && callback) ? callback(value) : valid;
      }
    },
    NUMBER: function (baseConstraints, callback) {
      baseConstraints = baseConstraints ? baseConstraints : {};
      return function (value, runTimeConstraints, onConstraintFailure) {
        const constraints = Object.assign({}, baseConstraints, runTimeConstraints);
        const constraintFailure = typeof onConstraintFailure === 'boolean' ? onConstraintFailure : false;//No I18n
        if (typeof value !== 'number') {//No I18n
          return false;
        }
        let valid = true;
        for (let key in constraints) {
          const constraint = checkInSymbols(constraints[key]);
          if (typeof constraint !== 'symbol') {//No I18n
            switch (key) {
              case 'min': {
                if (typeof constraint === 'number' && constraint === constraint) {//No I18n
                  if (constraint > value) {
                    valid = false;
                  }
                } else if (constraintFailure) {
                  valid = false;
                }
              }
                break;
              case 'max': {
                if (typeof constraint === 'number' && constraint === constraint) {//No I18n
                  if (constraint < value) {
                    valid = false;
                  }
                } else if (constraintFailure) {
                  valid = false;
                }
              }
                break;
              case 'whole': {
                if (typeof constraint === 'boolean' && constraint) {//No I18n
                  if ((value - Math.floor(value)) !== 0) {
                    valid = false;
                  }
                } else if (constraintFailure) {
                  valid = false;
                }
              }
                break;
              case 'positive': {
                if (typeof constraint === 'boolean') {//No I18n
                  if (constraint && value < 0) {
                    valid = false;
                  }
                  if (!constraint && value > 0) {
                    valid = false;
                  }
                } else if (constraintFailure) {
                  valid = false;
                }
              }
                break;
              case 'allowableValues': {
                if (Array.isArray(constraint)) {
                  if (!constraint.includes(value)) {
                    valid = false;
                  }
                } else if (constraintFailure) {
                  valid = false;
                }
              }
            }
          } else {
            valid = false;
          }
        }
        return (valid && callback) ? callback(value) : valid;
      }
    },
    ARRAY: function (baseConstraints, callback) {
      baseConstraints = baseConstraints ? baseConstraints : {};
      return function (value, runTimeConstraints, onConstraintFailure) {
        const constraints = Object.assign({}, baseConstraints, runTimeConstraints);
        const constraintFailure = typeof onConstraintFailure === 'boolean' ? onConstraintFailure : false;//No I18n
        if (!Array.isArray(value)) {
          return false;
        }
        let valid = true;
        for (let key in constraints) {
          const constraint = checkInSymbols(constraints[key]);
          if (typeof constraint !== 'symbol') {//No I18n
            switch (key) {
              case 'size': {
                if (typeof constraint === 'function') {//No I18n
                  if (!constraint(value.length)) {
                    valid = false;
                  }
                } else if (typeof constraint === 'number' && constraint === constraint) {//No I18n
                  if (constraint !== value.length) {
                    valid = false;
                  }
                } else if (constraintFailure) {
                  valid = false;
                }
              }
                break;
              case 'instanceOf': {
                if (typeof constraint === 'function') {//No I18n
                  valid = value instanceof constraint
                } else if (constraintFailure) {
                  valid = false;
                }
              }
                break;
              case 'every': {
                if (typeof constraint === 'function') {
                  valid = value.every(function (eachValue) { return constraint(eachValue) });
                } else if (constraintFailure) {
                  valid = false;
                }
              }
                break;
              case 'some': {
                if (typeof constraint === 'function') {
                  valid = value.some(constraint);
                } else if (constraintFailure) {
                  valid = false;
                }
              }
                break;
            }
          } else {
            valid = false;
          }
        }
        return (valid && callback) ? callback(value) : valid;
      }
    },
    OBJECT: function (baseConstraints, callback) {
      baseConstraints = baseConstraints ? baseConstraints : {};
      return function (value, runTimeConstraints, onConstraintFailure) {
        const constraints = Object.assign({}, baseConstraints, runTimeConstraints);
        const constraintFailure = typeof onConstraintFailure === 'boolean' ? onConstraintFailure : false;//No I18n
        if (typeof value !== 'object' || Array.isArray(value)) {//No I18n
          return false;
        }
        let valid = true;
        for (let key in constraints) {
          const constraint = checkInSymbols(constraints[key]);
          if (typeof constraint !== 'symbol') {//No I18n
            switch (key) {
              case 'requiredKeys': {
                if (Array.isArray(constraint)) {//No I18n
                  valid = constraint.every(function (keyName) {
                    return value.hasOwnProperty(keyName)
                  });
                } else if (constraintFailure) {
                  valid = false;
                }
              }
                break;
              case 'instanceOf': {
                if (typeof constraint === 'function') {//No I18n
                  valid = value instanceof constraint
                } else if (constraintFailure) {
                  valid = false;
                }
              }
                break;
              case 'required': {
                if (typeChecks.object(constraint)) {
                  for (let keyName in constraint) {
                    if (value.hasOwnProperty(keyName)) {
                      const validatorFn = constraint[keyName];
                      if (typeChecks.function(validatorFn)) {
                        if (!validatorFn(value[keyName])) {
                          valid = false;
                          break;
                        }
                      } else if (constraintFailure) {
                        valid = false;
                        break;
                      }
                    } else {
                      valid = false;
                      break;
                    }
                  }
                } else if (constraintFailure) {
                  valid = false;
                } else {
                  throw new Error(TYPE_MUST_BE('required', 'object'));//No I18n
                }
              }
                break;
              case 'allowable': {
                if (typeChecks.object(constraint)) {
                  for (let keyName in constraint) {
                    if (value.hasOwnProperty(keyName)) {
                      const validatorFn = constraint[keyName];
                      if (typeChecks.function(validatorFn)) {
                        if (!validatorFn(value[keyName])) {
                          // logError(INVALID_VALUE(keyName, value));
                          valid = false;
                          break;
                        }
                      } else if (constraintFailure) {
                        valid = false;
                        break;
                      }
                    }
                  }
                } else if (constraintFailure) {
                  valid = false;
                } else {
                  throw new Error(TYPE_MUST_BE('allowable', 'object'));//No I18n
                }
              }
                break;
              case 'everyValue': {
                if (typeof constraint === 'function') {//No I18n
                  valid = Object.keys(value).every(function (key) {
                    const eachValue = value[key];
                    return constraint(eachValue);
                  })
                } else if (constraintFailure) {
                  valid = false;
                }
              }
                break;
            }
          } else {
            valid = false;
          }
        }
        return (valid && callback) ? callback(value) : valid;
      }
    }
  }
  const extender = function (name, options, extendFrom, callback) {
    if (this[name]) {
      throw new Error(VALUE_EXISTS(name, 'Type Checks'));//No I18n
    } else if (basicTypeChecks.hasOwnProperty(extendFrom)) {
      this[name] = basicTypeChecks[extendFrom](options, callback)
      return this[name];
    }
    return false;
  }
  for (let basicType in basicTypeChecks) {
    extender[basicType.toLowerCase()] = function (name, options, callback) {
      return this.call(typeChecks, name, options, basicType, callback);
    }
  }
  const manipulator = deepFreezer({
    $extend: extender,
    later: function (typeName) {
      const symbol = Symbol(typeName);
      symbolMap[symbol] = typeName;
      return symbol;
    },
    or: function () {
      const args = Array.from(arguments);
      return function (value) {
        return args.some(function (typeCheck) {
          typeCheck = checkInSymbols(typeCheck);
          if (typeof typeCheck !== 'function') {//No I18n
            return false;
          }
          return typeCheck(value, true); // Constraint Failure is allowable here
        })
      }
    },
    and: function () {
      const args = Array.from(arguments);
      return function (value) {
        return args.every(function (typeCheck) {
          typeCheck = checkInSymbols(typeCheck);
          if (typeof typeCheck !== 'function') {//No I18n
            return false;
          }
          return typeCheck(value, true); // Constraint Failure is allowable here
        })
      }
    }
  })
  const typeChecks = Object.assign(Object.create(manipulator), {
    boolean: function (value) {
      return typeof value === 'boolean';//No I18n
    },
    regex: function (value) {
      return (function () {
        // ? This is done to take the current RegExp Instance whenever the function runs
        return value instanceof RegExp;
      }());
    },
    function: function (value) {
      return typeof value === 'function';//No I18n
    }
  })
  typeChecks.$extend.string('string', {});
  typeChecks.$extend.number('number', {});
  typeChecks.$extend.array('array', {});
  typeChecks.$extend.object('object', {});
  return typeChecks;
});
export default checkType;