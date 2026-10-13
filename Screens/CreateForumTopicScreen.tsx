import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useForumTopics, TopicCategory } from '../hooks/useForumTopics';
import { useTheme } from '../hooks/useTheme';

const CATEGORIAS: { label: string; value: TopicCategory; icon: string }[] = [
  { label: 'Dúvida', value: 'duvida', icon: '❓' },
  { label: 'Ajuda', value: 'ajuda', icon: '🆘' },
  { label: 'Discussão', value: 'discussao', icon: '💬' },
  { label: 'Ideia', value: 'ideia', icon: '💡' },
  { label: 'Geral', value: 'geral', icon: '📌' },
];

export default function CreateForumTopicScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { criarTopico } = useForumTopics();

  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [categoria, setCategoria] = useState<TopicCategory>('geral');
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async () => {
    if (carregando) return;

    if (titulo.trim() === '') {
      Alert.alert('Erro', 'Digite um título para o tópico');
      return;
    }
    if (titulo.length < 5) {
      Alert.alert('Erro', 'O título deve ter pelo menos 5 caracteres');
      return;
    }
    if (conteudo.trim() === '') {
      Alert.alert('Erro', 'Digite o conteúdo do tópico');
      return;
    }
    if (conteudo.length < 10) {
      Alert.alert('Erro', 'O conteúdo deve ter pelo menos 10 caracteres');
      return;
    }

    setCarregando(true);
    try {
      const success = await criarTopico(titulo, conteudo, categoria);
      if (success) {
        navigation.goBack();
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          disabled={carregando}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Novo Tópico</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Título *</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder },
          ]}
          placeholder="Digite um título descritivo"
          placeholderTextColor={colors.textMuted}
          value={titulo}
          onChangeText={setTitulo}
          maxLength={100}
          editable={!carregando}
        />
        <Text style={[styles.charCount, { color: colors.textMuted }]}>{titulo.length}/100</Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Categoria *</Text>
        <View style={styles.categoriaList}>
          {CATEGORIAS.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.categoriaBtn,
                { backgroundColor: colors.inputBackground },
                categoria === cat.value && { backgroundColor: colors.primary },
              ]}
              onPress={() => setCategoria(cat.value)}
              disabled={carregando}
            >
              <Text
                style={[
                  styles.categoriaText,
                  { color: colors.textMuted },
                  categoria === cat.value && { color: '#000', fontWeight: 'bold' },
                ]}
              >
                {cat.icon} {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Conteúdo *</Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder },
          ]}
          placeholder="Descreva sua dúvida, ideia ou discussão em detalhes..."
          placeholderTextColor={colors.textMuted}
          value={conteudo}
          onChangeText={setConteudo}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
          editable={!carregando}
        />
        <Text style={[styles.charCount, { color: colors.textMuted }]}>{conteudo.length} caracteres</Text>

        <View style={[styles.tipsContainer, { backgroundColor: colors.inputBackground }]}>
          <Text style={[styles.tipsTitle, { color: colors.text }]}>💡 Dicas para um bom tópico:</Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            • Seja claro e específico no título
          </Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            • Descreva detalhadamente sua situação
          </Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            • Adicione exemplos ou prints se necessário
          </Text>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            • Escolha a categoria correta
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: colors.primary },
            carregando && styles.submitBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={carregando}
          activeOpacity={carregando ? 1 : 0.7}
        >
          {carregando ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#000" size="small" />
              <Text style={styles.submitText}>Publicando...</Text>
            </View>
          ) : (
            <Text style={styles.submitText}>Publicar Tópico</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, paddingTop: 20 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  form: { gap: 15 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 5 },
  input: { borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1 },
  textArea: { minHeight: 150, textAlignVertical: 'top' },
  charCount: { fontSize: 12, textAlign: 'right', marginTop: 4 },
  categoriaList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoriaBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
  categoriaText: { fontSize: 14 },
  tipsContainer: { borderRadius: 12, padding: 16, marginTop: 10 },
  tipsTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  tipText: { fontSize: 13, marginBottom: 4, paddingLeft: 4 },
  submitBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20, minHeight: 54, justifyContent: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});