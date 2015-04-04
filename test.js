'use strict';

/* global describe, it: false */

var chai = require('chai');
var expect = chai.expect;
var lockme = require('./');

describe('lockme', function() {
    var secret = 'foo';
    var str;

    it('should return a special symbol followed by an encrypted string', function (done) {

        lockme.encrypt(secret, 'foobar', function(err, encryptedText) {
            if(err) {
                return done(err);
            }

            str = encryptedText;

            expect(encryptedText[0]).to.eql(lockme.token);
            return done();
        });
    });


    it('should return a decrypted string', function(done) {

        lockme.decrypt(secret, str, function(err, decryptedText) {
            if(err) {
                return done(err);
            }

            expect(decryptedText).to.eql('foobar');
            return done();
        });
    });


    it('should use a new token', function(done) {

        var newToken = '\u2622';

        lockme.token = newToken;

        lockme.encrypt(secret, 'foobar', function(err, encryptedText) {
            if(err) {
                return done(err);
            }

            expect(encryptedText[0]).to.eql(newToken);
            return done();
        });
    });
});
