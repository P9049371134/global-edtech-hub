declare global {
  interface Window {
    /**
     * Navigate to the auth page with a custom redirect URL
     * @param redirectUrl - URL to redirect to after successful authentication
     */
    navigateToAuth: (redirectUrl: string) => void;
  }

  // Provide global Buffer type/value to satisfy TS without @types/node
  var Buffer: any;
  type Buffer = any;
}

declare module "node:crypto";

export {};