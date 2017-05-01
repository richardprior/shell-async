"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Bluebird = require("bluebird");
const fs = require("fs");
exports.readTextFile = (filename) => {
    return new Bluebird((resolve, reject) => {
        fs.readFile(filename, 'utf8', (err, data) => {
            if (err)
                return reject(err);
            try {
                resolve(data);
            }
            catch (err) {
                reject(err);
            }
        });
    });
};
exports.writeTextFile = (filename, data) => {
    return new Bluebird((resolve, reject) => {
        fs.writeFile(filename, data, 'utf8', (err) => {
            if (err)
                return reject(err);
            resolve();
        });
    });
};
//# sourceMappingURL=file.js.map