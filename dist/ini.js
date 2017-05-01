"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Bluebird = require("bluebird");
const ini = require("ini");
const fs = require("fs");
exports.readIni = (filename) => {
    return new Bluebird((resolve, reject) => {
        fs.readFile(filename, 'utf8', (err, data) => {
            if (err)
                return reject(err);
            try {
                resolve(ini.parse(data));
            }
            catch (err) {
                reject(err);
            }
        });
    });
};
//# sourceMappingURL=ini.js.map