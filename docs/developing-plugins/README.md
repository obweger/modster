# Developing Modster plugins

Modster uses a plugin system to consume codemods, similar to how e.g. `eslint` consumes linting rules.

Put simply, a Modster plugin is an `npm` package that provides a number of **codemod descriptions**. Each codemod description provides meta data and utilities to an underlying [`jscodeshift`](https://github.com/facebook/jscodeshift) codemod (a.k.a. a "trasform" in `jscodeshift` speak), making it easier for users to run this codemod.

The most important parts of a codemod description are therefore

- a pointer to the actual codemod implementation, and
- an [`inquirer.js`](https://github.com/SBoudrias/Inquirer.js) prompt configuration to generate the codemod's [`Options`](https://github.com/facebook/jscodeshift#options) in a user-friendly way.

Provided a set of plugins, Modster then works as follows:

1. The user starts Modster and is presented the list of plugins and their codemod descriptions.
2. The user picks a codemod description.
3. Modster uses `inquirer.js` to present the codemod description's prompts to the user. If needed, a transformation function can be applied to transform the set of answers into the codemod's `Options`.
4. The user is asked to provide a target file or directory to run the codemod against.
5. The user's inputs, along with values from Modster's `.codemods.js` configuration, are used to invoke `jscodeshift`. If `postUpdateTasks` are configured, these are run against the any changed files.

So far, so easy - let's look into writing your own Modster plugin!

## Writing codemods

It is important to understand that Modster is really just an abstraction around `jscodeshift` - so if you're planning to create a Modster plugin, there's a good chance you will also write the actual codemod implementation (a.k.a. "transform" in `jscodeshift` speak). This is **by far** the hardest part of creating a Modster plugin - but luckily, some very smart people have written some very smart articles to help you getting started. Besides the official `jscodeshift` documentation, the Modster team found these articles helpful:

- [Writing your very first codemod with jscodeshift](https://medium.com/@andrew_levine/writing-your-very-first-codemod-with-jscodeshift-7a24c4ede31b)
- [How to write a codemod](https://vramana.github.io/blog/2015/12/21/codemod-tutorial/)
- [Write Code to Rewrite Your Code: jscodeshift](https://www.toptal.com/javascript/write-code-to-rewrite-your-code)

## Hello World

A great starting point for Modster plugin development is [`modster-plugin-hello-world`](https://github.com/obweger/modster-plugin-hello-world). It's a regular Modster plugin - you can install it right here, right now - but really mainly exists to demostrate how Modster plugins work with a super-simple, minimal example. We'll come back to the `hello-world` plugin in our tutorial below!

## Getting started with your first Modster plugin

Once you master the craft of writing `jscodeshift` tranforms, putting such transforms into a Modster plugin is a very simple, two-step exercise. Read on to create your very first, very own Modster plugin!

- 1️⃣ [Setting up the package](./01-setting-up-the-package.md)
- 2️⃣ [Codemod descriptions](./02-codemod-descriptions.md)
