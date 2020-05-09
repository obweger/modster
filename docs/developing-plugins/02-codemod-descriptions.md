# 2️⃣ Codemod descriptions

The core piece of every Modster plugin is its collection of codemod descriptions. Codemod descriptions provide meta data and utilities to an underlying [`jscodeshift`](https://github.com/facebook/jscodeshift) codemod (a.k.a. a `trasform` in `jscodeshift` speak), making it easier for users to run this codemod.

A codemod description has the following fields:

| Field | Type | Required | Description |
|- |-|-|-|
| `filename` | `function` | ✅ | A function of the shape `() => string`, returning the absolute file path to the codemod's implementation. See [`filename`](#filename) below. |
| `title` | `string` | | The codemod's title. If not provided, Modster falls back to the `codemodIdentifier` used in the plugin's `codemods` object. |
| `description` | `string` | | A brief description of what the codemod does. |
| `questions` | `function` | | A function of the shape `(config: Config) => InquirerJsQuestion[]`, receiving the active Modster configuration, and returning an array of [`inquirer.js`](https://github.com/SBoudrias/Inquirer.js) [`Question`](https://github.com/SBoudrias/Inquirer.js/#questions) objects. See [`questions`](#questions) below. |
| `transformAnswers` | `function` | | A function of the shape `(answers: Record<string, any>, config: Config) => Record<string, any>`, receiving the answers provided by the user to the set of `questions` (plus the active Modster configuration), and returning the hash of `Options` to be provided to the codemod implementation when running it. Defaults to a `no-op` - in this case, the provided answers are directly passed through as `Options`. See [`transformAnswers`](#transformanswers) below.

## `filename`

The `filename` field is what ultimately links a codemod description to the underlying codemod implementation. It literally points to the file that _is_ the codemod implementation - which is what Modster will pass to `jscodeshift` as its `transform` propery.

The right way to provide the `filename` really depends on whether the codemod description and codemod implementation are a.) co-located, or b.) live separately:

### Co-locating codemod implementations and descriptions

The preferred way of writing Modster plugins is to have the codemod implementation and the codemod description co-located in the same file. In [`modster-plugin-hello-world`](https://github.com/obweger/modster-plugin-hello-world), this is what happens in the `rename-variable` codemod:

```js
/* The codemod implementation - this is what jscodeshift cares about: */

module.exports = (fileInfo, api, options) => {
    return api.jscodeshift(fileInfo.source)
        .findVariableDeclarators(options.from)
        .renameTo(options.to)
        .toSource();
};

/* The codemod description - this is what Modster cares about: */

module.exports.filename = () => __filename;

module.exports.title = "Rename variables";

/* etc. etc. - see full source for details */
```

_Full source [here](https://github.com/obweger/modster-plugin-hello-world/blob/master/src/codemods/rename-variable.js)._

As we really want to "point back to ourselves", we can rely on node.js's `__filename` utility and do

```js
module.exports.filename = () => __filename;
```

Easy! Note that because of it's main export, `rename-variable.js` is also a perfectly valid `jscodeshift` `transform`. This means that you can invoke `jscodeshift` directly - which you may or may not find useful.

### Seperate codemod implementations

In some cases, you may want to provide a Modster plugin for an existing set of codemods, often owned by another author. In this case, it may be necessary to create a Modster plugin that is seperate from the existing codemod implementations. In [`modster-plugin-hello-world`](https://github.com/obweger/modster-plugin-hello-world), this is what happens in the `rename-variable` codemod:

```js
const path = require('path');

module.exports.filename = () => path.join(require.resolve('codemods-hello-world'), '../codemods/change-import-source.js');

module.exports.title = "Change import source";

/* etc. etc. - see full source for details */
```

_Full source [here](https://github.com/obweger/modster-plugin-hello-world/blob/master/src/codemods/change-import-source.js)._

As you can see in the `module.exports.filename` line, we now have to manually stitch together the path to where the codemod implementation lives; in our case, this is somewhere within the [`codemods-hello-world`](https://github.com/obweger/codemods-hello-world) package. That's not ideal, as we now depend on the internal structure of another package, which could easily change in the future. Whenever possible, we should therefore try to co-locate codemod descriptions and implementations.

## `questions`

The `questions` array is pretty muched proxied through to [`inquirer.js`](https://github.com/SBoudrias/Inquirer.js/), so please refer to the `inquirer.js` documentation for all standard prompts.

In addition to all standard prompts, Modster registers [`inquirer-fuzzy-path`](https://github.com/adelsz/inquirer-fuzzy-path), for `type: path`. Prompts of type `path` are useful for when a file or folder path is required. Please refer to the `inquirer-fuzzy-path` repository for further documentation. Note that by default, Modster will set `rootPath` to the project's `soureFolder`, and configure `excludePath` and `excludeFilter` to ignore files from `.gitignore`. If needed, these properties can be overridden in the respective `question` hash.

## `transformAnswers`

Modster will only run successfully if all required [`Options`](https://github.com/facebook/jscodeshift#options) of the given codemod implementation are provided. The optional `transformAnswers` function can be used to transform the user's answers to the `questions` prompts into whatever shape is expected by the codemod. `transformAnswers` is useful e.g. if several answers need to be combined into one `option` parameter.

## Your first codemod description

In your first codemod plugin, you may want to copy over [`modster-plugin-hello-world`](https://github.com/obweger/modster-plugin-hello-world)'s `rename-variable`, and take it from there. Don't forget to add it to your plugins's main entrypoint, as discussed in [Step 1](./01-setting-up-the-package.md).

## ... and this is it!

Congrats, you are now a certified Modster plugin developer! Codemod away! ✌️
