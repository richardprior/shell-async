/// <reference types="bluebird" />
import * as Bluebird from 'bluebird';
export declare const readCsv: (filename: string, hasHeader: boolean) => Bluebird<string[][]>;
