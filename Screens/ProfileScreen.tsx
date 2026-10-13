import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useProfileLogic } from '../hooks/useProfileLogic';
import { auth, db } from '../firebase';
import { useTheme } from '../hooks/useTheme';
import { doc, getDoc } from 'firebase/firestore';
import { useFollowers } from '../hooks/useFollowers';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const {
    username, setUsername,
    email, newEmail, setNewEmail,
    currentPassword, setCurrentPassword,
    newPassword, setNewPassword,
    confirmNewPassword, setConfirmNewPassword,
    photoURL,
    loading, salvando,
    editandoEmail, setEditandoEmail,
    editandoSenha, setEditandoSenha,
    atualizarPerfil, atualizarEmail, atualizarSenha,
    escolherImagem,
  } = useProfileLogic();

  const [editandoUsername, setEditandoUsername] = useState(false);

  const { followers, following, followersCount, followingCount } = useFollowers();

  const [listModalVisible, setListModalVisible] = useState(false);
  const [listType, setListType] = useState<'followers' | 'following'>('followers');

  const openList = (type: 'followers' | 'following') => {
    setListType(type);
    setListModalVisible(true);
  };

  const handleSalvarUsername = async () => {
    if (salvando) return;
    await atualizarPerfil();
    if (username.trim().length >= 3) {
      setEditandoUsername(false);
    }
  };

  const handleSalvarEmail = async () => {
    if (salvando) return;
    await atualizarEmail();
  };

  const handleSalvarSenha = async () => {
    if (salvando) return;
    await atualizarSenha();
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} disabled={salvando}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Meu Perfil</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.avatarContainer}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={() => {
              Alert.alert('Alterar Foto', 'Escolha uma opção', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Tirar Foto', onPress: () => escolherImagem('camera') },
                { text: 'Escolher da Galeria', onPress: () => escolherImagem('galeria') },
              ]);
            }}
            disabled={salvando}
          >
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={[styles.avatar, { borderColor: colors.primary }]} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.inputBackground, borderColor: colors.primary }]}>
                <Text style={[styles.avatarText, { color: colors.text }]}>
                  {username ? username.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
            <View style={[styles.avatarEditBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.avatarHint, { color: colors.textMuted }]}>Toque para alterar a foto</Text>
        </View>

        <View style={[styles.statsContainer, { backgroundColor: colors.backgroundCard, borderColor: colors.cardBorder }]}>
          <TouchableOpacity style={styles.statBox} onPress={() => openList('followers')}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{followersCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Seguidores</Text>
          </TouchableOpacity>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.statBox} onPress={() => openList('following')}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{followingCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Seguindo</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.formContainer, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          {/* Username */}
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Ionicons name="person-outline" size={20} color={colors.textMuted} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Nome de usuário</Text>
              {editandoUsername ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderBottomColor: colors.primary }]}
                    placeholder="Digite seu nome de usuário"
                    placeholderTextColor={colors.textMuted}
                    value={username}
                    onChangeText={setUsername}
                    maxLength={20}
                    autoCapitalize="none"
                    editable={!salvando}
                  />
                  <TouchableOpacity onPress={handleSalvarUsername} disabled={salvando}>
                    {salvando ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditandoUsername(false)} disabled={salvando}>
                    <Ionicons name="close-circle" size={28} color="#ff5252" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.editRow}>
                  <Text style={[styles.infoValue, { color: colors.text }]}>@{username}</Text>
                  <TouchableOpacity onPress={() => setEditandoUsername(true)}>
                    <Ionicons name="create-outline" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Email */}
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>E-mail</Text>
              {editandoEmail ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderBottomColor: colors.primary }]}
                    placeholder="Novo e-mail"
                    placeholderTextColor={colors.textMuted}
                    value={newEmail}
                    onChangeText={setNewEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!salvando}
                  />
                </View>
              ) : (
                <View style={styles.editRow}>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{email}</Text>
                  <TouchableOpacity onPress={() => setEditandoEmail(true)}>
                    <Ionicons name="create-outline" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {editandoEmail && (
            <View style={[styles.passwordSection, { borderTopColor: colors.border }]}>
              <Text style={[styles.passwordLabel, { color: colors.textMuted }]}>
                Digite sua senha atual para confirmar
              </Text>
              <TextInput
                style={[styles.passwordInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }]}
                placeholder="Senha atual"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                editable={!salvando}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.inputBackground }]}
                  onPress={() => { setEditandoEmail(false); setCurrentPassword(''); }}
                  disabled={salvando}
                >
                  <Text style={[styles.cancelModalText, { color: colors.text }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }, salvando && { opacity: 0.6 }]}
                  onPress={handleSalvarEmail}
                  disabled={salvando}
                >
                  {salvando ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <Text style={styles.saveModalText}>Salvar E-mail</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Senha */}
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Senha</Text>
              {editandoSenha ? (
                <View>
                  <TextInput
                    style={[styles.passwordInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }]}
                    placeholder="Senha atual"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    editable={!salvando}
                  />
                  <TextInput
                    style={[styles.passwordInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }]}
                    placeholder="Nova senha"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                    editable={!salvando}
                  />
                  <TextInput
                    style={[styles.passwordInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }]}
                    placeholder="Confirmar nova senha"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                    editable={!salvando}
                  />
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: colors.inputBackground }]}
                      onPress={() => {
                        setEditandoSenha(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmNewPassword('');
                      }}
                      disabled={salvando}
                    >
                      <Text style={[styles.cancelModalText, { color: colors.text }]}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: colors.primary }, salvando && { opacity: 0.6 }]}
                      onPress={handleSalvarSenha}
                      disabled={salvando}
                    >
                      {salvando ? (
                        <ActivityIndicator color="#000" size="small" />
                      ) : (
                        <Text style={styles.saveModalText}>Salvar Senha</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.editRow}>
                  <Text style={[styles.infoValue, { color: colors.text }]}>••••••••</Text>
                  <TouchableOpacity onPress={() => setEditandoSenha(true)}>
                    <Ionicons name="create-outline" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: '#ff5252' }]}
          onPress={() => {
            Alert.alert('Confirmar', 'Deseja realmente sair?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Sair', style: 'destructive', onPress: () => { auth.signOut(); navigation.navigate('Login' as never); } },
            ]);
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#ff5252" />
          <Text style={styles.logoutButtonText}>Sair da Conta</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>Fangame Hub v1.0</Text>
        </View>
      </ScrollView>

      <UsersListModal
        visible={listModalVisible}
        onClose={() => setListModalVisible(false)}
        userIds={listType === 'followers' ? followers : following}
        title={listType === 'followers' ? 'Seguidores' : 'Seguindo'}
        navigation={navigation}
      />
    </KeyboardAvoidingView>
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
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [visible, userIds.join(',')]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : users.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={60} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {title === 'Seguidores' ? 'Nenhum seguidor ainda' : 'Você não segue ninguém ainda'}
              </Text>
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
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  avatarContainer: { alignItems: 'center', marginBottom: 24 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 3 },
  avatarText: { fontSize: 40, fontWeight: 'bold' },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0a0a1a' },
  avatarHint: { fontSize: 12, marginTop: 8 },
  statsContainer: { flexDirection: 'row', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1 },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  statNumber: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 13, marginTop: 4 },
  statDivider: { width: 1, marginVertical: 8 },
  formContainer: { borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1 },
  infoContent: { flex: 1, marginLeft: 12 },
  infoLabel: { fontSize: 12, marginBottom: 2 },
  infoValue: { fontSize: 16, fontWeight: '500' },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, fontSize: 16, paddingVertical: 4, borderBottomWidth: 1 },
  passwordSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  passwordLabel: { fontSize: 13, marginBottom: 8 },
  passwordInput: { borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 10, borderWidth: 1 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  modalButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, minWidth: 100, alignItems: 'center' },
  cancelModalText: { fontSize: 14, fontWeight: '500' },
  saveModalText: { color: '#000', fontSize: 14, fontWeight: 'bold' },
  logoutButton: { flexDirection: 'row', paddingVertical: 14, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1, marginTop: 8 },
  logoutButtonText: { color: '#ff5252', fontSize: 16, fontWeight: '600' },
  footer: { marginTop: 24, alignItems: 'center' },
  footerText: { fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%', minHeight: '50%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, paddingBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  usersList: { flex: 1 },
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 8 },
  userAvatar: { width: 45, height: 45, borderRadius: 22.5 },
  userAvatarPlaceholder: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  userAvatarText: { fontSize: 20, fontWeight: 'bold' },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 15, fontWeight: 'bold' },
  userEmailSmall: { fontSize: 12, marginTop: 2 },
});