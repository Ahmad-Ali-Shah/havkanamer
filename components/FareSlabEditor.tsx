import { useState } from 'react';
import { View } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import { Button, Input, Typography, useThemeColor } from 'heroui-native';

import { createId } from '@/lib/utils';
import type { FareSlab } from '@/lib/types';

interface EditorRow {
  id: string;
  /** Upper bound in km as typed. Empty on the final row means "and beyond". */
  toKm: string;
  fare: string;
}

interface FareSlabEditorProps {
  initialSlabs: FareSlab[];
  onChange: (slabs: FareSlab[]) => void;
}

function digitsOnly(text: string) {
  return text.replace(/[^\d]/g, '');
}

function toRows(slabs: FareSlab[]): EditorRow[] {
  return slabs.map((slab) => ({
    id: slab.id,
    toKm: slab.toKm === null ? '' : String(slab.toKm),
    fare: String(slab.fare),
  }));
}

export function parseFareRows(rows: { id: string; toKm: string; fare: string }[]): FareSlab[] {
  let from = 0;
  return rows.map((row, index) => {
    const isLast = index === rows.length - 1;
    const parsedTo = row.toKm.trim().length === 0 ? null : Number(row.toKm);
    const toKm = isLast && parsedTo === null ? null : (parsedTo ?? from + 1);
    const slab: FareSlab = {
      id: row.id,
      fromKm: from,
      toKm,
      fare: Number(row.fare.trim().length === 0 ? 0 : row.fare),
    };
    from = toKm ?? from;
    return slab;
  });
}

/** Distance-band fare editor. Each row's lower bound follows the previous row. */
export function FareSlabEditor({ initialSlabs, onChange }: FareSlabEditorProps) {
  const [muted] = useThemeColor(['muted']);
  const [rows, setRows] = useState<EditorRow[]>(() => toRows(initialSlabs));

  const commit = (next: EditorRow[]) => {
    setRows(next);
    onChange(parseFareRows(next));
  };

  const lowerBound = (index: number) => {
    let from = 0;
    for (let cursor = 0; cursor < index; cursor += 1) {
      const parsed = Number(rows[cursor].toKm);
      if (Number.isFinite(parsed) && parsed > from) from = parsed;
    }
    return from;
  };

  return (
    <View className="gap-3">
      {rows.map((row, index) => {
        const isLast = index === rows.length - 1;
        const from = lowerBound(index);

        return (
          <View key={row.id} className="border-border gap-2 rounded-xl border p-3">
            <View className="flex-row items-center justify-between">
              <Typography type="body-xs" weight="semibold" color="muted">
                {isLast && row.toKm.trim().length === 0
                  ? `${from} km and beyond`
                  : `From ${from} km`}
              </Typography>
              {rows.length > 1 ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => commit(rows.filter((candidate) => candidate.id !== row.id))}
                >
                  <X color={muted} size={14} />
                  <Button.Label>Remove</Button.Label>
                </Button>
              ) : null}
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 gap-1.5">
                <Typography type="body-xs" color="muted">
                  Up to (km)
                </Typography>
                <Input
                  value={row.toKm}
                  onChangeText={(text) =>
                    commit(
                      rows.map((candidate) =>
                        candidate.id === row.id
                          ? { ...candidate, toKm: digitsOnly(text) }
                          : candidate,
                      ),
                    )
                  }
                  placeholder={isLast ? 'End of route' : '5'}
                  keyboardType="number-pad"
                />
              </View>
              <View className="flex-1 gap-1.5">
                <Typography type="body-xs" color="muted">
                  Fare (Rs)
                </Typography>
                <Input
                  value={row.fare}
                  onChangeText={(text) =>
                    commit(
                      rows.map((candidate) =>
                        candidate.id === row.id
                          ? { ...candidate, fare: digitsOnly(text) }
                          : candidate,
                      ),
                    )
                  }
                  placeholder="100"
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>
        );
      })}

      <Button
        variant="tertiary"
        onPress={() => commit([...rows, { id: createId('slab'), toKm: '', fare: '' }])}
      >
        <Plus color={muted} size={16} />
        <Button.Label>Add another band</Button.Label>
      </Button>
    </View>
  );
}
