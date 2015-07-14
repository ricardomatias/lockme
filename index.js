'use strict';

var fs = require('fs');
var crypto = require('crypto');
var path = require('path');
var chalk = require('chalk');
var promptly = require('promptly');


function Lockme(opts) {
    opts = opts || {};

    this.token = opts.token || '\u2603';
    this.encoding = opts.encoding || 'base64';
    this.secret = [];
}

Lockme.prototype._promptMessage = function _promptMessage(message) {
    return [
        chalk.bold.green(message),
        chalk.blue('>')
    ].join('\n');
};


Lockme.prototype.promptDecryption = function promptDecryption(message, text, cb) {
    var self = this;
    promptly.prompt(self._promptMessage(message), {
        silent: true
    }, function (err, secret) {
        if (err) {
            return cb(err);
        }

        self.decrypt(secret, text, function (error, decryptedText) {
            if (error && /.+bad decrypt?/g.test(error.message)) {
                console.log(chalk.yellow('Wrong secret!'));
                return self.promptDecryption(message, text, cb);
            }

            if (error) {
                return cb(err);
            }

            return cb(null, secret, decryptedText);
        });
    });
};


Lockme.prototype.promptEncryption = function promptEncryption(message, text, cb) {
    promptly.prompt(this._promptMessage(message), {retry: true, silent: true}, function(err, pw) {
        if (err) {
            return cb(err);
        }

        // Store the secret
        this.secret.push(pw);

        if (this.secret.length < 2) {
            return this.promptEncryption('Please confirm the secret', text, cb);
        }

        // When secret's match, call encrypt
        if (this.secret.length === 2 && this.secret[0] === this.secret[1]) {
            return cb(null, this.secret[0]);
        }

        this.secret = [];

        return this.promptEncryption(chalk.yellow('The secrets do not match. Please try again!'), text, cb);
    }.bind(this));
};


Lockme.prototype.isEncrypted = function isEncrypted(text) {
    // When file is encrypted
    if (text[0] === this.token) {
        return true;
    }
    // When file is NOT encrypted
    return false;
};


Lockme.prototype.writeFile = function writeFile(filename, message, text, cb) {
    fs.writeFile(filename, text, function(err) {
        if (err) {
            return cb(err);
        }

        return cb(null, message);
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

module.exports = exports = Lockme;
