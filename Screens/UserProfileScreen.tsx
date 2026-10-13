import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
} from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTheme } from '../hooks/useTheme';

type RouteParams = {
  UserProfile: {
    userId: string;
  };
};

export default function UserProfileScreen() {
  const route = useRoute<RouteProp<RouteParams, 'UserProfile'>>();
  const navigation = useNavigation<any>();
  const { userId } = route.params;
  const { colors } = useTheme();

  const [userData, setUserData] = useState<any>(null);
  const [userFangames, setUserFangames] = useState<any[]>([]);
  const [userTopics, setUserTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'fangames' | 'topics'>('fangames');

  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);

  const [listModalVisible, setListModalVisible] = useState(false);
  const [listType, setListType] = useState<'followers' | 'following'>('followers');

  const currentUserId = auth.currentUser?.uid;
  const isOwnProfile = userId === currentUserId;

  useEffect(() => {
    loadUserData();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const userRef = doc(db, 'users', userId);
    const unsub = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFollowers(data.followers || []);
        setFollowing(data.following || []);
        if (currentUserId && currentUserId !== userId) {
          setIsFollowing((data.followers || []).includes(currentUserId));
        }
      }
    });
    return () => unsub();
  }, [userId, currentUserId]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      } else {
        Alert.alert('Usuário não encontrado', 'Este usuário não está mais disponível.', [
          { text: 'Voltar', onPress: () => navigation.goBack() },
        ]);
        setLoading(false);
        return;
      }

      try {
        const fangamesQuery = query(collection(db, 'fangames'), where('userId', '==', userId));
        const fangamesSnapshot = await getDocs(fangamesQuery);
        setUserFangames(fangamesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (err) { setUserFangames([]); }

      try {
        const topicsQuery = query(collection(db, 'forumTopics'), where('userId', '==', userId));
        const topicsSnapshot = await getDocs(topicsQuery);
        setUserTopics(topicsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (err) { setUserTopics([]); }
    } catch (error) {
      console.error('❌ Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async () => {
    if (!currentUserId) return;
    if (currentUserId === userId) return;
    try {
      const currentUserRef = doc(db, 'users', currentUserId);
      const targetUserRef = doc(db, 'users', userId);
      if (isFollowing) {
        await updateDoc(currentUserRef, { following: arrayRemove(userId) });
        await updateDoc(targetUserRef, { followers: arrayRemove(currentUserId) });
        setIsFollowing(false);
      } else {
        await updateDoc(currentUserRef, { following: arrayUnion(userId) });
        await updateDoc(targetUserRef, { followers: arrayUnion(currentUserId) });
        setIsFollowing(true);
      }
    } catch (error) { console.error(error); }
  };

  const openList = (type: 'followers' | 'following') => {
    setListType(type);
    setListModalVisible(true);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Usuário não encontrado</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButtonContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderFangame = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.itemCard, { backgroundColor: colors.backgroundCard, borderColor: colors.cardBorder }]}
      onPress={() => navigation.navigate('FangameDetail', { fangameId: item.id })}
    >
      <Text style={[styles.itemTitle, { color: colors.text }]}>{item.nome}</Text>
      {item.descricao && (
        <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>{item.descricao}</Text>
      )}
      <View style={styles.itemFooter}>
        <Text style={[styles.itemCategory, { color: colors.primary, backgroundColor: colors.inputBackground }]}>
          {item.categoria}
        </Text>
        <View style={styles.itemStats}>
          <Ionicons name="heart-outline" size={14} color={colors.textMuted} />
          <Text style={[styles.itemStatText, { color: colors.textMuted }]}>{item.likes?.length || 0}</Text>
          <Ionicons name="chatbubble-outline" size={14} color={colors.textMuted} style={{ marginLeft: 8 }} />
          <Text style={[styles.itemStatText, { color: colors.textMuted }]}>{item.comentariosCount || 0}</Text>
          <Ionicons name="eye-outline" size={14} color={colors.textMuted} style={{ marginLeft: 8 }} />
          <Text style={[styles.itemStatText, { color: colors.textMuted }]}>{item.visualizacoes || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTopic = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.itemCard, { backgroundColor: colors.backgroundCard, borderColor: colors.cardBorder }, item.resolvido && { borderColor: colors.primary }]}
      onPress={() => navigation.navigate('ForumTopic', { topicId: item.id })}
    >
      <View style={styles.topicHeader}>
        <Text style={[styles.itemTitle, { color: colors.text }]}>{item.titulo}</Text>
        {item.resolvido && (
          <View style={[styles.resolvidoBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.resolvidoText}>✅</Text>
          </View>
        )}
      </View>
      <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>{item.conteudo}</Text>
      <View style={styles.itemFooter}>
        <Text style={[styles.itemCategory, { color: colors.primary, backgroundColor: colors.inputBackground }]}>
          {item.categoria}
        </Text>
        <View style={styles.itemStats}>
          <Ionicons name="heart-outline" size={14} color={colors.textMuted} />
          <Text style={[styles.itemStatText, { color: colors.textMuted }]}>{item.likes?.length || 0}</Text>
          <Ionicons name="chatbubble-outline" size={14} color={colors.textMuted} style={{ marginLeft: 8 }} />
          <Text style={[styles.itemStatText, { color: colors.textMuted }]}>{item.comentariosCount || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {userData.photoURL ? (
              <Image source={{ uri: userData.photoURL }} style={[styles.avatar, { borderColor: colors.primary }]} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.inputBackground, borderColor: colors.primary }]}>
                <Text style={[styles.avatarText, { color: colors.text }]}>
                  {userData.displayName?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.username, { color: colors.text }]}>@{userData.username || userData.displayName}</Text>
          <Text style={[styles.userEmail, { color: colors.textMuted }]}>{userData.email}</Text>

          {!isOwnProfile && (
            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowing
                  ? { backgroundColor: colors.inputBackground, borderColor: colors.border }
                  : { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={toggleFollow}
            >
              <Ionicons name={isFollowing ? 'checkmark' : 'person-add'} size={18} color={isFollowing ? colors.text : '#000'} />
              <Text style={[styles.followButtonText, { color: isFollowing ? colors.text : '#000' }]}>
                {isFollowing ? 'Seguindo' : 'Seguir'}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{userFangames.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Fangames</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{userTopics.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Tópicos</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.statItem} onPress={() => openList('followers')}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{followers.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Seguidores</Text>
            </TouchableOpacity>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.statItem} onPress={() => openList('following')}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{following.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Seguindo</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.tabsContainer, { backgroundColor: colors.inputBackground }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'fangames' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('fangames')}
          >
            <Text style={[styles.tabText, { color: colors.textMuted }, activeTab === 'fangames' && { color: '#000', fontWeight: 'bold' }]}>
              Fangames ({userFangames.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'topics' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('topics')}
          >
            <Text style={[styles.tabText, { color: colors.textMuted }, activeTab === 'topics' && { color: '#000', fontWeight: 'bold' }]}>
              Tópicos ({userTopics.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'fangames' ? (
          userFangames.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="game-controller-outline" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Nenhum fangame criado</Text>
            </View>
          ) : (
            <FlatList data={userFangames} keyExtractor={(item) => item.id} renderItem={renderFangame} scrollEnabled={false} contentContainerStyle={styles.listContent} />
          )
        ) : userTopics.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Nenhum tópico criado</Text>
          </View>
        ) : (
          <FlatList data={userTopics} keyExtractor={(item) => item.id} renderItem={renderTopic} scrollEnabled={false} contentContainerStyle={styles.listContent} />
        )}
      </ScrollView>

      <UsersListModal
        visible={listModalVisible}
        onClose={() => setListModalVisible(false)}
        userIds={listType === 'followers' ? followers : following}
        title={listType === 'followers' ? 'Seguidores' : 'Seguindo'}
        navigation={navigation}
      />
    </View>
  );
}

function UsersListModal({ visible, onClose, userIds, title, navigation }: any) {
  const { colors } = useTheme();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      if (!visible) return;
      setLoading(true);
      try {
        if (userIds.length === 0) { setUsers([]); setLoading(false); return; }
        const usersData: any[] = [];
        for (const id of userIds) {
          const userDoc = await getDoc(doc(db, 'users', id));
          if (userDoc.exists()) usersData.push({ id: userDoc.id, ...userDoc.data() });
        }
        setUsers(usersData);
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    };
    loadUsers();
  }, [visible, userIds.join(',')]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={28} color={colors.text} /></TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
          ) : users.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={60} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Nenhum usuário aqui</Text>
            </View>
          ) : (
            <ScrollView style={styles.usersList}>
              {users.map((user) => (
                <TouchableOpacity
                  key={user.id}
                  style={[styles.userItem, { backgroundColor: colors.inputBackground }]}
                  onPress={() => { onClose(); navigation.navigate('UserProfile', { userId: user.id }); }}
                >
                  {user.photoURL ? (
                    <Image source={{ uri: user.photoURL }} style={styles.userAvatar} />
                  ) : (
                    <View style={[styles.userAvatarPlaceholder, { backgroundColor: colors.backgroundCard }]}>
                      <Text style={[styles.userAvatarText, { color: colors.text }]}>
                        {user.displayName?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: colors.text }]}>@{user.username || user.displayName}</Text>
                    <Text style={[styles.userEmailSmall, { color: colors.textMuted }]}>{user.email}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  backButtonContainer: { padding: 12, borderRadius: 8, marginTop: 12 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { paddingBottom: 40 },
  profileHeader: { alignItems: 'center', paddingVertical: 30, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.2)' },
  avatarContainer: { marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 3 },
  avatarText: { fontSize: 32, fontWeight: 'bold' },
  username: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  userEmail: { fontSize: 14, marginBottom: 16 },
  followButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginBottom: 20 },
  followButtonText: { fontSize: 15, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, marginTop: 8 },
  statItem: { alignItems: 'center', flex: 1, paddingVertical: 4 },
  statNumber: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 30 },
  tabsContainer: { flexDirection: 'row', margin: 16, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '500' },
  listContent: { paddingHorizontal: 16 },
  itemCard: { borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1 },
  topicHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  resolvidoBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  resolvidoText: { fontSize: 12 },
  itemTitle: { fontSize: 16, fontWeight: 'bold' },
  itemDesc: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemCategory: { fontSize: 11, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  itemStats: { flexDirection: 'row', alignItems: 'center' },
  itemStatText: { fontSize: 12, marginLeft: 4 },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  errorText: { fontSize: 18, marginBottom: 16 },
  backText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%', minHeight: '50%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, paddingBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  usersList: { flex: 1 },
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 8 },
  userAvatar: { width: 45, height: 45, borderRadius: 22.5 },
  userAvatarPlaceholder: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  userAvatarText: { fontSize: 20, fontWeight: 'bold' },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 15, fontWeight: 'bold' },
  userEmailSmall: { fontSize: 12, marginTop: 2 },
});