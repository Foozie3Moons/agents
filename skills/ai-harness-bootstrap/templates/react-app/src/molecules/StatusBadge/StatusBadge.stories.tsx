import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusBadge } from './StatusBadge.js';

const meta = { component: StatusBadge } satisfies Meta<typeof StatusBadge>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Good: Story = { args: { label: 'ok', tone: 'good' } };
export const Bad: Story = { args: { label: 'degraded', tone: 'bad' } };
