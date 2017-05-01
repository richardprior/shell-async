import * as Handlebars from 'handlebars';
import * as Bluebird from 'bluebird';
import * as fs from 'fs';

const readTemplate = (filename: string) => {
	const src = fs.readFileSync(filename, 'utf8')
	return Handlebars.compile(src, { noEscape: true });
};

export const tmpl = (src: string, ctx: any) => {
	const template = Handlebars.compile(src, { noEscape: true });
	return template(ctx);
};

export const tmplFromFile = (srcPath: string, ctx: any) => {
	const template = readTemplate(srcPath);
	return template(ctx);
};
