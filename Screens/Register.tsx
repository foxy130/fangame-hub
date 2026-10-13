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
import { useRegisterLogic } from '../hooks/useRegisterLogic';
import { useTheme } from '../hooks/useTheme';

const { width } = Dimensions.get('window');

export default function Register() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const {
    username,
    setUsername,
    email,
    setEmail,
    senha,
    setSenha,
    confirmarSenha,
    setConfirmarSenha,
    loading,
    cadastrar,
  } = useRegisterLogic();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const logoImage = require('../assets/images/logo.png');

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Criar Conta</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={logoImage} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { color: colors.text }]}>Fangame Hub</Text>
          <Text style={[styles.appSubtitle, { color: colors.textMuted }]}>
            Junte-se à comunidade
          </Text>
        </View>

        {/* Formulário */}
        <View 
          style={[
            styles.formContainer, 
            { 
              backgroundColor: colors.backgroundSecondary, 
              borderColor: colors.border 
            }
          ]}
        >
          {/* Campo de Nome de Usuário */}
          <View 
            style={[
              styles.inputContainer, 
              { 
                backgroundColor: colors.inputBackground, 
                borderColor: colors.inputBorder 
              }
            ]}
          >
            <Ionicons 
              name="person-outline" 
              size={20} 
              color={colors.textMuted} 
              style={styles.inputIcon} 
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Nome de usuário"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              onChangeText={setUsername}
              value={username}
              maxLength={20}
              editable={!loading}
            />
          </View>
          <Text style={[styles.helperText, { color: colors.textMuted }]}>
            Mínimo 3 caracteres. Use letras, números e _
          </Text>

          {/* Campo de E-mail */}
          <View 
            style={[
              styles.inputContainer, 
              { 
                backgroundColor: colors.inputBackground, 
                borderColor: colors.inputBorder 
              }
            ]}
          >
            <Ionicons 
              name="mail-outline" 
              size={20} 
              color={colors.textMuted} 
              style={styles.inputIcon} 
            />
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

          {/* Campo de Senha */}
          <View 
            style={[
              styles.inputContainer, 
              { 
                backgroundColor: colors.inputBackground, 
                borderColor: colors.inputBorder 
              }
            ]}
          >
            <Ionicons 
              name="lock-closed-outline" 
              size={20} 
              color={colors.textMuted} 
              style={styles.inputIcon} 
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Senha"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              onChangeText={setSenha}
              value={senha}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={colors.textMuted}
                style={styles.eyeIcon}
              />
            </TouchableOpacity>
          </View>

          {/* Campo de Confirmação de Senha */}
          <View 
            style={[
              styles.inputContainer, 
              { 
                backgroundColor: colors.inputBackground, 
                borderColor: colors.inputBorder 
              }
            ]}
          >
            <Ionicons 
              name="lock-closed-outline" 
              size={20} 
              color={colors.textMuted} 
              style={styles.inputIcon} 
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Confirmar senha"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showConfirmPassword}
              onChangeText={setConfirmarSenha}
              value={confirmarSenha}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons
                name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={colors.textMuted}
                style={styles.eyeIcon}
              />
            </TouchableOpacity>
          </View>

          {/* Botão de Cadastro com Proteção */}
          <TouchableOpacity
            style={[
              styles.registerButton, 
              { backgroundColor: colors.primary },
              loading && styles.registerButtonDisabled
            ]}
            onPress={cadastrar}
            disabled={loading}
            activeOpacity={loading ? 1 : 0.7}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#000" size="small" />
                <Text style={styles.registerButtonText}>Criando conta...</Text>
              </View>
            ) : (
              <Text style={styles.registerButtonText}>Criar Conta</Text>
            )}
          </TouchableOpacity>

          {/* Divisor */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>ou</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Botão para Login */}
          <TouchableOpacity
            style={[styles.loginButton, { borderColor: colors.border }]}
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
          >
            <Text style={[styles.loginButtonText, { color: colors.text }]}>
              Já tenho uma conta
            </Text>
          </TouchableOpacity>
        </View>

        {/* Rodapé */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Ao criar uma conta, você concorda com os{' '}
            <Text style={[styles.footerLink, { color: colors.primary }]}>
              Termos de Uso
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoImage: {
    width: width * 0.25,
    height: width * 0.25,
    marginBottom: 12,
  },
  appName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  appSubtitle: {
    fontSize: 14,
  },
  formContainer: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 4,
  },
  helperText: {
    fontSize: 11,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  registerButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    justifyContent: 'center',
    minHeight: 54,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
  },
  loginButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
  footerLink: {
    fontWeight: 'bold',
  },
});