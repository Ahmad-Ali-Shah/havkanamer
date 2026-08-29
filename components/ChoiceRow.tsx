import { View } from 'react-native';
import { Chip, Typography } from 'heroui-native';

interface ChoiceRowProps<T extends string> {
  label: string;
  hint?: string;
  options: { value: T; label: string }[];
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
        {options.map((option) => (
          <Chip
            key={option.value}
            size="sm"
            variant={value === option.value ? 'primary' : 'tertiary'}
            color={value === option.value ? 'accent' : 'default'}
            onPress={() => onChange(option.value)}
          >
            <Chip.Label>{option.label}</Chip.Label>
          </Chip>
        ))}
      </View>
    </View>
  );
}
