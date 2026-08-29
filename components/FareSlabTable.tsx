import { View } from 'react-native';
import { Typography } from 'heroui-native';

import { formatFare, formatSlabRange, sortedSlabs } from '@/lib/geo';
import type { FareSlab } from '@/lib/types';

interface FareSlabTableProps {
  slabs: FareSlab[];
  /** Highlights the slab a specific trip distance falls into. */
  highlightSlabId?: string | null;
}

export function FareSlabTable({ slabs, highlightSlabId }: FareSlabTableProps) {
  if (slabs.length === 0) {
    return (
      <Typography type="body-sm" color="muted">
        This vendor has not shared fares yet.
      </Typography>
    );
  }

  return (
    <View className="border-border overflow-hidden rounded-xl border">
      {sortedSlabs(slabs).map((slab, index) => (
        <View
          key={slab.id}
          className={`flex-row items-center justify-between px-3.5 py-2.5 ${
            index > 0 ? 'border-border border-t' : ''
          } ${slab.id === highlightSlabId ? 'bg-fare-surface' : ''}`}
        >
          <Typography type="body-sm" color="muted">
            {formatSlabRange(slab)}
          </Typography>
          <Typography type="body-sm" weight="semibold" className="text-fare">
            {formatFare(slab.fare)}
          </Typography>
        </View>
      ))}
    </View>
  );
}
