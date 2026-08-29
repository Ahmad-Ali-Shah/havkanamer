import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { Chip, Typography, useThemeColor } from 'heroui-native';

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  /** Optional symbol so the choice reads at a glance, not just as text. */
  icon?: LucideIcon;
}

interface ChoiceRowProps<T extends string> {
  label: string;
  hint?: string;
  options: ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Label plus a wrapping row of selectable chips — used across the vendor forms. */
export function ChoiceRow<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
}: ChoiceRowProps<T>) {
  const [accentForeground, muted] = useThemeColor(['accent-foreground', 'muted']);

  return (
    <View className="gap-2">
      <Typography type="body-sm" weight="semibold">
        {label}
      </Typography>
      {hint ? (
        <Typography type="body-xs" color="muted">
          {hint}
        </Typography>
      ) : null}
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = value === option.value;
          const Icon = option.icon;
          return (
            <Chip
              key={option.value}
              size="sm"
              variant={isSelected ? 'primary' : 'tertiary'}
              color={isSelected ? 'accent' : 'default'}
              onPress={() => onChange(option.value)}
            >
              {Icon ? <Icon color={isSelected ? accentForeground : muted} size={13} /> : null}
              <Chip.Label>{option.label}</Chip.Label>
            </Chip>
          );
        })}
      </View>
    </View>
  );
}
