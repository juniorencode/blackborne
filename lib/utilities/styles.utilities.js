import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...args) => twMerge(clsx(args));

export { cn };
