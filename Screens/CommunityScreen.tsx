import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { auth } from '../firebase';
import { Ionicons } from '@expo/vector-icons';
import { useCommunityFangames } from '../hooks/useCommunityFangames';
import { CATEGORIAS } from '../hooks/useCreateFangame';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import ThreeDotMenu from '../components/ThreeDotMenu';

const CommunityScreen = () => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { 
    fangames, 
    loading, 
    categoriaFiltro, 
    setCategoriaFiltro, 
    ordenacao, 
    setOrdenacao,
    carregarMais,
    hasMore,
    recarregar,
  } = useCommunityFangames();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await recarregar();
    setRefreshing(false);
  };

  const renderFangame = ({ item }: { item: any }) => {
    const likes = item.likes || [];
    const dislikes = item.dislikes || [];
    const isLiked = auth.currentUser && likes.includes(auth.currentUser.uid);
    const isDisliked = auth.currentUser && dislikes.includes(auth.currentUser.uid);
    const comentariosCount = item.comentariosCount || 0;
    const visualizacoes = item.visualizacoes || 0;

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.cardBorder }]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('FangameDetail', { fangameId: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.nome}</Text>
          <View style={[styles.categoriaTagContainer, { backgroundColor: colors.inputBackground }]}>
            <Text style={[styles.categoriaTag, { color: colors.primary }]}>{item.categoria}</Text>
          </View>
        </View>
        
        {item.descricao ? (
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={3}>
            {item.descricao}
          </Text>
        ) : null}

        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.primary }]}>
            {item.userEmail || 'Usuário'}
          </Text>
          {item.createdAt && (
            <Text style={[styles.timestamp, { color: colors.textMuted }]}>
              {formatDistanceToNow(item.createdAt.toDate?.() || new Date(), {
                addSuffix: true,
                locale: ptBR,
              })}
            </Text>
          )}
        </View>

        {item.imagens && item.imagens.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
            {item.imagens.map((imgUrl: string, index: number) => (
              <Image 
                key={`${item.id}-img-${index}`} 
                source={{ uri: imgUrl }} 
                style={[styles.cardImage, { backgroundColor: colors.inputBackground }]} 
              />
            ))}
          </ScrollView>
        )}

        <View style={[styles.actions, { borderTopColor: colors.border }]}>
          <View style={styles.actionBtn}>
            <Ionicons 
              name={isLiked ? 'heart' : 'heart-outline'} 
              size={22} 
              color={isLiked ? '#ff5252' : colors.textMuted} 
            />
            <Text style={[styles.actionText, { color: colors.textMuted }]}>{likes.length}</Text>
          </View>

          <View style={styles.actionBtn}>
            <Ionicons 
              name={isDisliked ? 'thumbs-down' : 'thumbs-down-outline'} 
              size={22} 
              color={isDisliked ? '#ff5252' : colors.textMuted} 
            />
            <Text style={[styles.actionText, { color: colors.textMuted }]}>{dislikes.length}</Text>
          </View>

          <View style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={22} color={colors.textMuted} />
            <Text style={[styles.actionText, { color: colors.textMuted }]}>{comentariosCount}</Text>
          </View>

          <View style={styles.actionBtn}>
            <Ionicons name="eye-outline" size={22} color={colors.textMuted} />
            <Text style={[styles.actionText, { color: colors.textMuted }]}>{visualizacoes}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const hasData = fangames && fangames.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Comunidade</Text>
        <ThreeDotMenu 
          userId={auth.currentUser?.uid} 
          userName={auth.currentUser?.email || 'Usuário'} 
        />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[
              styles.filterBtn, 
              { backgroundColor: colors.inputBackground },
              categoriaFiltro === '' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setCategoriaFiltro('')}
          >
            <Text style={[
              styles.filterText, 
              { color: colors.textMuted },
              categoriaFiltro === '' && { color: '#000', fontWeight: 'bold' }
            ]}>
              Todos
            </Text>
          </TouchableOpacity>
          
          {CATEGORIAS.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterBtn, 
                { backgroundColor: colors.inputBackground },
                categoriaFiltro === cat && { backgroundColor: colors.primary }
              ]}
              onPress={() => setCategoriaFiltro(cat)}
            >
              <Text style={[
                styles.filterText, 
                { color: colors.textMuted },
                categoriaFiltro === cat && { color: '#000', fontWeight: 'bold' }
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <View style={styles.ordenacaoContainer}>
          <TouchableOpacity
            style={[
              styles.ordenacaoBtn, 
              { backgroundColor: colors.inputBackground },
              ordenacao === 'likes' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setOrdenacao('likes')}
          >
            <Ionicons name="heart-outline" size={16} color={ordenacao === 'likes' ? '#000' : colors.textMuted} />
            <Text style={[
              styles.ordenacaoText, 
              { color: colors.textMuted },
              ordenacao === 'likes' && { color: '#000', fontWeight: 'bold' }
            ]}>
              Likes
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.ordenacaoBtn, 
              { backgroundColor: colors.inputBackground },
              ordenacao === 'comentarios' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setOrdenacao('comentarios')}
          >
            <Ionicons name="chatbubble-outline" size={16} color={ordenacao === 'comentarios' ? '#000' : colors.textMuted} />
            <Text style={[
              styles.ordenacaoText, 
              { color: colors.textMuted },
              ordenacao === 'comentarios' && { color: '#000', fontWeight: 'bold' }
            ]}>
              Comentários
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.ordenacaoBtn, 
              { backgroundColor: colors.inputBackground },
              ordenacao === 'visualizacoes' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setOrdenacao('visualizacoes')}
          >
            <Ionicons name="eye-outline" size={16} color={ordenacao === 'visualizacoes' ? '#000' : colors.textMuted} />
            <Text style={[
              styles.ordenacaoText, 
              { color: colors.textMuted },
              ordenacao === 'visualizacoes' && { color: '#000', fontWeight: 'bold' }
            ]}>
              Views
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Carregando fangames...
          </Text>
        </View>
      ) : !hasData ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="game-controller-outline" size={60} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Nenhum fangame encontrado
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
            {categoriaFiltro 
              ? `Nenhum fangame na categoria "${categoriaFiltro}"` 
              : 'Seja o primeiro a criar um fangame!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={fangames}
          keyExtractor={(item) => item.id}
          renderItem={renderFangame}
          contentContainerStyle={styles.listContent}
          onEndReached={carregarMais}
          onEndReachedThreshold={0.1}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.backgroundCard}
            />
          }
          ListFooterComponent={
            hasMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.footerText, { color: colors.textMuted }]}>
                  Carregando mais...
                </Text>
              </View>
            ) : fangames.length > 0 ? (
              <Text style={[styles.endText, { color: colors.textMuted }]}>
                Fim da lista
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 10 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  filterContainer: { paddingHorizontal: 15, marginBottom: 15 },
  filterScroll: { flexGrow: 0, marginBottom: 10 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
  filterText: { fontSize: 14 },
  ordenacaoContainer: { flexDirection: 'row', justifyContent: 'space-around', gap: 10 },
  ordenacaoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8 },
  ordenacaoText: { fontSize: 13 },
  listContent: { paddingHorizontal: 15, paddingBottom: 20 },
  card: { borderRadius: 16, padding: 15, marginBottom: 15, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 19, fontWeight: 'bold', flex: 1 },
  categoriaTagContainer: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 8 },
  categoriaTag: { fontSize: 11, fontWeight: 'bold' },
  cardDesc: { marginBottom: 8, fontSize: 14, lineHeight: 20 },
  userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  userName: { fontSize: 13, fontWeight: 'bold', textDecorationLine: 'underline' },
  timestamp: { fontSize: 11 },
  imageRow: { marginBottom: 12, maxHeight: 140 },
  cardImage: { width: 130, height: 130, borderRadius: 12, marginRight: 10, resizeMode: 'cover' },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 5, paddingTop: 10, borderTopWidth: 1 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 5, gap: 4 },
  actionText: { marginLeft: 4, fontSize: 14, fontWeight: '500' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 14 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  emptySubtext: { fontSize: 14, textAlign: 'center', marginTop: 8 },
  footerLoader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 10 },
  footerText: { fontSize: 13 },
  endText: { textAlign: 'center', paddingVertical: 16, fontSize: 13 },
});

export default CommunityScreen;