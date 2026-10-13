import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebase';
import { useForumTopics, ForumTopic } from '../hooks/useForumTopics';
import { useForumTopicComments } from '../hooks/useForumTopicComments';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTheme } from '../hooks/useTheme';

type RouteParams = {
  ForumTopic: {
    topicId: string;
  };
};

export default function ForumTopicScreen() {
  const route = useRoute<RouteProp<RouteParams, 'ForumTopic'>>();
  const navigation = useNavigation<any>();
  const { topicId } = route.params;
  const { colors } = useTheme();
  const { toggleLike, deletarTopico, buscarTopico } = useForumTopics();
  const {
    comments,
    loading: commentsLoading,
    adicionarComentario,
    marcarComoSolucao,
    deletarComentario,
  } = useForumTopicComments(topicId);

  const [topico, setTopico] = useState<ForumTopic | null>(null);
  const [loadingTopic, setLoadingTopic] = useState(true);
  const [novoComentario, setNovoComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const loadTopic = async () => {
      setLoadingTopic(true);
      const topic = await buscarTopico(topicId);
      setTopico(topic);
      setLoadingTopic(false);
    };
    loadTopic();
  }, [topicId]);

  // 🔥 Recarregar tópico quando voltar da tela de edição
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      const topic = await buscarTopico(topicId);
      if (topic) setTopico(topic);
    });
    return unsubscribe;
  }, [navigation, topicId]);

  const handleAddComment = async () => {
    if (enviando) return;

    if (!auth.currentUser) {
      Alert.alert('Erro', 'Você precisa estar logado');
      return;
    }

    if (novoComentario.trim() === '') {
      Alert.alert('Erro', 'Digite um comentário');
      return;
    }

    setEnviando(true);
    const success = await adicionarComentario(novoComentario);
    setEnviando(false);

    if (success) {
      setNovoComentario('');
    }
  };

  const handleDeleteTopic = async () => {
    const success = await deletarTopico(topicId);
    if (success) {
      navigation.goBack();
    }
  };

  const handleEditTopic = () => {
    navigation.navigate('EditForumTopic', { topicId });
  };

  const handleMarkSolution = (commentId: string) => {
    if (topico) {
      marcarComoSolucao(commentId, topico.userId);
    }
  };

  if (loadingTopic) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!topico) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Tópico não encontrado</Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isTopicOwner = topico.userId === auth.currentUser?.uid;
  const isLiked = auth.currentUser && topico.likes?.includes(auth.currentUser.uid);
  const likesCount = topico.likes?.length || 0;
  const foiEditado = topico.updatedAt && topico.createdAt && 
    topico.updatedAt.toDate?.()?.getTime() !== topico.createdAt.toDate?.()?.getTime();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Cabeçalho */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Tópico</Text>
        <View style={styles.headerActions}>
          {/* 🔥 BOTÃO DE EDITAR */}
          {isTopicOwner && (
            <TouchableOpacity onPress={handleEditTopic} style={styles.iconBtn}>
              <Ionicons name="pencil" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
          {/* BOTÃO DE DELETAR */}
          {isTopicOwner && (
            <TouchableOpacity onPress={handleDeleteTopic} style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={22} color="#ff5252" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tópico */}
        <View style={[styles.topicCard, { backgroundColor: colors.backgroundCard, borderColor: colors.cardBorder }]}>
          <View style={styles.topicHeader}>
            <Text style={[styles.topicTitle, { color: colors.text }]}>{topico.titulo}</Text>
            <View style={[styles.categoriaBadge, { backgroundColor: colors.inputBackground }]}>
              <Text style={[styles.categoriaText, { color: colors.primary }]}>
                {topico.categoria.toUpperCase()}
              </Text>
            </View>
          </View>

          {topico.resolvido && (
            <View style={[styles.resolvidoContainer, { backgroundColor: '#1a2a2a', borderColor: colors.primary }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={[styles.resolvidoText, { color: colors.primary }]}>
                Este tópico foi resolvido
              </Text>
            </View>
          )}

          <Text style={[styles.topicContent, { color: colors.textSecondary }]}>
            {topico.conteudo}
          </Text>

          {foiEditado && (
            <View style={styles.editadoRow}>
              <Ionicons name="pencil-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.editadoText, { color: colors.textMuted }]}>
                Editado {formatDistanceToNow(topico.updatedAt.toDate(), { addSuffix: true, locale: ptBR })}
              </Text>
            </View>
          )}

          <View style={[styles.topicFooter, { borderTopColor: colors.border }]}>
            <View>
              <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: topico.userId })}>
                <Text style={[styles.userName, { color: colors.primary }]}>{topico.userEmail}</Text>
              </TouchableOpacity>
              <Text style={[styles.timeInfo, { color: colors.textMuted }]}>
                {formatDistanceToNow(topico.createdAt.toDate(), { addSuffix: true, locale: ptBR })}
              </Text>
            </View>
            <TouchableOpacity style={styles.likeBtn} onPress={() => toggleLike(topico.id)}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={24}
                color={isLiked ? '#ff5252' : colors.textMuted}
              />
              <Text style={[styles.likeCount, { color: colors.textMuted }]}>{likesCount}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Comentários */}
        <View style={styles.commentsSection}>
          <Text style={[styles.commentsTitle, { color: colors.text }]}>
            💬 {comments.length} comentário{comments.length !== 1 ? 's' : ''}
          </Text>

          {commentsLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : comments.length === 0 ? (
            <View style={styles.noComments}>
              <Text style={[styles.noCommentsText, { color: colors.textMuted }]}>Nenhum comentário ainda.</Text>
              <Text style={[styles.noCommentsSubtext, { color: colors.textMuted }]}>Seja o primeiro a comentar!</Text>
            </View>
          ) : (
            comments.map((comment) => {
              const isOwner = comment.userId === auth.currentUser?.uid;
              const isSolution = comment.resolvido;

              return (
                <View
                  key={comment.id}
                  style={[
                    styles.commentCard,
                    { backgroundColor: colors.backgroundCard, borderColor: colors.cardBorder },
                    isSolution && { borderColor: colors.primary, backgroundColor: '#1a2a2a' },
                  ]}
                >
                  <View style={styles.commentHeader}>
                    <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: comment.userId })}>
                      <Text style={[styles.commentUser, { color: colors.primary }]}>{comment.userEmail}</Text>
                    </TouchableOpacity>
                    <Text style={[styles.commentTime, { color: colors.textMuted }]}>
                      {formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true, locale: ptBR })}
                    </Text>
                  </View>

                  <Text style={[styles.commentText, { color: colors.text }]}>{comment.conteudo}</Text>

                  <View style={styles.commentActions}>
                    {isTopicOwner && !isSolution && !topico.resolvido && (
                      <TouchableOpacity style={styles.solutionBtn} onPress={() => handleMarkSolution(comment.id)}>
                        <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
                        <Text style={[styles.solutionBtnText, { color: colors.primary }]}>Marcar como solução</Text>
                      </TouchableOpacity>
                    )}

                    {isSolution && (
                      <View style={styles.solutionBadge}>
                        <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                        <Text style={[styles.solutionBadgeText, { color: colors.primary }]}>Solução ✓</Text>
                      </View>
                    )}

                    {isOwner && (
                      <TouchableOpacity style={styles.deleteCommentBtn} onPress={() => deletarComentario(comment.id)}>
                        <Ionicons name="trash-outline" size={18} color="#ff5252" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Input de comentário */}
      <View style={[styles.commentInputContainer, { backgroundColor: colors.backgroundCard, borderTopColor: colors.border }]}>
        <TextInput
          style={[
            styles.commentInput,
            { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border },
          ]}
          placeholder="Escreva um comentário..."
          placeholderTextColor={colors.textMuted}
          value={novoComentario}
          onChangeText={setNovoComentario}
          multiline
          maxLength={500}
          editable={!enviando}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!novoComentario.trim() || enviando) && styles.sendBtnDisabled]}
          onPress={handleAddComment}
          disabled={enviando || !novoComentario.trim()}
        >
          {enviando ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="send" size={24} color={novoComentario.trim() ? colors.primary : colors.textMuted} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 8 },
  content: { flex: 1, padding: 20 },
  topicCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 20 },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  topicTitle: { fontSize: 20, fontWeight: 'bold', flex: 1, marginRight: 10 },
  categoriaBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  categoriaText: { fontSize: 12, fontWeight: 'bold' },
  resolvidoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  resolvidoText: { fontSize: 14, fontWeight: 'bold', marginLeft: 8 },
  topicContent: { fontSize: 15, lineHeight: 22, marginBottom: 16 },
  editadoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  editadoText: { fontSize: 11, fontStyle: 'italic' },
  topicFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  userName: { fontSize: 13, fontWeight: 'bold', textDecorationLine: 'underline' },
  timeInfo: { fontSize: 11, marginTop: 2 },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8 },
  likeCount: { fontSize: 16, marginLeft: 4 },
  commentsSection: { marginTop: 10 },
  commentsTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  loader: { paddingVertical: 20 },
  noComments: { alignItems: 'center', paddingVertical: 30 },
  noCommentsText: { fontSize: 16 },
  noCommentsSubtext: { fontSize: 14, marginTop: 4 },
  commentCard: { borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  commentUser: { fontSize: 13, fontWeight: 'bold', textDecorationLine: 'underline' },
  commentTime: { fontSize: 11 },
  commentText: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  commentActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  solutionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  solutionBtnText: { fontSize: 13 },
  solutionBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  solutionBadgeText: { fontSize: 13, fontWeight: 'bold' },
  deleteCommentBtn: { padding: 4 },
  bottomSpacer: { height: 100 },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 80,
    marginRight: 10,
    borderWidth: 1,
  },
  sendBtn: { padding: 10 },
  sendBtnDisabled: { opacity: 0.5 },
  errorText: { fontSize: 18, marginBottom: 20 },
  backButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  backButtonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
});