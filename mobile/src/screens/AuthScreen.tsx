import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { T } from '../theme';

type AuthMode = 'signin' | 'signup';

type AuthScreenProps = {
  onAuthenticate: () => void;
};

export const AuthScreen = ({ onAuthenticate }: AuthScreenProps) => {
  const [mode, setMode] = useState<AuthMode>('signin');

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.page}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>GovChat</Text>
        <Text style={styles.title}>Report city issues faster.</Text>
        <Text style={styles.subtitle}>
          Sign in to track reports, follow updates, and keep your civic history in one place.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.tabRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setMode('signin')}
            style={[styles.modeTab, mode === 'signin' ? styles.modeTabActive : null]}
          >
            <Text style={[styles.modeTabText, mode === 'signin' ? styles.modeTabTextActive : null]}>
              Sign In
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setMode('signup')}
            style={[styles.modeTab, mode === 'signup' ? styles.modeTabActive : null]}
          >
            <Text style={[styles.modeTabText, mode === 'signup' ? styles.modeTabTextActive : null]}>
              Sign Up
            </Text>
          </Pressable>
        </View>

        {mode === 'signup' ? (
          <LabeledInput label="Full Name" placeholder="Jordan Lee" />
        ) : null}
        <LabeledInput label="Email" placeholder="name@example.com" />
        <LabeledInput label="Password" placeholder="Enter password" secureTextEntry />
        {mode === 'signup' ? (
          <LabeledInput label="ZIP Code" placeholder="94103" keyboardType="number-pad" />
        ) : null}

        <Pressable style={styles.primaryButton} onPress={onAuthenticate} accessibilityRole="button">
          <Text style={styles.primaryButtonText}>
            {mode === 'signin' ? 'Enter App' : 'Create Account'}
          </Text>
        </Pressable>
        {mode === 'signup' ? (
          <Text style={styles.footnote}>
            By continuing, you agree to receive report status updates.
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
};

const LabeledInput = ({
  label,
  ...props
}: {
  label: string;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'number-pad';
}) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={T.ink3}
        style={styles.input}
        autoCapitalize="none"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: T.cream,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 28,
    justifyContent: 'center',
    gap: 20,
  },
  hero: {
    gap: 10,
  },
  eyebrow: {
    color: T.blue,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: T.ink,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
  },
  subtitle: {
    color: T.ink2,
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    backgroundColor: T.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: T.border,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: T.blueLight,
    borderRadius: 16,
    padding: 4,
  },
  modeTab: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: T.white,
  },
  modeTabText: {
    color: T.ink2,
    fontWeight: '700',
    fontSize: 15,
  },
  modeTabTextActive: {
    color: T.blueDark,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: T.ink2,
    fontWeight: '700',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: T.ink,
    backgroundColor: T.white,
  },
  primaryButton: {
    marginTop: 4,
    backgroundColor: T.blue,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: T.white,
    fontSize: 16,
    fontWeight: '800',
  },
  footnote: {
    color: T.ink3,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
