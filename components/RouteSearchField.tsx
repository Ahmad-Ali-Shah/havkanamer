import { SearchField } from 'heroui-native';

interface RouteSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

/** Shared search input so Explore and Routes stay identical. */
export function RouteSearchField({ value, onChange, placeholder }: RouteSearchFieldProps) {
  return (
    <SearchField value={value} onChange={onChange}>
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input placeholder={placeholder} />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField>
  );
}
