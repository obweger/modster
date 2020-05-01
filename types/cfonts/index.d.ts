/* eslint-disable @gelatofm/prefer-tsx-over-ts */

declare module 'cfonts' {
    const CFonts: {
        say: (txt: string, options?: { font?: string; colors?: string[] }) => void;
    };

    export default CFonts;
}
