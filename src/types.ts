export interface Config {
    packageManager: string;
    extensions: string[];
    sourceFolder: string;
    plugins: string[];
    postUpdateCommands?: (
        updatedFiles: string[],
    ) => {
        name: string;
        command: string;
    }[];
}

export interface Codemod {
    filename: string;
    title?: string;
    questions?: () => { type: string }[];
    transformAnswers?: (answers: Record<string, unknown>) => Record<string, unknown>;
    description: string;
}

export interface Plugin {
    title?: string;
    default: Record<string, Codemod>;
}
