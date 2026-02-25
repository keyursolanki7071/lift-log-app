import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { appColors, appTypography } from '../theme';
import { BrandLogo } from '../components/BrandLogo';

export const SignupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { signUp } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSignup = async () => {
        if (!email || !password || !confirm) { setError('Please fill in all fields'); return; }
        if (!validateEmail(email)) { setError('Please enter a valid email address'); return; }
        if (password !== confirm) { setError('Passwords do not match'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }

        setLoading(true); setError('');
        const { error: err } = await signUp(email, password);

        if (err) {
            const msg = err.message || '';
            if (msg.toLowerCase().includes('already registered')) {
                setError('This email is already associated with an account.');
            } else {
                setError(msg || 'Failed to sign up. Please try again.');
            }
            setLoading(false);
            return;
        }
        setLoading(false); setSuccess(true);
    };

    if (success) {
        return (
            <View style={styles.container}>
                <View style={styles.successWrap}>
                    <Text style={styles.successIcon}>✓</Text>
                    <Text style={styles.successTitle}>Account Created!</Text>
                    <Text style={styles.successSub}>Check your email to confirm, then sign in.</Text>
                    <Button mode="text" onPress={() => navigation.navigate('Login')} textColor={appColors.accent}>Go to Sign In</Button>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
                <View style={styles.headerSection}>
                    <BrandLogo size={52} containerStyle={{ marginBottom: 24 }} />
                    <Text style={styles.heading}>Create Account</Text>
                    <Text style={styles.sub}>Start tracking your lifts</Text>
                </View>

                <View style={styles.card}>
                    {error ? <View style={styles.errorBox}><Text style={{ color: appColors.danger, fontSize: 13, fontWeight: '700' }}>{error}</Text></View> : null}

                    <TextInput label="Email" value={email} onChangeText={setEmail} mode="outlined"
                        keyboardType="email-address" autoCapitalize="none"
                        style={styles.input} outlineStyle={styles.outline}
                        outlineColor={appColors.border} activeOutlineColor={appColors.accent} textColor="#fff" />

                    <TextInput label="Password" value={password} onChangeText={setPassword} mode="outlined"
                        secureTextEntry={!showPassword}
                        right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword(!showPassword)} />}
                        style={styles.input} outlineStyle={styles.outline}
                        outlineColor={appColors.border} activeOutlineColor={appColors.accent} textColor="#fff" />

                    <TextInput label="Confirm Password" value={confirm} onChangeText={setConfirm} mode="outlined"
                        secureTextEntry={!showPassword}
                        style={styles.input} outlineStyle={styles.outline}
                        outlineColor={appColors.border} activeOutlineColor={appColors.accent} textColor="#fff" />

                    <Button mode="contained" onPress={handleSignup} loading={loading} disabled={loading}
                        style={styles.btn} contentStyle={{ height: 56 }} labelStyle={{ fontWeight: '900', fontSize: 17, letterSpacing: 1 }}
                        buttonColor={appColors.accent} textColor="#000">Create Account</Button>

                    <Button mode="text" onPress={() => navigation.navigate('Login')} textColor={appColors.accent} style={{ marginTop: 12 }}>
                        Already have an account? Sign In
                    </Button>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: appColors.bg },
    inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
    headerSection: { alignItems: 'center', marginBottom: 28 },
    heading: { ...appTypography.h1, fontSize: 28, color: '#fff' },
    sub: { ...appTypography.body, fontSize: 14, color: appColors.textSecondary, marginTop: 6 },
    successWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    successIcon: { fontSize: 56, color: appColors.accent },
    successTitle: { ...appTypography.h1, fontSize: 24, color: '#fff', marginTop: 16 },
    successSub: { ...appTypography.body, color: appColors.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 20 },
    card: { backgroundColor: appColors.cardBg, borderRadius: 16, padding: 28, borderWidth: 1, borderColor: appColors.border },
    errorBox: { backgroundColor: appColors.danger + '20', padding: 12, borderRadius: 8, marginBottom: 16 },
    input: { marginBottom: 14, backgroundColor: appColors.bg, height: 56 },
    outline: { borderRadius: 12 },
    btn: { borderRadius: 12, marginTop: 8 },
});
