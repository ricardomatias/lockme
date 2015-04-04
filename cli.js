#!/usr/bin/env node

var getStdin = require('get-stdin');
var meow = require('meow');
var Lockme = require('./');
var chalk = require('chalk');

var lm = new Lockme();

var cli = meow({
    help: [
        'Usage',
        '  $ lockme <file>',
        '',
        'Example',
        '  $ lockme account.txt',
        '  $ Write the secret you want to encrypt with:',
        '  $ > *****',
        '  $ Please confirm the secret',
        '  $ > *****',
        '  $ File locked!',
    ].join('\n')
});

if (process.stdin.isTTY) {
    if (!cli.input[0]) {
        return cli.showHelp();
    }

    if(typeof cli.input[0] !== 'string') {
        return console.log(chalk.yellow('The filename must be a string!'));
    }

    lm._readFile(cli.input[0]);
} else {
    getStdin(lm.readFile);
}
