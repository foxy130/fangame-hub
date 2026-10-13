import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useLoginLogic } from '../hooks/useLoginLogic';
import { useTheme } from '../hooks/useTheme';

const { width } = Dimensions.get('window');

export default function Login() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { email, setEmail, senha, setSenha, logar } = useLoginLogic();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const logoImage = require('../assets/images/logo.png');

  const handleLogin = async () => {
    if (loading) return;

    if (!email || !senha) {
      Alert.alert('Atenção', 'Preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      await logar();
    } catch (error) {
      console.error('Erro no login:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
          <Text style={[styles.appName, { color: colors.text }]}>Fangame Hub</Text>
          <Text style={[styles.appSubtitle, { color: colors.textMuted }]}>
            Crie, compartilhe e descubra fangames
          </Text>
        </View>

        <View
          style={[
            styles.formContainer,
            { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.welcomeText, { color: colors.text }]}>Bem-vindo de volta!</Text>
          <Text style={[styles.welcomeSubtext, { color: colors.textMuted }]}>
            Faça login para continuar
          </Text>

          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
            ]}
          >
            <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="E-mail"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              value={email}
              editable={!loading}
            />
          </View>

          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
            ]}
          >
            <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Senha"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              onChangeText={setSenha}
              value={senha}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={loading}>
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={colors.textMuted}
                style={styles.eyeIcon}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('RecuperaSenha')}
            disabled={loading}
          >
            <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
              Esqueceu a senha?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.loginButton,
              { backgroundColor: colors.primary },
              loading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={loading ? 1 : 0.7}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#000" size="small" />
                <Text style={styles.loginButtonText}>Entrando...</Text>
              </View>
            ) : (
              <Text style={styles.loginButtonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>ou</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.registerButton, { borderColor: colors.border }]}
            onPress={() => navigation.navigate('Register')}
            disabled={loading}
          >
            <Text style={[styles.registerButtonText, { color: colors.text }]}>
              Criar nova conta
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Ao continuar, você concorda com os{' '}
            <Text style={[styles.footerLink, { color: colors.primary }]}>Termos de Uso</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoImage: { width: width * 0.35, height: width * 0.35, marginBottom: 16 },
  appName: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  appSubtitle: { fontSize: 14 },
  formContainer: { borderRadius: 20, padding: 24, borderWidth: 1 },
  welcomeText: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  welcomeSubtext: { fontSize: 14, marginBottom: 24 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16 },
  eyeIcon: { padding: 4 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotPasswordText: { fontSize: 14 },
  loginButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', minHeight: 54, justifyContent: 'center' },
  loginButtonDisabled: { opacity: 0.6 },
  loginButtonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { paddingHorizontal: 16, fontSize: 14 },
  registerButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  registerButtonText: { fontSize: 16, fontWeight: '600' },
  footer: { marginTop: 24, alignItems: 'center' },
  footerText: { fontSize: 12, textAlign: 'center' },
  footerLink: { fontWeight: 'bold' },
});