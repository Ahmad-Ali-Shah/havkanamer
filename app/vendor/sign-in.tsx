import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { BusFront } from 'lucide-react-native';
import {
  Button,
  Description,
  Input,
  Label,
  TextField,
  Typography,
  useThemeColor,
} from 'heroui-native';

import { goBackOrReplace } from '@/lib/navigation';
import { tapFeedback } from '@/lib/haptics';
import { useSessionStore } from '@/lib/store';
import { CONTENT_COLUMN, cn } from '@/lib/utils';

export default function VendorSignInScreen() {
  const [accent] = useThemeColor(['accent']);
  const signIn = useSessionStore((state) => state.signIn);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const nameError = submitted && name.trim().length < 2;
  const phoneError = submitted && phone.replace(/\D/g, '').length < 10;

  const handleSubmit = () => {
    setSubmitted(true);
    if (name.trim().length < 2 || phone.replace(/\D/g, '').length < 10) {
      tapFeedback('warning');
      return;
    }
    signIn(name.trim(), phone.trim());
    tapFeedback('success');
    goBackOrReplace('/vendor');
  };

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerClassName={cn('gap-6 p-4', CONTENT_COLUMN)}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-2">
          <View className="bg-route-surface h-12 w-12 items-center justify-center rounded-2xl">
            <BusFront color={accent} size={24} />
          </View>
          <Typography type="h4">Vendor sign in</Typography>
          <Typography type="body-sm" color="muted">
            Passengers see your name and number on the routes you publish, so they know who is
            operating.
          </Typography>
        </View>

        <TextField isInvalid={nameError}>
          <Label>Your name or company</Label>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="e.g. Faizabad Wagon Service"
            autoCapitalize="words"
          />
          <Description>Shown to passengers browsing the route.</Description>
        </TextField>

        <TextField isInvalid={phoneError}>
          <Label>Phone number</Label>
          <Input
            value={phone}
            onChangeText={setPhone}
            placeholder="03xx xxxxxxx"
            keyboardType="phone-pad"
          />
          <Description>Used as your contact number on published routes.</Description>
        </TextField>

        <Button onPress={handleSubmit}>
          <Button.Label>Continue</Button.Label>
        </Button>

        <Typography type="body-xs" color="muted" className="text-center">
          Demo sign in — details stay on this device and no code is sent.
        </Typography>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
