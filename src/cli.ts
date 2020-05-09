import path from 'path';
import process from 'process';

import meow from 'meow';

import { Config } from './types';

import { runtime } from './runtime';

export const cli = async () => {
    const meowCli = meow(
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
    
    const configPath = meowCli.flags.config || path.join(process.cwd(), '.codemods');
    
    let config;
    try {
        config = require(configPath) as Config;
    } catch (e) {
        if (e.code === 'MODULE_NOT_FOUND') {
            console.warn(`😑 Configuration file '${configPath}' could not be resolved.`);
        } else {
            throw e;
        }
    }

    if (config) {
        await runtime({ config, dryRun: meowCli.flags.dry });
    }
}
