import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useForumTopics, TopicCategory } from '../hooks/useForumTopics';
import { auth } from '../firebase';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTheme } from '../hooks/useTheme';
import ThreeDotMenu from '../components/ThreeDotMenu';

const CATEGORIAS: { label: string; value: TopicCategory | ''; icon: string }[] = [
  { label: 'Todos', value: '', icon: 'apps' },
  { label: '💡 Dúvida', value: 'duvida', icon: 'help-circle' },
  { label: '🆘 Ajuda', value: 'ajuda', icon: 'medkit' },
  { label: '💬 Discussão', value: 'discussao', icon: 'chatbubbles' },
  { label: '💡 Ideia', value: 'ideia', icon: 'bulb' },
  { label: '📌 Geral', value: 'geral', icon: 'document-text' },
];

export default function ForumScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const {
    topics,
    loading,
    hasMore,
    carregarMais,
    toggleLike,
    deletarTopico,
    categoriaFiltro,
    setCategoriaFiltro,
    busca,
    setBusca,
  } = useForumTopics();

  const [refreshing, setRefreshing] = useState(false);

  const handleDeleteTopic = (topicId: string) => {
    deletarTopico(topicId);
  };

  const handleOpenUserProfile = (userId: string) => {
    if (!userId) return;
    navigation.navigate('UserProfile', { userId });
  };

  const renderTopic = ({ item }: { item: any }) => {
    const isOwn = item.userId === auth.currentUser?.uid;
    const likesCount = item.likes?.length || 0;
    const isLiked = auth.currentUser && item.likes?.includes(auth.currentUser.uid);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: colors.backgroundCard, borderColor: colors.cardBorder },
          item.resolvido && { borderColor: colors.primary, backgroundColor: '#1a2a2a' },
        ]}
        onPress={() => navigation.navigate('ForumTopic', { topicId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.categoriaBadge, { backgroundColor: colors.inputBackground }]}>
            <Text style={[styles.categoriaText, { color: colors.primary }]}>
              {item.categoria.toUpperCase()}
            </Text>
          </View>
          {item.resolvido && (
            <View style={[styles.resolvidoBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.resolvidoText}>✅ RESOLVIDO</Text>
            </View>
          )}
        </View>

        <Text style={[styles.cardTitle, { color: colors.text }]}>{item.titulo}</Text>
        <Text style={[styles.cardContent, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.conteudo}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.userInfo}>
            <TouchableOpacity onPress={() => handleOpenUserProfile(item.userId)}>
              <Text style={[styles.userName, { color: colors.primary }]}>
                {item.userEmail || 'Usuário'}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.timestamp, { color: colors.textMuted }]}>
              {item.createdAt?.toDate
                ? formatDistanceToNow(item.createdAt.toDate(), {
                    addSuffix: true,
                    locale: ptBR,
                  })
                : 'Agora'}
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => toggleLike(item.id)}
            >
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={20}
                color={isLiked ? '#ff5252' : colors.textMuted}
              />
              <Text style={[styles.actionText, { color: colors.textMuted }]}>{likesCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('ForumTopic', { topicId: item.id })}
            >
              <Ionicons name="chatbubble-outline" size={20} color={colors.textMuted} />
              <Text style={[styles.actionText, { color: colors.textMuted }]}>
                {item.comentariosCount || 0}
              </Text>
            </TouchableOpacity>

            {isOwn && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleDeleteTopic(item.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#ff5252" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const filteredTopics = topics.filter((t) => {
    const matchBusca =
      t.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      t.conteudo.toLowerCase().includes(busca.toLowerCase());
    const matchCategoria = categoriaFiltro === '' || t.categoria === categoriaFiltro;
    return matchBusca && matchCategoria;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Cabeçalho com 3 pontos */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>📚 Fórum</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.newTopicBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('CreateForumTopic')}
          >
            <Ionicons name="add" size={24} color="#000" />
          </TouchableOpacity>
          <ThreeDotMenu
            userId={auth.currentUser?.uid}
            userName={auth.currentUser?.email || 'Usuário'}
          />
        </View>
      </View>

      {/* Busca */}
      <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground }]}>
        <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar tópicos..."
          placeholderTextColor={colors.textMuted}
          value={busca}
          onChangeText={setBusca}
        />
      </View>

      {/* Filtros */}
      <FlatList
        horizontal
        data={CATEGORIAS}
        keyExtractor={(item) => item.value}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterBtn,
              { backgroundColor: colors.inputBackground },
              categoriaFiltro === item.value && { backgroundColor: colors.primary },
            ]}
            onPress={() => setCategoriaFiltro(item.value)}
          >
            <Text
              style={[
                styles.filterText,
                { color: colors.textMuted },
                categoriaFiltro === item.value && { color: '#000', fontWeight: 'bold' },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        showsHorizontalScrollIndicator={false}
        style={styles.filterList}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredTopics}
          keyExtractor={(item) => item.id}
          renderItem={renderTopic}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                setTimeout(() => setRefreshing(false), 1000);
              }}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.backgroundCard}
            />
          }
          onEndReached={carregarMais}
          onEndReachedThreshold={0.1}
          ListFooterComponent={
            hasMore && !loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : !hasMore && filteredTopics.length > 0 ? (
              <Text style={[styles.endText, { color: colors.textMuted }]}>
                Fim dos tópicos
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={60} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                Nenhum tópico encontrado
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                Seja o primeiro a iniciar uma discussão!
              </Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('CreateForumTopic')}
              >
                <Text style={styles.emptyBtnText}>Criar primeiro tópico</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: 40,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newTopicBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 15,
    marginTop: 15,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16 },
  filterList: { paddingHorizontal: 20, marginBottom: 15 },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  filterText: { fontSize: 13 },
  listContent: { padding: 20, paddingTop: 0 },
  card: { borderRadius: 16, padding: 16, marginBottom: 15, borderWidth: 1 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoriaBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  categoriaText: { fontSize: 11, fontWeight: 'bold' },
  resolvidoBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  resolvidoText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  cardContent: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 13, fontWeight: 'bold', textDecorationLine: 'underline' },
  timestamp: { fontSize: 11, marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  actionText: { fontSize: 13, marginLeft: 4 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  emptySubtext: { fontSize: 14, marginTop: 8, marginBottom: 20 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  endText: { textAlign: 'center', paddingVertical: 20, fontSize: 13 },
});