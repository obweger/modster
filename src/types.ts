export interface Config {
    packageManager: string;
    extensions: string[];
    parser?: string;
    sourceFolder: string;
    plugins: string[];
    postUpdateTasks?: (
        updatedFiles: string[],
    ) => {
        name: string;
        command: string;
    }[];
}

export interface Codemod {
    filename: () => string;
    title?: string;
    description?: string;
    questions?: (config: Config) => { type: string }[];
    transformAnswers?: (answers: Record<string, unknown>, config: Config) => Record<string, unknown>;
}

export interface Plugin {
    title?: string;
    codemods: Record<string, Codemod>;
}
