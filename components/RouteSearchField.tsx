import { SearchField } from 'heroui-native';

interface RouteSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Lets the field sit on a coloured header without losing contrast. */
  className?: string;
}

/** Shared search input so Explore and Routes stay identical. */
export function RouteSearchField({
  value,
  onChange,
  placeholder,
  className,
}: RouteSearchFieldProps) {
  return (
    <SearchField value={value} onChange={onChange}>
      <SearchField.Group className={className}>
        <SearchField.SearchIcon />
        <SearchField.Input placeholder={placeholder} />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField>
  );
}
