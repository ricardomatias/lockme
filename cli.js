#!/usr/bin/env node

var meow = require('meow');
var Lockme = require('./index');
var chalk = require('chalk');
var fs = require('fs');

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
  if (cli.input.length === 0) {
    return cli.showHelp();
  }

  if (typeof cli.input[0] !== 'string') {
    return console.log(chalk.yellow('The filename must be a string!'));
  }

  exec(cli.input[0], function(err, message) {
    if (err) {
      console.error(chalk.red('Internal Error'));
      return process.exit(1);
    }

    console.log(chalk.green(message));
    process.exit(0);
  });
}


function exec(filename, done) {
  var lm = new Lockme();

  fs.readFile(filename, { encoding: 'utf8' }, function(err, text) {
    // If file doesn't exist
    if(err && err.code === 'ENOENT') {
      console.error(chalk.yellow('Couldn\'t find ' + chalk.bold(filename) + '!'));
      return process.exit(1);
    }

    // If it's another kind of error
    if (err) {
      console.error(chalk.red('Internal Error'));
      return process.exit(1);
    }

    if (lm.isEncrypted(text)) {
      lm.promptDecryption('What\'s the secret ?', text, function (err, password, decryptedText) {
        if (err) {
          console.error(err);
          return process.exit(1);
        }
        var message = 'File unlocked!';

        return lm.writeFile(filename, message, decryptedText, done);
      });
    } else {
      lm.promptEncryption('Write the secret you want to encrypt with:', text, function (err, password) {
        if (err) {
          console.error(err);
        }

        lm.encrypt(password, text, function (err, encryptedText) {
          var message = 'File locked!';

          if (err) {
            console.error(chalk.red('Internal Error'));
            return process.exit(1);
          }

          return lm.writeFile(filename, message, encryptedText, done);
        });
      });
    }
  });
}
