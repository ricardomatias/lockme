# lockme [![Build Status](https://travis-ci.org/ricardomatias/lockme.svg)](https://travis-ci.org/ricardomatias/lockme)

> Encrypt any text file with a password (CLI)
> 
> **Use with caution. There's no way of unlocking a file without the original secret.**

## Requirements

* node.js

## CLI

```
npm install -g lockme
```

```cli
lockme account.txt
Write the secret you want to encrypt with:
> ****
Please confirm the secret
> ****
File locked!

lockme account.txt
What's the secret ?
> ****
File unlocked!
```

## Usage

```
npm install lockme
```

```
var Lockme = require('lockme');
var lm = new Lockme();

lockme.decrypt('foo', 'hello world!', function(err, decryptedText) {
    if(err) {
        // do something
    }

    console.log(decryptedText); // 'hello world'
});

```

## API

The encryption is done with the use of a special *Unicode* character to identify that the text was encrypted with **lockme**.

This character is assigned to the **token** property, so you can change it to another character.

The **decrypt** method expects exactly **one** character, so it will throw an error in case this changes.

### encrypt(secret, text, callback)

Encrypts the **text** with the given **secret**.

---

### decrypt(secret, string, callback)

Decrypts the **text** with the given **secret**.

## License

MIT © Ricardo Matias
