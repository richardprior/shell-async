import * as Bluebird from 'bluebird';
import * as csv from 'csvtojson';

export const readCsv = (filename: string, hasHeader: boolean) => {
	return new Bluebird<string[][]>((resolve, reject) => {
		let rows: string[][] = [];
		csv({ noheader: !hasHeader })
			.fromFile(filename)
			.on("csv", function(row: string[]){
				rows.push(row);
			})
			.on("end", function(){
				resolve(rows);
			});
	});
};
