'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const _mkdirp = require("mkdirp");
const _rimraf = require("rimraf");
const child_process = require("child_process");
const http = require("http");
const https = require("https");
const globBase = require('glob-base');
const globby = require('globby');
Promise = require('bluebird');
const _lstat = Promise.promisify(fs.lstat);
const lstat = (filename) => __awaiter(this, void 0, void 0, function* () {
    try {
        return yield _lstat(filename);
    }
    catch (err) {
        return null;
    }
});
const mkdirp = Promise.promisify(_mkdirp);
const _mkdir = Promise.promisify(fs.mkdir);
const rimraf = Promise.promisify(_rimraf);
const unlink = Promise.promisify(fs.unlink);
const spawn = child_process.spawn;
const readFile = Promise.promisify(fs.readFile);
const writeFile = Promise.promisify(fs.writeFile);
const rename = Promise.promisify(fs.rename);
const _copyFile = (source, dest) => {
    return new Promise((resolve, reject) => {
        let cbCalled = false;
        const done = (err) => {
            if (!cbCalled) {
                cbCalled = true;
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            }
        };
        var rd = fs.createReadStream(source);
        rd.on("error", done);
        var wr = fs.createWriteStream(dest);
        wr.on("error", done);
        wr.on("close", done);
        rd.pipe(wr);
    });
};
const copyFile = (source, dest, overwrite) => __awaiter(this, void 0, void 0, function* () {
    let dstStat = yield lstat(dest);
    if (dstStat) {
        if (dstStat.isDirectory()) {
            // Write into directory
            dest = path.join(dest, path.basename(source));
            dstStat = yield lstat(dest);
            if (dstStat) {
                if (dstStat.isDirectory()) {
                    throw new Error(`cp: cannot overwrite directory with file: ${dest}`);
                }
            }
        }
        if (dstStat && !overwrite) {
            throw new Error(`cp: file already exists: ${dest}`);
        }
    }
    yield _copyFile(source, dest);
});
const defaultCopyOpts = { filters: null, ignoreError: false };
const parseModifiers = (modifiers, dict, defaults = {}) => {
    let ret = Object.assign({}, defaults);
    modifiers = modifiers.replace(/-/g, '').replace(/ /g, '');
    for (let i = 0; i < modifiers.length; i++) {
        const c = modifiers[i];
        const name = dict[c];
        if (!name) {
            throw new Error(`invalid modifier: ${c}`);
        }
        ret[name] = true;
    }
    return ret;
};
const handleErr = (err, ignoreError) => {
    if (ignoreError) {
        console.error(err.message || err);
    }
    else {
        throw new Error(err.message || err);
    }
};
// BUG: Globs break if the path has brackets in it i.e. "C:\Program Files (x86)"
exports.cp = (a, b, c, d) => __awaiter(this, void 0, void 0, function* () {
    let modifierStr = '';
    let source = '';
    let dest = '';
    let opts = {};
    if ((!c && !d) || (typeof c !== 'string')) {
        source = a;
        dest = b;
        opts = c || {};
    }
    else {
        modifierStr = a;
        source = b;
        dest = c;
        opts = d || {};
    }
    opts = Object.assign({}, defaultCopyOpts, opts);
    const modifiers = parseModifiers(modifierStr, {
        'r': 'recursive',
        'f': 'force',
    }, {
        recursive: false,
        force: false,
    });
    let files;
    let glob = globBase(source);
    if (glob.isGlob) {
        if (process.platform === 'win32' && glob.glob[0] === '\\') {
            glob.glob = glob.glob.substr(1);
        }
        let patterns = [glob.glob];
        if (opts.filters) {
            patterns = patterns.concat(opts.filters);
        }
        files = yield globby(patterns, {
            cwd: glob.base,
        });
    }
    else {
        const srcStat = yield lstat(source);
        if (!srcStat) {
            handleErr(`cp: file not found: ${source}`, opts.ignoreError);
            return;
        }
        if (srcStat.isFile()) {
            try {
                console.log(`cp: ${source} => ${dest}`);
                yield copyFile(source, dest, modifiers.force);
            }
            catch (err) {
                handleErr(err, opts.ignoreError);
            }
            return;
        }
        if (!modifiers.recursive) {
            handleErr(`cp: omitting directory: ${source}`, opts.ignoreError);
            return;
        }
        glob = { base: source, isGlob: true, glob: '**' };
        let patterns = [glob.glob];
        if (opts.filters) {
            patterns = patterns.concat(opts.filters);
        }
        files = yield globby(patterns, {
            cwd: glob.base,
        });
        let dstStat = yield lstat(dest);
        if (dstStat) {
            if (!dstStat.isDirectory()) {
                handleErr(`cp: destination not a directory: ${dest}`, opts.ignoreError);
                return;
            }
            // Folder exists, create sub-folder
            dest = path.join(dest, path.basename(source));
            // Check sub-folder is not a file
            dstStat = yield lstat(dest);
            if (dstStat && !dstStat.isDirectory()) {
                handleErr(`cp: destination not a directory: ${dest}`, opts.ignoreError);
                return;
            }
        }
    }
    source = glob.base;
    console.log(`cp: ${source} => ${dest}`);
    try {
        yield mkdirp(dest);
    }
    catch (err) {
        handleErr(`cp: error creating directory: ${dest}`, opts.ignoreError);
        return;
    }
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const srcPath = path.join(source, file);
        const dstPath = path.join(dest, file);
        const srcStat = yield lstat(srcPath);
        if (srcStat.isDirectory()) {
            try {
                yield mkdirp(dstPath);
            }
            catch (err) {
                handleErr(`cp: error creating directory: ${dstPath}`, opts.ignoreError);
                continue;
            }
        }
        else {
            try {
                console.log(`cp:    ${file}`);
                yield copyFile(srcPath, dstPath, modifiers.force);
            }
            catch (err) {
                handleErr(err, opts.ignoreError);
                continue;
            }
        }
    }
});
const defaultMkdirOpts = { ignoreError: false, mode: parseInt('0777', 8) };
exports.mkdir = (a, b, c) => __awaiter(this, void 0, void 0, function* () {
    let modifierStr = '';
    let dest = '';
    let opts = {};
    if (c && (typeof b === 'string')) {
        modifierStr = a;
        dest = b;
        opts = c;
    }
    else if (typeof b === 'string') {
        modifierStr = a;
        dest = b;
    }
    else {
        dest = a;
        opts = b || {};
    }
    opts = Object.assign({}, defaultMkdirOpts, opts);
    const modifiers = parseModifiers(modifierStr, {
        'p': 'parents',
    }, {
        parents: false,
    });
    console.log(`mkdir: ${dest}`);
    if (modifiers.parents) {
        try {
            yield mkdirp(dest, { mode: opts.mode });
        }
        catch (err) {
            handleErr(`Directory could not be created\n\tPath: ${dest}`, opts.ignoreError);
            return;
        }
    }
    else {
        try {
            yield _mkdir(dest, { mode: opts.mode });
        }
        catch (err) {
            handleErr(`Directory could not be created\n\tPath: ${dest}`, opts.ignoreError);
            return;
        }
    }
});
const defaultRmOpts = { ignoreError: false };
exports.rm = (a, b, c) => __awaiter(this, void 0, void 0, function* () {
    let modifierStr = '';
    let dest = '';
    let opts = {};
    if (c && (typeof b === 'string')) {
        modifierStr = a;
        dest = b;
        opts = c;
    }
    else if (typeof b === 'string') {
        modifierStr = a;
        dest = b;
    }
    else {
        dest = a;
        opts = b || {};
    }
    opts = Object.assign({}, defaultRmOpts, opts);
    const modifiers = parseModifiers(modifierStr, {
        'r': 'recursive',
        'f': 'force',
    }, {
        recursive: false,
    });
    console.log(`rm: ${dest}`);
    try {
        if (modifiers.recursive) {
            yield rimraf(dest, { glob: false });
        }
        else {
            yield unlink(dest);
        }
    }
    catch (err) {
        handleErr(`Error removing file/directory: ${dest} (${err.message})`, opts.ignoreError);
    }
});
const defaultExecOpts = { ignoreError: false, exitCodes: [0], shell: true, silent: false };
exports.exec = (cmd, args = [], opts = {}) => {
    let stdout = '';
    let stderr = '';
    return new Promise((resolve, reject) => {
        opts = Object.assign({}, defaultExecOpts, opts);
        opts.exitCodes = opts.exitCodes || [];
        console.log(`exec: command: ${cmd}, args: ${args.join(' ')}`);
        const p = spawn(cmd, args, {
            cwd: opts.cwd || process.cwd(),
            env: opts.env || process.env,
            shell: opts.shell,
        });
        p.stdout.on('data', (data) => {
            stdout += data.toString();
            if (!opts.silent) {
                process.stdout.write(data);
            }
        });
        p.stderr.on('data', (data) => {
            stderr += data.toString();
            if (!opts.silent) {
                process.stderr.write(data);
            }
        });
        p.on('error', (err) => {
            const msg = `exec: failed to launch command: ${cmd} (${err.message})`;
            if (opts.ignoreError) {
                console.error(msg);
                resolve({
                    code: 255,
                    stdout,
                    stderr,
                });
            }
            else {
                reject(new Error(msg));
            }
        });
        p.on('close', (code) => {
            if (opts.exitCodes.indexOf(code) === -1) {
                const msg = `exec: unexpected exit code: ${code}`;
                if (opts.ignoreError) {
                    console.error(msg);
                    resolve({
                        code,
                        stdout,
                        stderr,
                    });
                }
                else {
                    let err = new Error(msg);
                    err.code = code;
                    reject(err);
                }
            }
            else {
                resolve({
                    code,
                    stdout,
                    stderr,
                });
            }
        });
    });
};
exports.cd = (dir) => __awaiter(this, void 0, void 0, function* () {
    process.chdir(dir);
});
exports.sed = (pattern, replacement, filename) => __awaiter(this, void 0, void 0, function* () {
    console.log(`sed: ${filename} [ ${pattern} => ${replacement} ]`);
    const contents = yield readFile(filename, { encoding: 'utf8' });
    const lines = contents.split(/\r*\n/);
    const result = lines.map((line) => line.replace(pattern, replacement)).join('\n');
    yield writeFile(filename, result, { encdoding: 'utf8' });
});
exports.cat = (filename) => __awaiter(this, void 0, void 0, function* () {
    console.log(`cat: ${filename}`);
    const contents = yield readFile(filename, { encoding: 'utf8' });
    return contents;
});
exports.downloadFile = (uri, filename) => __awaiter(this, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        const done = (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        };
        const file = fs.createWriteStream(filename);
        file.on('error', (err) => {
            // Delete the target file
            fs.unlink(filename);
            done(err);
        });
        let requestor;
        if (uri.startsWith('https')) {
            requestor = https;
        }
        else {
            requestor = http;
        }
        const request = requestor.get(uri, (res) => {
            // Check if response is success
            if (res.statusCode !== 200) {
                done(new Error(`Invalid response code: ${res.statusCode}`));
                return;
            }
            res.pipe(file);
            file.on('finish', function () {
                file.close();
                done();
            });
        });
        request.on('error', (err) => {
            // Delete the target file
            fs.unlink(filename);
            done(err);
        });
    });
});
exports.test = (modifierStr, filename) => __awaiter(this, void 0, void 0, function* () {
    const modifiers = parseModifiers(modifierStr, {
        'e': 'exists',
        'd': 'directory',
        'f': 'file',
    });
    console.log(`test: ${modifierStr} ${filename}`);
    const stat = yield lstat(filename);
    if (modifiers.exists) {
        console.log(`test:     exists = ${stat !== null}`);
        return stat !== null;
    }
    if (modifiers.directory) {
        console.log(`test:     directory = ${stat !== null && stat.isDirectory()}`);
        return stat !== null && stat.isDirectory();
    }
    if (modifiers.file) {
        console.log(`test:     file = ${stat !== null && stat.isFile()}`);
        return stat !== null && stat.isFile();
    }
    return false;
});
//TODO: modifiers: -f = force
exports.mv = (source, dest) => __awaiter(this, void 0, void 0, function* () {
    console.log(`mv: ${source} => ${dest}`);
    try {
        yield rename(source, dest);
    }
    catch (err) {
        // Different partitions, try copy/delete
        if (err.code === 'EXDEV') {
            yield exports.cp('r', source, dest);
            yield exports.rm('rf', source);
        }
    }
});
//# sourceMappingURL=shell.js.map