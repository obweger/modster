#!/usr/bin/env ts-node

import path from 'path';
import process from 'process';

import meow from 'meow';

import { Config } from './types';

import modster from './index';

const cli = meow(
    `
	Usage
	  $ modster

	Options
      --config, -c  Path to config; defaults to ./codemods
      --dry, -d     Execute codemod in dry run
`,
    {
        flags: {
            config: {
                type: 'string',
                alias: 'c',
            },
            dry: {
                type: 'boolean',
                alias: 'd',
            },
        },
    },
);

const configPath = cli.flags.config || path.join(process.cwd(), '.codemods');

const config = require(configPath).default as Config;

modster({ config, dryRun: cli.flags.dry });
