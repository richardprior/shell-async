'use strict';

import * as path from 'path';
import * as fs from 'fs';
import * as _mkdirp from 'mkdirp';
import * as Bluebird from 'bluebird';
import * as _rimraf from 'rimraf';
import * as child_process from 'child_process';
import * as http from 'http';
import * as https from 'https';

const globBase = require('glob-base');
const globby = require('globby');

Promise = require('bluebird');

const _lstat = Promise.promisify(fs.lstat);
const lstat = async (filename: string) => {
	try {
		return await _lstat(filename);
	} catch (err) {
		return null;
	}
};
const mkdirp:(dirname: string | Buffer, opts?: any)=>Bluebird<{}> = Promise.promisify(_mkdirp);
const _mkdir:(dirname: string | Buffer, opts?: any)=>Bluebird<{}> = Promise.promisify(fs.mkdir);
const rimraf:(dirname: string, opts?: any)=>Bluebird<{}> = Promise.promisify(_rimraf);
const unlink = Promise.promisify(fs.unlink);
const spawn = child_process.spawn;
const readFile:(filename: string, opts?: any)=>Bluebird<Buffer | string> = Promise.promisify(fs.readFile);
const writeFile:(filename: string, data: string | Buffer, opts?: any)=>Bluebird<{}> = Promise.promisify(fs.writeFile);
const rename = Promise.promisify(fs.rename);

