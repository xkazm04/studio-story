/** Shared MCP response helpers */

export const textContent = (text: string) => ({ content: [{ type: 'text' as const, text }] });
export const errorContent = (text: string) => ({ content: [{ type: 'text' as const, text }], isError: true });
