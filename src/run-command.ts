import { spawn } from 'child_process';

export interface RunResult {
    code: number | null;
    out: string[];
}

export const runCommand = (command: string, args: string[]) =>
    new Promise<RunResult>((resolve) => {
        const spawnedProcess = spawn(command, args, {
            shell: true,
            env: process.env,
        });

        const out: string[] = [];

        spawnedProcess.stdout.on('data', (data: unknown) => {
            const str = (data as Buffer).toString();
            process.stdout.write(data as Buffer);
            out.push(str);
        });

        spawnedProcess.on('exit', (code) => resolve({ code, out }));
    });
