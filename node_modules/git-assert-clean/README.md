# git-assert-clean [![Build Status](https://travis-ci.org/bendrucker/git-assert-clean.svg)](https://travis-ci.org/bendrucker/git-assert-clean)
Assert that the git working tree is clean

## Installing

```bash
$ npm install git-assert-clean
```

## API

##### `assertClean([callback])` -> `promise`

Asserts that the working directory is clean. If it is clean, `promise` will be resolved with `undefined`. If it is not, `promise` will be rejected. If you pass a `callback`, it will be called with the error.

Promises:

```js
assertClean()
  .then(function () {
    console.log('clean as a whistle!');
  })
  .catch(function (err) {
    console.err(err);
    console.log('git is dirty');
  });
```

Callbacks: 

```js
assertClean(function (err) {
  if (!err) {
    console.log('clean as a whistle!');
  }
  else {
    console.err(err);
    console.log('git is dirty');
  }
});
```
