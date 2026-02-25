import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, useTheme } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { appColors, appTypography } from '../theme';
import { BrandLogo } from '../components/BrandLogo';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const theme = useTheme();
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!email || !password) { setError('Please fill in all fields'); return; }
        setLoading(true); setError('');
        const { error: err } = await signIn(email, password);
        if (err) setError(err);
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>
                <View style={styles.logoSection}>
                    <BrandLogo size={60} containerStyle={{ marginBottom: 20 }} />
                    <Text style={styles.appName}>LIFT LOG</Text>
                    <Text style={styles.tagline}>Track. Lift. Grow.</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Welcome Back</Text>

                    {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

                    <TextInput label="Email" value={email} onChangeText={setEmail} mode="outlined"
                        keyboardType="email-address" autoCapitalize="none"
                        style={styles.input} outlineStyle={styles.outline}
                        outlineColor={appColors.border} activeOutlineColor={appColors.accent}
                        textColor="#fff" />

                    <TextInput label="Password" value={password} onChangeText={setPassword} mode="outlined"
                        secureTextEntry={!showPassword}
                        right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword(!showPassword)} />}
                        style={styles.input} outlineStyle={styles.outline}
                        outlineColor={appColors.border} activeOutlineColor={appColors.accent}
                        textColor="#fff" />

                    <Button mode="contained" onPress={handleLogin} loading={loading} disabled={loading}
                        style={styles.btn} contentStyle={styles.btnInner} labelStyle={styles.btnLabel}
                        buttonColor={appColors.accent} textColor="#000">
                        Sign In
                    </Button>

                    <Button mode="text" onPress={() => navigation.navigate('Signup')}
                        textColor={appColors.accent} style={{ marginTop: 12 }}>
                        Don't have an account? Sign Up
                    </Button>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: appColors.bg },
    inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
    logoSection: { alignItems: 'center', marginBottom: 40 },
    logoIcon: { fontSize: 56 },
    appName: { ...appTypography.h1, fontSize: 28, color: '#fff', letterSpacing: 6, marginTop: 12 },
    tagline: { ...appTypography.body, fontSize: 14, color: appColors.textSecondary, marginTop: 6 },
    card: { backgroundColor: appColors.cardBg, borderRadius: 16, padding: 28, borderWidth: 1, borderColor: appColors.border },
    cardTitle: { ...appTypography.h1, color: '#fff', fontSize: 24, marginBottom: 24, textAlign: 'center' },
    errorBox: { backgroundColor: appColors.danger + '20', padding: 12, borderRadius: 8, marginBottom: 16 },
    errorText: { ...appTypography.small, color: appColors.danger, fontSize: 13 },
    input: { marginBottom: 14, backgroundColor: appColors.bg, height: 56 },
    outline: { borderRadius: 12 },
    btn: { borderRadius: 12, marginTop: 8 },
    btnInner: { height: 56 },
    btnLabel: { ...appTypography.h2, fontSize: 17, letterSpacing: 1 },
});
