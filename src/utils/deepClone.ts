/*
This file is the typescript version of the original src/utils/deepClone.js file from: https://github.com/Pranomvignesh/constrained-editor-plugin
*/

export type Code = { 
  withProto: boolean;
  freeze: boolean;
}
export type Codes = {
  [key: number]: Code;
}
export const deepClone = (function () {
  const byPassPrimitives = function (value: string | number | Date | null | Object, callback: (value: string | number | Date | null | Object) => any) {
    if (typeof value !== 'object' || value === null) {
      return this.freeze ? Object.freeze(value) : value;
    }
    if (value instanceof Date) {
      return this.freeze ? Object.freeze(new Date(value)) : new Date(value);
    }
    return callback.call(this, value);
  }
  const cloneArray = function (array: any[], callback) {
    const keys = Object.keys(array);
    const arrayClone = new Array(keys.length)
    for (let i = 0; i < keys.length; i++) {
      //@ts-ignore
      arrayClone[keys[i]] = byPassPrimitives.call(this, array[keys[i]], callback);
    }
    return arrayClone;
  }
  const cloner = function (object) {
    return byPassPrimitives.call(this, object, function (object) {
      if (Array.isArray(object)) {
        return cloneArray.call(this, object, cloner)
      }
      const clone = {};
      for (let key in object) {
        if (!this.withProto && Object.hasOwnProperty.call(object, key) === false) {
          continue;
        }
        clone[key] = byPassPrimitives.call(this, object[key], cloner);
      }
      return clone;
    })
  }
  const config = (function () {
    const constructOptionForCode = function (self: Codes, value: number) {
      const options = [
        'withProto',
        'freeze'
      ]
      self[value] = options.reduce(function (acc, option) {
        if (acc[option] = (value >= self[option])) {
          value -= self[option]
        }
        return acc;
      }.bind(self), {})
    }
    const codes: Codes = Object.create(Object.defineProperties({}, {
      withProto: { value: 1 },
      freeze: { value: 2 }
    }));
    for (let i = 0; i <= 3; i++) {
      constructOptionForCode(codes, i);
    }
    return codes;
  }());
  const methods = {
    withProto: cloner.bind(config[1]),
    andFreeze: cloner.bind(config[2]),
    withProtoAndFreeze: cloner.bind(config[3])
  }
  const API = cloner.bind(config[0]);
  for (let methodName in methods) {
    Object.defineProperty(API, methodName, {
      enumerable: false,
      writable: false,
      configurable: false,
      value: methods[methodName as keyof typeof methods]
    })
  }
  return API;
}());

export default deepClone;