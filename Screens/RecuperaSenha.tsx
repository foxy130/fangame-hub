import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

export default function RecoverPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const recuperarSenha = async () => {
    if (loading || enviado) return;

    if (email === '') {
      Alert.alert('Atenção', 'Digite seu e-mail');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setEnviado(true);
      Alert.alert('Sucesso!', 'Link de recuperação enviado para seu e-mail');
    } catch (error: any) {
      Alert.alert('Erro', error.message);
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
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Recuperar Senha</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.logoContainer}>
          <View style={[styles.logoBox, { backgroundColor: colors.primary }]}>
            <Ionicons name="key-outline" size={40} color="#fff" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Esqueceu a senha?</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Digite seu e-mail e enviaremos um link para redefinir sua senha
          </Text>
        </View>

        <View
          style={[
            styles.formContainer,
            { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
          ]}
        >
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
              editable={!enviado && !loading}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.recoverButton,
              { backgroundColor: colors.primary },
              (loading || enviado) && styles.recoverButtonDisabled,
            ]}
            onPress={recuperarSenha}
            disabled={loading || enviado}
            activeOpacity={loading || enviado ? 1 : 0.7}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#000" size="small" />
                <Text style={styles.recoverButtonText}>Enviando...</Text>
              </View>
            ) : (
              <Text style={styles.recoverButtonText}>
                {enviado ? 'E-mail enviado ✓' : 'Enviar Link'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backToLoginButton}
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
          >
            <Text style={[styles.backToLoginText, { color: colors.primary }]}>
              Voltar para o login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoBox: { width: 80, height: 80, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  formContainer: { borderRadius: 20, padding: 24, borderWidth: 1 },
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
  recoverButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, minHeight: 54, justifyContent: 'center' },
  recoverButtonDisabled: { opacity: 0.6 },
  recoverButtonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backToLoginButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  backToLoginText: { fontSize: 14, fontWeight: '600' },
});