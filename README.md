# shell-async

Provides cross-platform async/await (or promise) based shell commands.

# Status: Pre-Alpha

API will change

## Install

``npm install richardprior/shell-async``

## Commands

### cp

```js
// Copy file or files to dest
await cp(source, dest);
// Copy file or files to dest excluding jpg/gif and ignoring any errors
await cp(source, dest, {
	filters: ['!*.jpg', '!*.gif'],
	ignoreError: true
});
// Recursively copy files, replacing any existing, ignore all jpg and gifs in root folder
await cp('rf', source, dest, {
	filters: ['!**/*.jpg', '!*.gif']
});
// Recursively copy files using a glob as the source
await cp('rf', '/glob/**', dest);
```

### mkdir

```js
// Create a folder
await mkdir(dest);
// Create a folder with different permissions, ignoring errors
await mkdir(dest, {
	mode: 0o666,
	ignoreError: true
});
// Create a folder and any missing parent folders
await mkdir('p', dest);
```

### rm

```js
// Remove a file
await rm(dest);
// Remove a file, ignoring errors
await rm(dest, { ignoreError: true });
// Recursively remove files
await rm('r', dest);
```

### exec

```js
// Run a command
await exec(cmd);
// Run a command with arguments
await exec(cmd, [arg1, arg2]);
// Run a command ignoring erors
await exec(cmd, [arg1, arg2], { ignoreError: true });
// Run a command with a different working directory
await exec(cmd, [arg1, arg2], { cwd: somePath });
// Run a command, setting the environment
await exec(cmd, [arg1, arg2], { env: { 'NODE_ENV': 'dev' } });
// Run a command, accepting different exit codes as success
await exec(cmd, [arg1, arg2], { exitCode: [0, 1] });
// Run a command using shell
await exec(cmd, [arg1, arg2], { shell: true });
```

### cd

```js
// Change the working directory
await cd(dest);
```

### downloadFile

```js
// Download a file via HTTP
await downloadFile('http://...', destPath);
// Download a file via HTTPS
await downloadFile('https://...', destPath);
```

### test

```js
// Test exists
await test('e', dest);
// Test for directory
await test('d', dest);
// Test for file
await test('f', dest);
```

### mv

```js
/// Move a file/folder
await mv(source, dest);
```

# License: 3-Clause BSD