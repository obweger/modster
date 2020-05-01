import path from 'path';
import process from 'process';

import { Promise as BluebirdPromise } from 'bluebird';
import boxen, { BorderStyle } from 'boxen';
import CFonts from 'cfonts';
import chalk from 'chalk';
import { gitignore } from 'globby';
import inquirer from 'inquirer';
import flatten from 'lodash/flatten';

import { runCommand, RunResult } from './run-command';
import { Codemod, Config, Plugin } from './types';

inquirer.registerPrompt('path', require('inquirer-fuzzy-path'));

const PLUGIN_NAME = 'modster-plugin';
const OK_SIGNAL_PREFIX = '\u001b[37m\u001b[42m OKK \u001b[49m\u001b[39m';
const LIGHT_BLUE = '#2bd9fe';

const printBox = (txt: string) =>
    console.log(
        boxen(txt, {
            borderStyle: BorderStyle.Round,
            padding: { top: 0, right: 4, bottom: 0, left: 4 },
            margin: { top: 1, right: 1, bottom: 1, left: 1 },
        }),
    );

const toPackageName = (pluginName: string) => {
    if (pluginName.startsWith('@')) {
        const [scope, pkg] = pluginName.split('/');
        if (pkg === undefined) {
            return `${scope}/${PLUGIN_NAME}`;
        }
        return `${scope}/${PLUGIN_NAME}-${pkg}`;
    }
    return `${PLUGIN_NAME}-${pluginName}`;
};

const resolvePlugins = ({ pluginNames }: { pluginNames: string[] }) => {
    const warnings: { pluginName: string; packageName: string }[] = [];

    const plugins = pluginNames
        .map((pluginName) => {
            const packageName = toPackageName(pluginName);
            try {
                return {
                    name: pluginName,
                    module: require(packageName) as Plugin,
                };
            } catch (e) {
                if (e.code === 'MODULE_NOT_FOUND') {
                    warnings.push({ pluginName, packageName });
                    return undefined;
                }
                throw e;
            }
        })
        .filter(Boolean) as { name: string; module: Plugin }[];

    if (warnings.length > 0) {
        warnings.forEach(({ pluginName, packageName }) => {
            console.warn(
                `😑 Plugin '${pluginName}' (package '${packageName}') could not be resolved.`,
            );
        });
        console.log('');
    }

    return plugins;
};

const pickCodemod = async ({ plugins }: { plugins: { name: string; module: Plugin }[] }) => {
    const answer: {
        codemod: { plugin: Plugin; codemod: Codemod; codemodKey: string };
    } = await inquirer.prompt([
        {
            type: 'list',
            name: 'codemod',
            message: 'Pick your codemod',
            choices: flatten(
                plugins.map((plugin) => [
                    new inquirer.Separator(
                        plugin.module.title
                            ? `${chalk.bold(plugin.module.title)} ${chalk.dim(plugin.name)}`
                            : chalk.bold(plugin.name),
                    ),
                    ...Object.keys(plugin.module.default).map((codemodKey) => {
                        const codemod = plugin.module.default[codemodKey];
                        return {
                            name: `  🔫 ${codemod.title || codemodKey} ${chalk.dim(
                                chalk.white(codemod.description || ''),
                            )}`,
                            value: { plugin, codemod, codemodKey },
                            short: codemod.title || codemodKey,
                        };
                    }),
                ]),
            ),
        },
    ]);

    const { plugin, codemod, codemodKey } = answer.codemod;

    return { plugin, codemod, codemodKey };
};

const configureCodemod = async ({ codemod, config }: { codemod: Codemod; config: Config }) => {
    const ignored = await gitignore();

    const questions = (codemod.questions?.() || []).map((question) => {
        if (question.type === 'path') {
            return {
                rootPath: path.relative(process.cwd(), config.sourceFolder),
                ...question,
                excludePath: ignored,
                excludeFilter: ignored,
            };
        }
        return question;
    });

    const options = (await inquirer.prompt(questions)) as Record<string, unknown>;
    const transformedOptions = codemod.transformAnswers
        ? codemod.transformAnswers(options)
        : options;

    const { target } = await inquirer.prompt([
        {
            type: 'path',
            name: 'target',
            excludePath: ignored,
            excludeFilter: ignored,
            itemType: 'any',
            rootPath: path.relative(process.cwd(), config.sourceFolder),
            message: 'What files do you want to run against?',
            suggestOnly: false,
        },
    ]);

    return { options: transformedOptions, target };
};

interface RunCodemodArgs {
    codemod: Codemod;
    codemodKey: string;
    options: Record<string, unknown>;
    target: string;
    config: Config;
    dryRun: boolean;
}

const runCodemod = async ({
    codemod,
    codemodKey,
    options,
    target,
    config,
    dryRun,
}: RunCodemodArgs) => {
    // force colors to work across 'spawn';
    // see e.g. https://stackoverflow.com/questions/7725809/preserve-color-when-executing-child-process-spawn
    // @ts-ignore
    process.env.FORCE_COLOR = true;

    printBox(
        `Run ${chalk.hex(LIGHT_BLUE).bold(codemod.title || codemodKey)}...${
            dryRun ? ' [Dry]' : ''
        }`,
    );

    const transform = path.relative(process.cwd(), codemod.filename);

    const result = await runCommand(
        config.packageManager,
        [
            'jscodeshift',
            `--transform=${transform}`,
            `"${target}"`,
            `--extensions=${config.extensions ? config.extensions.join(',') : 'js'}`,
            ...Object.keys(options).map((option) => `--${option}="${options[option]}"`),
            '--verbose=2',
            dryRun ? '--dry' : undefined,
        ].filter(Boolean) as string[],
    );

    const updatedFiles = result.out
        .map((line) =>
            line.startsWith(OK_SIGNAL_PREFIX)
                ? line.substr(OK_SIGNAL_PREFIX.length).trim()
                : undefined,
        )
        .filter(Boolean) as string[];

    return { updatedFiles };
};

const runPostUpdateCommands = async ({
    config,
    updatedFiles,
}: {
    config: Config;
    updatedFiles: string[];
}) => {
    if (updatedFiles.length > 0 && config.postUpdateCommands) {
        const postUpdateCommands = config.postUpdateCommands(updatedFiles);

        return BluebirdPromise.mapSeries(postUpdateCommands, async (postUpdateCommand) => {
            printBox(
                `Run post update command ${chalk.hex(LIGHT_BLUE).bold(postUpdateCommand.name)}...`,
            );

            const [cmd, ...args] = postUpdateCommand.command.split(' ');
            return runCommand(cmd, args);
        });
    }
    return [];
};

interface Args {
    config: Config;
    dryRun?: boolean;
}

export default async ({ config, dryRun = false }: Args) => {
    CFonts.say('Modster', { font: 'tiny', colors: [LIGHT_BLUE] });

    const plugins = resolvePlugins({ pluginNames: config.plugins });

    if (plugins.length === 0) {
        printBox('No plugins found - goodbye!');
        return undefined;
    }

    const { plugin, codemod, codemodKey } = await pickCodemod({ plugins });

    const { options, target } = await configureCodemod({ codemod, config });

    const { updatedFiles } = await runCodemod({
        codemod,
        codemodKey,
        options,
        target,
        config,
        dryRun,
    });

    let postUpdateCommandResults: RunResult[] = [];
    if (!dryRun) {
        postUpdateCommandResults = await runPostUpdateCommands({ config, updatedFiles });
    }

    printBox(chalk.hex(LIGHT_BLUE).bold('Done!'));

    return { plugin, codemod, codemodKey, options, target, updatedFiles, postUpdateCommandResults };
};
