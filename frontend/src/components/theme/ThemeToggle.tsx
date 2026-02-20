'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme';

interface ThemeToggleProps {
  className?: string;
  iconClassName?: string;
}

export function ThemeToggle({ className, iconClassName }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn('rounded-full', className)}
    >
      {isDark ? (
        <Sun className={cn('w-4 h-4 text-text-secondary', iconClassName)} />
      ) : (
        <Moon className={cn('w-4 h-4 text-text-secondary', iconClassName)} />
      )}
    </Button>
  );
}
