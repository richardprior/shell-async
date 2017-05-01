"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Bluebird = require("bluebird");
const csv = require("csvtojson");
exports.readCsv = (filename, hasHeader) => {
    return new Bluebird((resolve, reject) => {
        let rows = [];
        csv({ noheader: !hasHeader })
            .fromFile(filename)
            .on("csv", function (row) {
            rows.push(row);
        })
            .on("end", function () {
            resolve(rows);
        });
    });
};
//# sourceMappingURL=csv.js.map