import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// GitHub source link - path relative to dapp-example/
export const GITHUB_BASE = 'https://github.com/avnu-labs/avnu-sdk/tree/develop/dapp-example';
export const getSourceUrl = (path: string) => `${GITHUB_BASE}/${path}`;
