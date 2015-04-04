'use strict';

var fs = require('fs');
var crypto = require('crypto');
var path = require('path');
var chalk = require('chalk');
var promptly = require('promptly');

function Lockme() {
    this.token = '\u2603';
    this.encoding = 'hex';
}

Lockme.prototype._readFile = function readFile(filename) {
    var self = this;

    self.filename = filename;

    fs.readFile(self.filename, {
            encoding: 'utf8'
        },
        function(err, data) {
            // If file doesn't exist
            if(err && err.code === 'ENOENT') {
                console.error(chalk.yellow('Couldn\'t find ' + chalk.bold(self.filename) + '!'));
                return process.exit(1);
            }
            // If it's another kind of error
            if (err) {
                console.error(chalk.red('Internal Error'));
                return process.exit(1);
            }

            // grab the file contents
            self.file = data;

            // When file is NOT encrypted
            if (data[0] !== self.token) {
                return self._requestSecret();
            }

            // When file is encrypted
            if (data[0] === self.token) {
                return self._promptSecret();
            }
        });
};

Lockme.prototype._promptMessage = function _promptMessage(message) {
    return [
        chalk.bold.green(message),
        chalk.blue('>')
    ].join('\n');
};

Lockme.prototype._requestSecret = function _requestSecret() {
    this.secret = [];
    // Question prompt

    return this._secretPrompt('Write the secret you want to encrypt with:');
};

Lockme.prototype._secretPrompt = function _secretPrompt(message) {
    var self = this;

    promptly.prompt(self._promptMessage(message), {retry: true, silent: true}, function(err, pw) {
        if(err) {
            return console.log(chalk.yellow('Internal Error'));
        }
        // Store the secret
        self.secret.push(pw);

        if(self.secret.length < 2) {
            return self._secretPrompt('Please confirm the secret');
        }

        // When secret's match, call encrypt
        if(self.secret.length === 2 && self.secret[0] === self.secret[1]) {

            self.encrypt(self.secret[0], self.file, function(err, encryptedText) {
                if(err) {
                    return self._writeFile(err);
                }
                return self._writeFile(null, encryptedText, 'File locked!');
            });

            self.secret = [];
            return;
        }

        console.log(chalk.yellow('The secrets do not match. Please try again!'));
        this.secret = [];

        return this._secretPrompt('Please type the secret');
    }.bind(this));
};

Lockme.prototype._writeFile = function _writeFile(error, text, message) {
    var self = this;

    if (error) {
        console.error(chalk.red('Internal Error'));
        return process.exit(1);
    }

    fs.writeFile(self.filename, text, function(err) {
        if (err) {
            console.error(chalk.red('Internal Error'));
            return process.exit(1);
        }
        console.log(chalk.green(message));
        process.exit(0);
    });
};

Lockme.prototype.encrypt = function encrypt(secret, text, cb) {
    var self = this;

    var cipher = crypto.createCipher('aes256', secret);
    var encryptedText = '';

    cipher.end(new Buffer(text), cipher.read);

    // 'error' Must come before other listeners
    cipher.on('error', function(err) {
        return cb(err);
    });

    cipher.on('data', function(data) {
        encryptedText += data.toString(self.encoding);
    });
    cipher.on('end', function() {
        // to help decipher
        return cb(null, self.token + encryptedText);
    });
};

Lockme.prototype.decrypt = function decrypt(secret, text, cb) {
    var self = this;

    var decryptedText = '';
    var decipher = crypto.createDecipher('aes256', secret);

    // 'error' Must come before other listeners
    decipher.on('error', function(err) {
        return cb(err);
    });

    decipher.end(new Buffer(text.substr(1), self.encoding), decipher.read);

    decipher.on('data', function(data) {
        decryptedText += data.toString();
    });
    decipher.on('end', function() {
        return cb(null, decryptedText);
    });
};

Lockme.prototype._promptSecret = function _promptSecret() {

    promptly.prompt(this._promptMessage('What\'s the secret ?'), {
        silent: true
    }, function(error, secret) {
        return this._testSecret(secret);
    }.bind(this));
};

Lockme.prototype._testSecret = function _testSecret(secret) {
    var self = this;

    self.decrypt(secret, self.file, function(err, decryptedText) {

        if (err && /.+bad decrypt?/g.test(err.message)) {
            console.log(chalk.yellow('Wrong secret!'));
            return self._promptSecret(self.file);
        }

        if (err) {
            console.error(chalk.red('Internal Error'));
            return process.exit(1);
        }

        return self._writeFile(null, decryptedText, 'File unlocked!');
    });
};

module.exports = exports = Lockme;
