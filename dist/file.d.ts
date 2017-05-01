/// <reference types="bluebird" />
import * as Bluebird from 'bluebird';
export declare const readTextFile: (filename: string) => Bluebird<string>;
export declare const writeTextFile: (filename: string, data: string) => Bluebird<void>;
