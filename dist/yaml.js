"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Bluebird = require("bluebird");
const yaml = require("js-yaml");
const fs = require("fs");
exports.readYaml = (filename) => {
    return new Bluebird((resolve, reject) => {
        fs.readFile(filename, 'utf8', (err, data) => {
            if (err)
                return reject(err);
            try {
                resolve(yaml.safeLoad(data));
            }
            catch (err) {
                reject(err);
            }
        });
    });
};
exports.writeYaml = (filename, data) => {
    return new Bluebird((resolve, reject) => {
        let outputStr;
        try {
            outputStr = yaml.safeDump(data, { sortKeys: true, noRefs: true });
        }
        catch (err) {
            return reject(err);
        }
        fs.writeFile(filename, outputStr, 'utf8', (err) => {
            if (err)
                return reject(err);
            resolve();
        });
    });
};
exports.readYamlString = (data) => {
    return yaml.safeLoad(data);
};
//# sourceMappingURL=yaml.js.map