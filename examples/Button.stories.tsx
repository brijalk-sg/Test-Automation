import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
    title: 'Components/Button',
    component: Button,
    argTypes: {
        variant: { control: 'select', options: ['primary', 'secondary', 'danger'] },
        size: { control: 'select', options: ['sm', 'md', 'lg'] },
    },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
    args: {
        label: 'Primary Button',
        variant: 'primary',
    },
};

export const Secondary: Story = {
    args: {
        label: 'Secondary Button',
        variant: 'secondary',
    },
};

export const Danger: Story = {
    args: {
        label: 'Delete',
        variant: 'danger',
    },
};

export const Disabled: Story = {
    args: {
        label: 'Disabled',
        disabled: true,
    },
};

export const Loading: Story = {
    args: {
        label: 'Loading...',
        loading: true,
    },
};
