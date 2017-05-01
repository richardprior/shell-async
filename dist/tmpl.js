"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Handlebars = require("handlebars");
const fs = require("fs");
const readTemplate = (filename) => {
    const src = fs.readFileSync(filename, 'utf8');
    return Handlebars.compile(src, { noEscape: true });
};
exports.tmpl = (src, ctx) => {
    const template = Handlebars.compile(src, { noEscape: true });
    return template(ctx);
};
exports.tmplFromFile = (srcPath, ctx) => {
    const template = readTemplate(srcPath);
    return template(ctx);
};
//# sourceMappingURL=tmpl.js.map