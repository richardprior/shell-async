/// <reference types="bluebird" />
import * as Bluebird from 'bluebird';
export interface ICopyOpts {
    filters?: Array<string | RegExp>;
    ignoreError?: boolean;
}
export declare const cp: {
    (source: string, dest: string): Promise<void>;
    (source: string, dest: string, opts: ICopyOpts): Promise<void>;
    (modifiers: string, source: string, dest: string): Promise<void>;
    (modifiers: string, source: string, dest: string, opts: ICopyOpts): Promise<void>;
};
export interface IMkdirOpts {
    ignoreError?: boolean;
    mode?: number;
}
export declare const mkdir: {
    (dest: string): Promise<void>;
    (dest: string, opts: IMkdirOpts): Promise<void>;
    (modifiers: string, dest: string): Promise<void>;
    (modifiers: string, dest: string, opts: IMkdirOpts): Promise<void>;
};
export interface IRmOpts {
    ignoreError?: boolean;
}
export declare const rm: {
    (dest: string): Promise<void>;
    (dest: string, opts: IRmOpts): Promise<void>;
    (modifiers: string, dest: string): Promise<void>;
    (modifiers: string, dest: string, opts: IRmOpts): Promise<void>;
};
export interface IExecOpts {
    ignoreError?: boolean;
    cwd?: string;
    env?: any;
    exitCodes?: number[];
    shell?: boolean;
    silent?: boolean;
}
export interface IExecReturn {
    code: number;
    stdout: string;
    stderr: string;
}
export declare const exec: (cmd: string, args?: string[], opts?: IExecOpts) => Bluebird<IExecReturn>;
export declare const cd: (dir: string) => Promise<void>;
export declare const sed: (pattern: RegExp, replacement: string, filename: string) => Promise<void>;
export declare const cat: (filename: string) => Promise<string>;
export declare const downloadFile: (uri: string, filename: string) => Promise<{}>;
export declare const test: (modifierStr: string, filename: string) => Promise<boolean>;
export declare const mv: (source: string, dest: string) => Promise<void>;
