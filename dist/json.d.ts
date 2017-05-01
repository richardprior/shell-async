/// <reference types="bluebird" />
import * as Bluebird from 'bluebird';
export declare const readJson: (filename: string) => Bluebird<any>;
export declare const writeJson: (filename: string, data: any) => Bluebird<void>;
