import type { INodePropertyOptions } from 'n8n-workflow';

export const TAG_COLORS = [
  'amber', 'blue', 'bronze', 'brown', 'crimson', 'cyan', 'gold', 'grass',
  'gray', 'green', 'indigo', 'iris', 'jade', 'lime', 'mint', 'orange',
  'pink', 'plum', 'purple', 'red', 'ruby', 'sky', 'teal', 'tomato',
  'violet', 'yellow',
] as const;

export const COLOR_OPTIONS: INodePropertyOptions[] = [
  { name: 'Random', value: 'random', description: 'Automatically pick a random color' },
  ...TAG_COLORS.map((c) => ({
    name: c.charAt(0).toUpperCase() + c.slice(1),
    value: c,
  })),
];

export function resolveColor(color: string): string {
  if (!color || color === 'random') {
    return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
  }
  return color;
}
