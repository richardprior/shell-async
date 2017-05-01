import * as Bluebird from 'bluebird';
import * as fs from 'fs';

export const readTextFile = (filename: string) => {
	return new Bluebird<string>((resolve, reject) => {
		fs.readFile(filename, 'utf8', (err, data) => {
			if (err) return reject(err);
			try {
				resolve(data);
			} catch (err) {
				reject(err);
			}
		});
	});
};

export const writeTextFile = (filename: string, data: string) => {
	return new Bluebird<void>((resolve, reject) => {
		fs.writeFile(filename, data, 'utf8', (err) => {
			if (err) return reject(err);
			resolve();
		});
	});
}