const _copyFile = (source: string, dest: string) => {
	return new Promise((resolve, reject) => {
		let cbCalled = false;
		const done = (err?: Error) => {
			if (!cbCalled) {
				cbCalled = true;
				if (err) {
					reject(err);
				} else {
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

const copyFile = async (source: string, dest: string, overwrite?: boolean) => {
	let dstStat = await lstat(dest);
	if (dstStat) {
		if (dstStat.isDirectory()) {
			// Write into directory
			dest = path.join(dest, path.basename(source));
			dstStat = await lstat(dest);
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

	await _copyFile(source, dest);
};

export interface ICopyOpts {
	filters?: Array<string | RegExp>;
	ignoreError?: boolean;
}

const defaultCopyOpts: ICopyOpts = { filters: null, ignoreError: false };

const parseModifiers = (modifiers: string, dict: any, defaults: any = {}) => {
	let ret: any = { ...defaults };
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

const handleErr = (err: any, ignoreError: boolean) => {
	if (ignoreError) {
		console.error(err.message || err);
	} else {
		throw new Error(err.message || err);
	}
};

// BUG: Globs break if the path has brackets in it i.e. "C:\Program Files (x86)"
export const cp: {
	(source: string, dest: string): Promise<void>;
	(source: string, dest: string, opts: ICopyOpts): Promise<void>;
	(modifiers: string, source: string, dest: string): Promise<void>;
	(modifiers: string, source: string, dest: string, opts: ICopyOpts): Promise<void>;
} = async (a: string, b: string, c?: string | ICopyOpts, d?: ICopyOpts) => {
	let modifierStr = '';
	let source = '';
	let dest = '';
	let opts: ICopyOpts = {};

	if ((!c && !d) || (typeof c !== 'string')) {
		source = a;
		dest = b;
		opts = c || {};
	} else {
		modifierStr = a;
		source = b;
		dest = c;
		opts = d || {};
	}
	opts = { ...defaultCopyOpts, ...opts };


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
		let patterns = [ glob.glob ];
		if (opts.filters) {
			patterns = patterns.concat(opts.filters);
		}
		files = await globby(patterns, {
			cwd: glob.base,
		});
	} else {
		const srcStat = await lstat(source);
		if (!srcStat) {
			handleErr(`cp: file not found: ${source}`, opts.ignoreError);
			return;
		}
		if (srcStat.isFile()) {
			try {
				console.log(`cp: ${source} => ${dest}`);
				await copyFile(source, dest, modifiers.force);
			} catch (err) {
				handleErr(err, opts.ignoreError);
			}
			return;
		}

		if (!modifiers.recursive) {
			handleErr(`cp: omitting directory: ${source}`, opts.ignoreError);
			return;
		}

		glob = { base: source, isGlob: true, glob: '**' };
		let patterns = [ glob.glob ];
		if (opts.filters) {
			patterns = patterns.concat(opts.filters);
		}
		files = await globby(patterns, {
			cwd: glob.base,
		});
		let dstStat = await lstat(dest);
		if (dstStat) {
			if (!dstStat.isDirectory()) {
				handleErr(`cp: destination not a directory: ${dest}`, opts.ignoreError);
				return;
			}
			// Folder exists, create sub-folder
			dest = path.join(dest, path.basename(source));
			// Check sub-folder is not a file
			dstStat = await lstat(dest);
			if (dstStat && !dstStat.isDirectory()) {
				handleErr(`cp: destination not a directory: ${dest}`, opts.ignoreError);
				return;
			}
		}
	}

	source = glob.base;

	console.log(`cp: ${source} => ${dest}`);

	try {
		await mkdirp(dest);
	} catch (err) {
		handleErr(`cp: error creating directory: ${dest}`, opts.ignoreError);
		return;
	}

	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const srcPath = path.join(source, file);
		const dstPath = path.join(dest, file);

		const srcStat = await lstat(srcPath);
		if (srcStat.isDirectory()) {
			try {
				await mkdirp(dstPath);
			} catch (err) {
				handleErr(`cp: error creating directory: ${dstPath}`, opts.ignoreError);
				continue;
			}
		} else {
			try {
				console.log(`cp:    ${file}`);
				await copyFile(srcPath, dstPath, modifiers.force);
			} catch (err) {
				handleErr(err, opts.ignoreError);
				continue;
			}
		}
	}
};

export interface IMkdirOpts {
	ignoreError?: boolean;
	mode?: number;
}

const defaultMkdirOpts = { ignoreError: false, mode: parseInt('0777', 8) };

export const mkdir: {
	(dest: string): Promise<void>;
	(dest: string, opts: IMkdirOpts): Promise<void>;
	(modifiers: string, dest: string): Promise<void>;
	(modifiers: string, dest: string, opts: IMkdirOpts): Promise<void>;
} = async (a: string, b?: string | IMkdirOpts, c?: IMkdirOpts) => {
	let modifierStr = '';
	let dest = '';
	let opts: IMkdirOpts = {};
	if (c && (typeof b === 'string')) {
		modifierStr = a;
		dest = b;
		opts = c;
	} else if (typeof b === 'string') {
		modifierStr = a;
		dest = b;
	} else {
		dest = a;
		opts = b || {};
	}

	opts = { ...defaultMkdirOpts, ...opts };

	const modifiers = parseModifiers(modifierStr, {
		'p': 'parents',
	}, {
		parents: false,
	});

	console.log(`mkdir: ${dest}`);

	if (modifiers.parents) {
		try {
			await mkdirp(dest, { mode: opts.mode });
		} catch (err) {
			handleErr(`Directory could not be created\n\tPath: ${dest}`, opts.ignoreError);
			return;
		}
	} else {
		try {
			await _mkdir(dest, { mode: opts.mode });
		} catch (err) {
			handleErr(`Directory could not be created\n\tPath: ${dest}`, opts.ignoreError);
			return;
		}
	}
};

export interface IRmOpts {
	ignoreError?: boolean;
}

const defaultRmOpts: IRmOpts = { ignoreError: false };

export const rm: {
	(dest: string): Promise<void>;
	(dest: string, opts: IRmOpts): Promise<void>;
	(modifiers: string, dest: string): Promise<void>;
	(modifiers: string, dest: string, opts: IRmOpts): Promise<void>;
} = async (a: string, b?: string | IRmOpts, c?: IRmOpts) => {
	let modifierStr = '';
	let dest = '';
	let opts: IRmOpts = {};
	if (c && (typeof b === 'string')) {
		modifierStr = a;
		dest = b;
		opts = c;
	} else if (typeof b === 'string') {
		modifierStr = a;
		dest = b;
	} else {
		dest = a;
		opts = b || {};
	}

	opts = { ...defaultRmOpts, ...opts };

	const modifiers = parseModifiers(modifierStr, {
		'r': 'recursive',
		'f': 'force', // not used
	}, {
		recursive: false,
	});

	console.log(`rm: ${dest}`);

	try {
		if (modifiers.recursive) {
			await rimraf(dest, { glob: false });
		} else {
			await unlink(dest);
		}
	} catch (err) {
		handleErr(`Error removing file/directory: ${dest} (${err.message})`, opts.ignoreError);
	}
};

export interface IExecOpts {
	ignoreError?: boolean;
	cwd?: string;
	env?: any;
	exitCodes?: number[];
	shell?: boolean;
}

const defaultExecOpts: IExecOpts = { ignoreError: false, exitCodes: [0], shell: true };

export const exec = (cmd: string, args: string[] = [], opts: IExecOpts = {}) => {
	return new Promise((resolve, reject) => {
		opts = { ...defaultExecOpts, ...opts };
		opts.exitCodes = opts.exitCodes || [];

		console.log(`exec: command: ${cmd}, args: ${args.join(' ')}`);

		const p = spawn(cmd, args, {
			cwd: opts.cwd || process.cwd(),
			env: opts.env || process.env,
			shell: opts.shell,
		});

		p.stdout.on('data', (data) => {
			process.stdout.write(data);
		});

		p.stderr.on('data', (data) => {
			process.stderr.write(data);
		});

		p.on('error', (err) => {
			const msg = `exec: failed to launch command: ${cmd} (${err.message})`;
			if (opts.ignoreError) {
				console.error(msg)
				resolve(255);
			} else {
				reject(new Error(msg));
			}
		});

		p.on('close', (code) => {
			if (opts.exitCodes.indexOf(code) === -1) {
				const msg = `exec: unexpected exit code: ${code}`;
				if (opts.ignoreError) {
					console.error(msg)
					resolve(code);
				} else {
					let err: any = new Error(msg);
					err.code = code;
					reject(err);
				}
			} else {
				resolve(code);
			}
		});
	});
};

export const cd = async (dir: string) => {
	process.chdir(dir);
};

export const sed = async (pattern: RegExp, replacement: string, filename: string) => {
	console.log(`sed: ${filename} [ ${pattern} => ${replacement} ]`);

	const contents = await readFile(filename, { encoding: 'utf8' }) as string;
	const lines = contents.split(/\r*\n/);
	const result = lines.map((line) => line.replace(pattern, replacement)).join('\n');

	await writeFile(filename, result, { encdoding: 'utf8' });
};

export const cat = async (filename: string) => {
	console.log(`cat: ${filename}`);

	const contents = await readFile(filename, { encoding: 'utf8' }) as string;
	return contents;
}

export const downloadFile = async (uri: string, filename: string) => {
	return new Promise((resolve, reject) => {
		const done = (err?: Error) => {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		};

		const file = fs.createWriteStream(filename);
		file.on('error', (err: Error) => {
			// Delete the target file
			fs.unlink(filename);
			done(err);
		});

		let requestor: any;
		if (uri.startsWith('https')) {
			requestor = https;
		} else {
			requestor = http;
		}

		const request = requestor.get(uri, (res: any) => {
			// Check if response is success
			if (res.statusCode !== 200) {
				done(new Error(`Invalid response code: ${res.statusCode}`));
				return;
			}

			res.pipe(file);

			file.on('finish', function() {
				file.close();
				done();
			});
		});

		request.on('error', (err: Error) => {
			// Delete the target file
			fs.unlink(filename);
			done(err);
		});
	});
};

export const test = async (modifierStr: string, filename: string) => {
	const modifiers = parseModifiers(modifierStr, {
		'e': 'exists',
		'd': 'directory',
		'f': 'file',
	});

	console.log(`test: ${modifierStr} ${filename}`);

	const stat = await lstat(filename);

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
}

//TODO: modifiers: -f = force
export const mv = async (source: string, dest: string) => {
	console.log(`mv: ${source} => ${dest}`);

	try {
		await rename(source, dest);
	} catch (err) {
		// Different partitions, try copy/delete
		if (err.code === 'EXDEV') {
			await cp('r', source, dest);
			await rm('rf', source);
		}
	}
};
