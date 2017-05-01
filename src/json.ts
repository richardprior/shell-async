import * as Bluebird from 'bluebird';
import * as fs from 'fs';

export const readJson = (filename: string) => {
	return new Bluebird<any>((resolve, reject) => {
		fs.readFile(filename, 'utf8', (err, data) => {
			if (err) return reject(err);
			try {
				// Replace UTF-8 BOM, if exists
				data = data.replace(/^\uFEFF/, '');
				resolve(JSON.parse(data));
			} catch (err) {
				reject(err);
			}
		});
	});
};

export const writeJson = (filename: string, data: any) => {
	return new Bluebird<void>((resolve, reject) => {
		let outputStr;
		try {
			outputStr = JSON.stringify(data, null, 2);
		} catch (err) {
			return reject(err);
		}

		fs.writeFile(filename, outputStr, 'utf8', (err) => {
			if (err) return reject(err);
			resolve();
		});
	});
};
