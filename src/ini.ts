import * as Bluebird from 'bluebird';
import * as ini from 'ini';
import * as fs from 'fs';

export const readIni = (filename: string) => {
	return new Bluebird<any>((resolve, reject) => {
		fs.readFile(filename, 'utf8', (err, data) => {
			if (err) return reject(err);
			try {
				resolve(ini.parse(data));
			} catch (err) {
				reject(err);
			}
		});
	});
};
