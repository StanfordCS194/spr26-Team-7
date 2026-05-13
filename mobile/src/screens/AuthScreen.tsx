import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { signInWithEmail, getAuthRedirectUri, signInWithGoogle, signUpWithEmail } from '../lib/auth';
import { T } from '../theme';

type AuthMode = 'signin' | 'signup';

type LabeledInputProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'number-pad';
  autoCapitalize?: 'none' | 'words';
};

const LabeledInput = ({
  label,
  value,
  onChangeText,
  autoCapitalize = 'none',
  ...props
}: LabeledInputProps) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        {...props}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize}
        placeholderTextColor={T.ink3}
        style={styles.input}
      />
    </View>
  );
};

export const AuthScreen = () => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const resetMessages = () => {
    setErrorMessage(null);
    setInfoMessage(null);
  };

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    resetMessages();
  };

  const handleSubmit = async () => {
    resetMessages();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setErrorMessage('Enter your email and password.');
      return;
    }

    if (mode === 'signup' && (!fullName.trim() || !zipCode.trim())) {
      setErrorMessage('Enter your full name and ZIP code to create an account.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(normalizedEmail, password);
        return;
      }

      const session = await signUpWithEmail(normalizedEmail, password, {
        fullName,
        zipCode,
      });

      if (!session) {
        setInfoMessage('Check your email to confirm your account, then sign in.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in right now.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    resetMessages();
    setIsGoogleSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      let message = error instanceof Error ? error.message : 'Google sign-in failed.';
      if (__DEV__) {
        message = `${message} Add this redirect URL in Supabase: ${getAuthRedirectUri()}`;
      }
      setErrorMessage(message);
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const isBusy = isSubmitting || isGoogleSubmitting;

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
            onPress={() => handleModeChange('signin')}
            style={[styles.modeTab, mode === 'signin' ? styles.modeTabActive : null]}
          >
            <Text style={[styles.modeTabText, mode === 'signin' ? styles.modeTabTextActive : null]}>
              Sign In
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => handleModeChange('signup')}
            style={[styles.modeTab, mode === 'signup' ? styles.modeTabActive : null]}
          >
            <Text style={[styles.modeTabText, mode === 'signup' ? styles.modeTabTextActive : null]}>
              Sign Up
            </Text>
          </Pressable>
        </View>

        {mode === 'signup' ? (
          <LabeledInput
            label="Full Name"
            placeholder="Jordan Lee"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        ) : null}
        <LabeledInput
          label="Email"
          placeholder="name@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <LabeledInput
          label="Password"
          placeholder="Enter password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {mode === 'signup' ? (
          <LabeledInput
            label="ZIP Code"
            placeholder="94103"
            value={zipCode}
            onChangeText={setZipCode}
            keyboardType="number-pad"
          />
        ) : null}

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {infoMessage ? <Text style={styles.infoText}>{infoMessage}</Text> : null}

        <Pressable
          style={[styles.primaryButton, isBusy ? styles.buttonDisabled : null]}
          onPress={handleSubmit}
          disabled={isBusy}
          accessibilityRole="button"
        >
          {isSubmitting ? (
            <ActivityIndicator color={T.white} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {mode === 'signin' ? 'Enter App' : 'Create Account'}
            </Text>
          )}
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          style={[styles.googleButton, isBusy ? styles.buttonDisabled : null]}
          onPress={handleGoogleSignIn}
          disabled={isBusy}
          accessibilityRole="button"
        >
          {isGoogleSubmitting ? (
            <ActivityIndicator color={T.ink} />
          ) : (
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          )}
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
  googleButton: {
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: T.white,
  },
  googleButtonText: {
    color: T.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: T.border,
  },
  dividerText: {
    color: T.ink3,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  errorText: {
    color: T.red,
    fontSize: 14,
    lineHeight: 20,
  },
  infoText: {
    color: T.green,
    fontSize: 14,
    lineHeight: 20,
  },
  footnote: {
    color: T.ink3,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
