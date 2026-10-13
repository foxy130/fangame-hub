import React, { useState, useEffect } from 'react';
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
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useForumTopics, TopicCategory } from '../hooks/useForumTopics';
import { useTheme } from '../hooks/useTheme';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

type RouteParams = {
  EditForumTopic: {
    topicId: string;
  };
};

const CATEGORIAS: { label: string; value: TopicCategory; icon: string }[] = [
  { label: 'Dúvida', value: 'duvida', icon: '❓' },
  { label: 'Ajuda', value: 'ajuda', icon: '🆘' },
  { label: 'Discussão', value: 'discussao', icon: '💬' },
  { label: 'Ideia', value: 'ideia', icon: '💡' },
  { label: 'Geral', value: 'geral', icon: '📌' },
];

export default function EditForumTopicScreen() {
  const route = useRoute<RouteProp<RouteParams, 'EditForumTopic'>>();
  const navigation = useNavigation<any>();
  const { topicId } = route.params;
  const { colors } = useTheme();
  const { editarTopico } = useForumTopics();

  const [loading, setLoading] = useState(true);
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [categoria, setCategoria] = useState<TopicCategory>('geral');
  const [carregando, setCarregando] = useState(false);

  // Carregar dados do tópico
  useEffect(() => {
    const loadTopic = async () => {
      try {
        const topicDoc = await getDoc(doc(db, 'forumTopics', topicId));
        if (topicDoc.exists()) {
          const data = topicDoc.data();
          setTitulo(data.titulo || '');
          setConteudo(data.conteudo || '');
          setCategoria(data.categoria || 'geral');
        } else {
          Alert.alert('Erro', 'Tópico não encontrado');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Erro ao carregar tópico:', error);
        Alert.alert('Erro', 'Não foi possível carregar o tópico');
      } finally {
        setLoading(false);
      }
    };
    loadTopic();
  }, [topicId]);

  const handleSalvar = async () => {
    if (carregando) return;

    setCarregando(true);
    try {
      const success = await editarTopico(topicId, titulo, conteudo, categoria);
      if (success) {
        navigation.goBack();
      }
    } finally {
      setCarregando(false);
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Editar Tópico</Text>
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

        <View style={[styles.avisoBox, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={[styles.avisoText, { color: colors.textMuted }]}>
            A edição ficará visível para todos os usuários do fórum.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary }, carregando && styles.submitBtnDisabled]}
          onPress={handleSalvar}
          disabled={carregando}
          activeOpacity={carregando ? 1 : 0.7}
        >
          {carregando ? (
            <View style={styles.loadingContainerBtn}>
              <ActivityIndicator color="#000" size="small" />
              <Text style={styles.submitText}>Salvando...</Text>
            </View>
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#000" />
              <Text style={styles.submitText}>Salvar Alterações</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingContainerBtn: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  form: { gap: 15 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 5 },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: { minHeight: 150, textAlignVertical: 'top' },
  charCount: { fontSize: 12, textAlign: 'right', marginTop: 4 },
  categoriaList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoriaBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoriaText: { fontSize: 14 },
  avisoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
  },
  avisoText: { flex: 1, fontSize: 13 },
  submitBtn: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    minHeight: 54,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
});