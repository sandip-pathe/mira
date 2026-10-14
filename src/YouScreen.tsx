import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDemoSession } from './api';
import { emitContextRevoked, emitDemoReset } from './demoEvents';
import { Journal } from './Journal';
import { colors, Eyebrow, ui } from './ui';

export default function YouScreen() {
  const [draft, setDraft] = React.useState('');
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
    <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 28, gap: 17, maxWidth: 660, width: '100%', alignSelf: 'center' }}>
      <View style={{ gap: 5 }}><Eyebrow>YOUR SPACE</Eyebrow><Text style={ui.title}>You</Text>
        <Text style={ui.muted}>Journal entries and the preferences you chose to save.</Text></View>
      <Journal draft={draft} setDraft={setDraft} getSession={getDemoSession} visible onReset={emitDemoReset}
        onContextRevoked={emitContextRevoked} />
    </ScrollView>
  </SafeAreaView>;
}
