"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commandLineArgs = require('command-line-args');
const commandLineCommands = require('command-line-commands');
const columnify = require('columnify');
exports.displayUsage = (cmd, includeArgs) => {
    const titleOutput = columnify([{ name: cmd.name, description: cmd.description }], {
        showHeaders: false,
        minWidth: 5,
        config: {
            description: { maxWidth: 60 }
        },
    });
    console.log(titleOutput);
    if (includeArgs && cmd.args && cmd.args.length) {
        console.log();
        let args = [];
        for (let a of cmd.args) {
            if (a.name === 'help')
                continue;
            args.push([`--${a.name}`, `-${a.alias}`, a.description]);
        }
        const argOutput = columnify(args, {
            showHeaders: false,
            minWidth: 5,
        });
        console.log(argOutput.replace(/^/gm, '  '));
    }
    console.log();
};
exports.createCliHandler = (cmd) => {
    let fn = (argv) => {
        const opts = commandLineArgs(cmd.args, { argv });
        if (opts.help) {
            exports.displayUsage(cmd, true);
            process.exit(1);
        }
        for (let a of cmd.args) {
            if (a.required && (!opts[a.name] || (a.multiple && !opts[a.name].length))) {
                console.log(`ERROR: Missing required argument '${a.name}'`);
                exports.displayUsage(cmd, true);
                process.exit(1);
            }
            if (a.list && opts[a.name] && (!a.multiple || opts[a.name].length)) {
                if (a.multiple) {
                    for (let item of opts[a.name]) {
                        if (!a.list.includes(item)) {
                            console.log(`ERROR: Invalid argument '${a.name}', '${item}' should be one of: ${a.list.join(', ')}`);
                            exports.displayUsage(cmd, true);
                            process.exit(1);
                        }
                    }
                }
                else {
                    if (!a.list.includes(opts[a.name])) {
                        console.log(`ERROR: Invalid argument '${a.name}', '${opts[a.name]}' should be one of: ${a.list.join(', ')}`);
                        exports.displayUsage(cmd, true);
                        process.exit(1);
                    }
                }
            }
        }
        return cmd.handler(opts);
    };
    fn.cmd = cmd;
    return fn;
};
exports.runProgram = (cmdName, commands) => {
    var cli = null;
    try {
        cli = commandLineCommands(Object.keys(commands).concat(null));
    }
    catch (err) {
    }
    if (cli === null || cli.command === null) {
        // Display usage
        console.log('Usage:');
        console.log();
        console.log(`  ${cmdName} <command> [...args]`);
        console.log();
        console.log('Commands:');
        console.log();
        let cmds = [];
        for (let k of Object.keys(commands)) {
            cmds.push({ name: commands[k].cmd.name, description: commands[k].cmd.description });
        }
        const titleOutput = columnify(cmds, {
            showHeaders: false,
            minWidth: 5,
            config: {
                description: { maxWidth: 60 }
            },
        });
        console.log(titleOutput.replace(/^/gm, '  '));
        console.log();
        console.log('Global Options:');
        console.log();
        console.log('  --help  -h    Display more help about a command');
        console.log();
        process.exit(1);
    }
    const { command, argv } = cli;
    commands[command](argv)
        .catch((err) => {
        console.log('Error running command: ', err);
        if (process.env.NODE_ENV === 'development') {
            console.log('Stack Trace:');
            console.log(err.stack);
        }
        process.exit(1);
    });
};
//# sourceMappingURL=cli.js.map