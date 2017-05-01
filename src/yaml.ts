import * as Bluebird from 'bluebird';
import * as yaml from 'js-yaml';
import * as fs from 'fs';

export const readYaml = (filename: string) => {
	return new Bluebird<any>((resolve, reject) => {
		fs.readFile(filename, 'utf8', (err, data) => {
			if (err) return reject(err);
			try {
				resolve(yaml.safeLoad(data));
			} catch (err) {
				reject(err);
			}
		});
	});
};

export const writeYaml = (filename: string, data: any) => {
	return new Bluebird<void>((resolve, reject) => {
		let outputStr;
		try {
			outputStr = yaml.safeDump(data, { sortKeys: true, noRefs: true })
		} catch (err) {
			return reject(err);
		}

		fs.writeFile(filename, outputStr, 'utf8', (err) => {
			if (err) return reject(err);
			resolve();
		});
	});
};

export const readYamlString = (data: string) => {
	return yaml.safeLoad(data);
};