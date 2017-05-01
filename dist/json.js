"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Bluebird = require("bluebird");
const fs = require("fs");
exports.readJson = (filename) => {
    return new Bluebird((resolve, reject) => {
        fs.readFile(filename, 'utf8', (err, data) => {
            if (err)
                return reject(err);
            try {
                // Replace UTF-8 BOM, if exists
                data = data.replace(/^\uFEFF/, '');
                resolve(JSON.parse(data));
            }
            catch (err) {
                reject(err);
            }
        });
    });
};
exports.writeJson = (filename, data) => {
    return new Bluebird((resolve, reject) => {
        let outputStr;
        try {
            outputStr = JSON.stringify(data, null, 2);
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
//# sourceMappingURL=json.js.map