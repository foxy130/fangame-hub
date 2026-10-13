import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase';
import { useTheme } from '../hooks/useTheme';

const TERMS_KEY = '@terms_accepted';

export default function TermsScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modoVisualizacao, setModoVisualizacao] = useState(false);

  // 🔥 Verifica se veio do menu
  const veioDoMenu = route?.params?.origem === 'menu';

  useEffect(() => {
    checkTermsStatus();
  }, []);

  const checkTermsStatus = async () => {
    try {
      // Se veio do menu, é modo visualização
      if (veioDoMenu) {
        setModoVisualizacao(true);
        setAccepted(true);
        setLoading(false);
        return;
      }

      // Se o usuário JÁ ESTÁ LOGADO, é modo visualização
      if (auth.currentUser) {
        setModoVisualizacao(true);
        setAccepted(true);
        setLoading(false);
        return;
      }

      // Se NÃO está logado, verifica se já aceitou anteriormente
      const accepted = await AsyncStorage.getItem(TERMS_KEY);
      if (accepted === 'true') {
        navigation.replace('Login');
      }
    } catch (error) {
      console.error('Erro ao verificar termos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!accepted) {
      Alert.alert('Atenção', 'Você precisa aceitar os termos para continuar');
      return;
    }

    try {
      await AsyncStorage.setItem(TERMS_KEY, 'true');
      navigation.replace('Login');
    } catch (error) {
      console.error('Erro ao salvar aceitação:', error);
      Alert.alert('Erro', 'Não foi possível salvar sua aceitação');
    }
  };

  // 🔥 CORRIGIDO: Verifica se pode voltar antes de chamar goBack
  const handleVoltar = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Se não pode voltar, vai para Home (logado) ou Login
      if (auth.currentUser) {
        navigation.navigate('Home');
      } else {
        navigation.navigate('Login');
      }
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.text === '#ffffff' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.backgroundSecondary}
      />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {modoVisualizacao && (
          <TouchableOpacity onPress={handleVoltar} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={[styles.headerTitle, { color: colors.text }]}>📋 Termos de Uso</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Leia atentamente antes de continuar
        </Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>1. Aceitação dos Termos</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            Ao criar uma conta e utilizar o Fangame Hub, você concorda com estes termos de uso.
            Se não concordar, não utilize o aplicativo.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>2. Conteúdo do Usuário</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            Você é responsável por todo o conteúdo que publicar, incluindo fangames,
            comentários e tópicos do fórum. Não publique conteúdo ilegal, ofensivo
            ou que viole direitos de terceiros.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>3. Propriedade Intelectual</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            Os fangames publicados permanecem de sua propriedade. Ao publicar, você
            concede ao Fangame Hub o direito de exibir e compartilhar seu conteúdo
            dentro da plataforma.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>4. Conduta do Usuário</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            • Seja respeitoso com outros usuários{'\n'}
            • Não faça spam ou publique conteúdo irrelevante{'\n'}
            • Não tente enganar ou manipular o sistema{'\n'}
            • Não compartilhe informações pessoais de terceiros
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>5. Privacidade</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            Suas informações são protegidas de acordo com nossa Política de Privacidade.
            Não compartilhamos seus dados com terceiros sem seu consentimento.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>6. Modificações</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            Estes termos podem ser atualizados periodicamente. Você será notificado
            sobre mudanças significativas.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>7. Contato</Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            Dúvidas? Entre em contato pelo e-mail: suporte@fangamehub.com
          </Text>
        </View>

        {/* Só mostra checkbox se NÃO estiver em modo visualização */}
        {!modoVisualizacao && (
          <View style={[styles.acceptContainer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAccepted(!accepted)}
            >
              <View
                style={[
                  styles.checkbox,
                  { borderColor: colors.textMuted },
                  accepted && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                {accepted && <Ionicons name="checkmark" size={18} color="#fff" />}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                Li e aceito os termos de uso
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        {!modoVisualizacao ? (
          <TouchableOpacity
            style={[styles.acceptButton, { backgroundColor: colors.primary }, !accepted && styles.acceptButtonDisabled]}
            onPress={handleAccept}
            disabled={!accepted}
          >
            <Text style={styles.acceptButtonText}>
              {accepted ? 'Continuar' : 'Aceite os termos para continuar'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.acceptButton, { backgroundColor: colors.primary }]}
            onPress={handleVoltar}
          >
            <Text style={styles.acceptButtonText}>Voltar</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 20,
    borderBottomWidth: 1,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  subtitle: { fontSize: 14, marginBottom: 20, textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  sectionText: { fontSize: 14, lineHeight: 22 },
  acceptContainer: { paddingVertical: 20, borderTopWidth: 1, marginBottom: 20 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxLabel: { fontSize: 15 },
  footer: { padding: 24, paddingBottom: 34, borderTopWidth: 1 },
  acceptButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  acceptButtonDisabled: { opacity: 0.5 },
  acceptButtonText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
});