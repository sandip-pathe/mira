import React from 'react';
import { Keyboard, Pressable, Switch, Text, TextInput, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { ActionButton, Eyebrow, useTheme } from '../../../../components/ui';
import { ActivityBackButton } from '../../components/ActivityBackButton';
import { reachOutTones } from './reachOutToneVariants';
import { styles } from './reachOutStyles';
import type { ReachOutExperience } from './useReachOutExperience';

export function ReachOutEditor({ experience: x, onHome }: { experience: ReachOutExperience; onHome: () => void }) {
  const { colors, typography } = useTheme();
  const inputColors = { color: colors.ink, backgroundColor: colors.surface, borderColor: colors.line };
  return <>
    <ActivityBackButton label="Reach Out" onPress={onHome} />
    <Eyebrow>REACH OUT · YOUR WORDS</Eyebrow>
    <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>Write it how you would say it.</Text>
    <View style={styles.tones}>{reachOutTones.map((item) => {
      const selected = x.tone === item.id;
      return <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.label} tone`}
        accessibilityState={{ selected }} onPress={() => x.applyTone(item.id)}
        style={({ pressed }) => [styles.tone, { backgroundColor: selected ? colors.soft : colors.surface, opacity: pressed ? 0.65 : 1 }]}>
        {selected && <MaterialDesignIcons name="check" size={17} color={colors.primary} />}
        <Text style={[typography.button, { color: selected ? colors.primary : colors.ink, flexShrink: 1 }]}>{item.label}</Text>
      </Pressable>;
    })}</View>
    <TextInput accessibilityLabel="Message draft" multiline maxLength={2000} value={x.message} onChangeText={x.setMessage}
      placeholder="Write a message…" placeholderTextColor={colors.muted} cursorColor={colors.primary} selectionColor={colors.primary}
      style={[typography.body, styles.input, inputColors]} />
    {x.contextAvailable && <View style={styles.contextToggle}>
      <Text style={[typography.recentTitle, { flex: 1, color: colors.ink }]}>Use what we discussed in Talk</Text>
      <Switch accessibilityLabel="Use what we discussed in Talk" value={x.contextEnabled} onValueChange={x.toggleContext}
        trackColor={{ false: colors.disabled, true: colors.primary }} thumbColor={colors.surface} />
    </View>}
    {x.contextEnabled && <>
      <Text style={[typography.support, { color: colors.muted }]}>Review and edit what will be used. It is sent only when you ask for an AI suggestion.</Text>
      <TextInput accessibilityLabel="Talk context" multiline maxLength={2400} value={x.context} onChangeText={x.setContext}
        placeholder="Talk context" placeholderTextColor={colors.muted} cursorColor={colors.primary} selectionColor={colors.primary}
        style={[typography.body, styles.input, styles.contextInput, inputColors]} />
      <ActionButton label={x.rewriting ? 'Thinking…' : 'Suggest using this context'} loading={x.rewriting}
        disabled={!x.context.trim() || !x.message.trim()} variant="secondary"
        onPress={() => { Keyboard.dismiss(); void x.suggestWithContext(); }} />
    </>}
    {x.rewriting && <ActionButton label="Cancel suggestion" variant="quiet" onPress={x.cancelRewrite} />}
    {!!x.originalMessage && <ActionButton label="Restore my original wording" variant="quiet" onPress={x.restoreOriginal} />}
    <ActionButton label="Review message" disabled={!x.message.trim()} onPress={x.goPreview} />
    {!!x.status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{x.status}</Text>}
  </>;
}
