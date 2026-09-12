export {};

declare global {
  interface Window {
    __kaFormatCode?: (
      code: string,
      options: { parser: string; tabWidth: number; useTabs: boolean; cursorOffset: number },
    ) => Promise<{ formatted: string; cursorOffset: number }>;
  }
}
