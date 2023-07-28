/*
This file is the typescript version of the original src/utils/deepClone.js file from: https://github.com/Pranomvignesh/constrained-editor-plugin
*/
export const deepClone = (function () {
    var byPassPrimitives = function (value, callback) {
        if (typeof value !== 'object' || value === null) {
            return this.freeze ? Object.freeze(value) : value;
        }
        if (value instanceof Date) {
            return this.freeze ? Object.freeze(new Date(value)) : new Date(value);
        }
        return callback.call(this, value);
    };
    var cloneArray = function (array, callback) {
        var keys = Object.keys(array);
        var arrayClone = new Array(keys.length);
        for (var i = 0; i < keys.length; i++) {
            //@ts-ignore
            arrayClone[keys[i]] = byPassPrimitives.call(this, array[keys[i]], callback);
        }
        return arrayClone;
    };
    var cloner = function (object) {
        return byPassPrimitives.call(this, object, function (object) {
            if (Array.isArray(object)) {
                return cloneArray.call(this, object, cloner);
            }
            var clone = {};
            for (var key in object) {
                if (!this.withProto && Object.hasOwnProperty.call(object, key) === false) {
                    continue;
                }
                clone[key] = byPassPrimitives.call(this, object[key], cloner);
            }
            return clone;
        });
    };
    var config = (function () {
        var constructOptionForCode = function (self, value) {
            var options = [
                'withProto',
                'freeze'
            ];
            self[value] = options.reduce(function (acc, option) {
                if (acc[option] = (value >= self[option])) {
                    value -= self[option];
                }
                return acc;
            }.bind(self), {});
        };
        var codes = Object.create(Object.defineProperties({}, {
            withProto: { value: 1 },
            freeze: { value: 2 }
        }));
        for (var i = 0; i <= 3; i++) {
            constructOptionForCode(codes, i);
        }
        return codes;
    }());
    var methods = {
        withProto: cloner.bind(config[1]),
        andFreeze: cloner.bind(config[2]),
        withProtoAndFreeze: cloner.bind(config[3])
    };
    var API = cloner.bind(config[0]);
    for (var methodName in methods) {
        Object.defineProperty(API, methodName, {
            enumerable: false,
            writable: false,
            configurable: false,
            value: methods[methodName]
        });
    }
    return API;
}());
export default deepClone;
