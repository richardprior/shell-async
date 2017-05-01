/// <reference types="bluebird" />
import * as Bluebird from 'bluebird';
export declare const readYaml: (filename: string) => Bluebird<any>;
export declare const writeYaml: (filename: string, data: any) => Bluebird<void>;
export declare const readYamlString: (data: string) => any;
