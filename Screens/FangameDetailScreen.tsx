import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTheme } from '../hooks/useTheme';
import { useFangameUpdates } from '../hooks/useFangameUpdates';
import { uploadImageToImgBB } from '../utils/uploadImage';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';

type RouteParams = {
  FangameDetail: {
    fangameId: string;
  };
};

export default function FangameDetailScreen() {
  const route = useRoute<RouteProp<RouteParams, 'FangameDetail'>>();
  const navigation = useNavigation<any>();
  const { fangameId } = route.params;
  const { colors } = useTheme();

  const [fangame, setFangame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'updates' | 'comments'>('updates');

  const {
    updates,
    loading: updatesLoading,
    criarUpdate,
    deletarUpdate,
    toggleLikeUpdate,
  } = useFangameUpdates(fangameId);

  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [curtindo, setCurtindo] = useState(false);

  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [newUpdateTitulo, setNewUpdateTitulo] = useState('');
  const [newUpdateConteudo, setNewUpdateConteudo] = useState('');
  const [newUpdateImagens, setNewUpdateImagens] = useState<string[]>([]);
  const [publicando, setPublicando] = useState(false);

  // 🔥 Incrementar visualização
  const incrementarVisualizacao = async (id: string) => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;

    try {
      const fangameRef = doc(db, 'fangames', id);
      const fangameDoc = await getDoc(fangameRef);

      if (!fangameDoc.exists()) return;

      const data = fangameDoc.data();
      const visualizacoesPorUsuario = data.visualizacoesPorUsuario || {};

      if (visualizacoesPorUsuario[userId]) return;

      await updateDoc(fangameRef, {
        visualizacoes: increment(1),
        [`visualizacoesPorUsuario.${userId}`]: true,
      });
    } catch (error) {
      console.error('Erro ao incrementar visualização:', error);
    }
  };

  useEffect(() => {
    const loadFangame = async () => {
      try {
        const fangameRef = doc(db, 'fangames', fangameId);
        const fangameDoc = await getDoc(fangameRef);

        if (fangameDoc.exists()) {
          setFangame({ id: fangameDoc.id, ...fangameDoc.data() });
          await incrementarVisualizacao(fangameId);
        } else {
          Alert.alert('Erro', 'Fangame não encontrado');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Erro ao carregar fangame:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFangame();
  }, [fangameId]);

  useEffect(() => {
    const fangameRef = doc(db, 'fangames', fangameId);
    const unsub = onSnapshot(fangameRef, (docSnap) => {
      if (docSnap.exists()) {
        setFangame({ id: docSnap.id, ...docSnap.data() });
      }
    });
    return unsub;
  }, [fangameId]);

  useEffect(() => {
    if (activeTab !== 'comments') return;

    setCommentsLoading(true);
    const commentsRef = collection(db, 'fangames', fangameId, 'comentarios');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setComments(list);
      setCommentsLoading(false);
    }, (error) => {
      console.error('Erro ao carregar comentários:', error);
      setCommentsLoading(false);
    });

    return unsub;
  }, [fangameId, activeTab]);

  const toggleLike = async () => {
    if (!auth.currentUser || !fangame || curtindo) return;
    const userId = auth.currentUser.uid;
    const fangameRef = doc(db, 'fangames', fangameId);
    const likes = fangame.likes || [];
    const dislikes = fangame.dislikes || [];

    setCurtindo(true);
    try {
      if (likes.includes(userId)) {
        await updateDoc(fangameRef, { likes: arrayRemove(userId) });
      } else {
        if (dislikes.includes(userId)) {
          await updateDoc(fangameRef, {
            dislikes: arrayRemove(userId),
            likes: arrayUnion(userId),
          });
        } else {
          await updateDoc(fangameRef, { likes: arrayUnion(userId) });
        }
      }
    } catch (error) {
      console.error('Erro ao curtir:', error);
    } finally {
      setCurtindo(false);
    }
  };

  const toggleDislike = async () => {
    if (!auth.currentUser || !fangame || curtindo) return;
    const userId = auth.currentUser.uid;
    const fangameRef = doc(db, 'fangames', fangameId);
    const likes = fangame.likes || [];
    const dislikes = fangame.dislikes || [];

    setCurtindo(true);
    try {
      if (dislikes.includes(userId)) {
        await updateDoc(fangameRef, { dislikes: arrayRemove(userId) });
      } else {
        if (likes.includes(userId)) {
          await updateDoc(fangameRef, {
            likes: arrayRemove(userId),
            dislikes: arrayUnion(userId),
          });
        } else {
          await updateDoc(fangameRef, { dislikes: arrayUnion(userId) });
        }
      }
    } catch (error) {
      console.error('Erro ao descurtir:', error);
    } finally {
      setCurtindo(false);
    }
  };

  const addComment = async () => {
    if (enviandoComentario) return;

    if (!commentText.trim()) {
      Alert.alert('Atenção', 'Digite um comentário');
      return;
    }
    if (!auth.currentUser) {
      Alert.alert('Atenção', 'Faça login para comentar');
      return;
    }

    setEnviandoComentario(true);
    try {
      const commentsRef = collection(db, 'fangames', fangameId, 'comentarios');
      await addDoc(commentsRef, {
        texto: commentText.trim(),
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email || 'Usuário',
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'fangames', fangameId), {
        comentariosCount: increment(1),
      });

      setCommentText('');
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      Alert.alert('Erro', 'Não foi possível comentar');
    } finally {
      setEnviandoComentario(false);
    }
  };

  const addUpdateImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permissão necessária', 'Precisa de permissão para acessar a galeria');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setNewUpdateImagens((prev) => [...prev, result.assets[0].base64!]);
      }
    } catch (error) {
      console.error('Erro ao adicionar imagem:', error);
    }
  };

  const publicarUpdate = async () => {
    if (publicando) return;

    if (!newUpdateTitulo.trim() || !newUpdateConteudo.trim()) {
      Alert.alert('Atenção', 'Preencha título e conteúdo');
      return;
    }

    setPublicando(true);
    try {
      const urls: string[] = [];
      for (const base64 of newUpdateImagens) {
        try {
          const url = await uploadImageToImgBB(base64);
          urls.push(url);
        } catch (err) {
          console.error('Erro ao fazer upload:', err);
        }
      }

      const success = await criarUpdate(newUpdateTitulo, newUpdateConteudo, urls);
      if (success) {
        setUpdateModalVisible(false);
        setNewUpdateTitulo('');
        setNewUpdateConteudo('');
        setNewUpdateImagens([]);
      }
    } finally {
      setPublicando(false);
    }
  };

  // 🔥 Copiar link para clipboard
  const copiarLink = async (url: string) => {
    try {
      await Clipboard.setStringAsync(url);
      Alert.alert('✅ Copiado!', 'O link foi copiado para a área de transferência.');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível copiar o link.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!fangame) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Fangame não encontrado</Text>
      </View>
    );
  }

  const isOwner = fangame.userId === auth.currentUser?.uid;
  const likes = fangame.likes || [];
  const dislikes = fangame.dislikes || [];
  const isLiked = auth.currentUser && likes.includes(auth.currentUser.uid);
  const isDisliked = auth.currentUser && dislikes.includes(auth.currentUser.uid);

  const temRequisitos =
    fangame.requisitos &&
    (fangame.requisitos.minimo?.os ||
      fangame.requisitos.minimo?.processador ||
      fangame.requisitos.minimo?.memoria ||
      fangame.requisitos.minimo?.armazenamento ||
      fangame.requisitos.recomendado?.os ||
      fangame.requisitos.recomendado?.processador ||
      fangame.requisitos.recomendado?.memoria ||
      fangame.requisitos.recomendado?.armazenamento);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {fangame.nome}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* CARD PRINCIPAL */}
        <View style={[styles.mainCard, { backgroundColor: colors.backgroundCard, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.fangameTitle, { color: colors.text }]}>{fangame.nome}</Text>
            <View style={[styles.categoriaTag, { backgroundColor: colors.inputBackground }]}>
              <Text style={[styles.categoriaText, { color: colors.primary }]}>{fangame.categoria}</Text>
            </View>
          </View>

          {fangame.descricao ? (
            <Text style={[styles.fangameDesc, { color: colors.textSecondary }]}>
              {fangame.descricao}
            </Text>
          ) : null}

          <TouchableOpacity
            style={styles.creatorRow}
            onPress={() => navigation.navigate('UserProfile', { userId: fangame.userId })}
          >
            <Ionicons name="person-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.creatorText, { color: colors.primary }]}>
              Criado por {fangame.userEmail || 'Usuário'}
            </Text>
          </TouchableOpacity>

          {fangame.imagens && fangame.imagens.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
              {fangame.imagens.map((imgUrl: string, index: number) => (
                <Image key={`${fangame.id}-img-${index}`} source={{ uri: imgUrl }} style={styles.fangameImage} />
              ))}
            </ScrollView>
          )}

          <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={styles.statBtn} onPress={toggleLike} disabled={curtindo}>
              <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={22} color={isLiked ? '#ff5252' : colors.textMuted} />
              <Text style={[styles.statText, { color: isLiked ? '#ff5252' : colors.textMuted }]}>{likes.length}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statBtn} onPress={toggleDislike} disabled={curtindo}>
              <Ionicons name={isDisliked ? 'thumbs-down' : 'thumbs-down-outline'} size={22} color={isDisliked ? '#ff5252' : colors.textMuted} />
              <Text style={[styles.statText, { color: isDisliked ? '#ff5252' : colors.textMuted }]}>{dislikes.length}</Text>
            </TouchableOpacity>

            <View style={styles.statBtn}>
              <Ionicons name="chatbubble-outline" size={22} color={colors.textMuted} />
              <Text style={[styles.statText, { color: colors.textMuted }]}>{fangame.comentariosCount || 0}</Text>
            </View>

            <View style={styles.statBtn}>
              <Ionicons name="eye-outline" size={22} color={colors.textMuted} />
              <Text style={[styles.statText, { color: colors.textMuted }]}>{fangame.visualizacoes || 0}</Text>
            </View>
          </View>
        </View>

        {/* LINKS DO FANGAME */}
        {fangame.links && fangame.links.length > 0 && (
          <View style={[styles.linksCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <View style={styles.linksHeader}>
              <Ionicons name="link-outline" size={24} color={colors.primary} />
              <Text style={[styles.linksTitle, { color: colors.text }]}>Links</Text>
            </View>

            {fangame.links.map((link: any, index: number) => (
              <View
                key={index}
                style={[styles.linkItem, { backgroundColor: colors.backgroundCard, borderColor: colors.cardBorder }]}
              >
                <View style={styles.linkInfo}>
                  <Text style={[styles.linkTitle, { color: colors.text }]} numberOfLines={1}>
                    {link.titulo}
                  </Text>
                  <Text style={[styles.linkUrl, { color: colors.textMuted }]} numberOfLines={1}>
                    {link.url}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.linkCopyBtn, { backgroundColor: colors.primary }]}
                  onPress={() => copiarLink(link.url)}
                >
                  <Ionicons name="copy-outline" size={18} color="#000" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* REQUISITOS DO SISTEMA (CELULAR) */}
        {temRequisitos && (
          <View style={[styles.requisitosCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <View style={styles.requisitosHeader}>
              <Ionicons name="phone-portrait-outline" size={24} color={colors.primary} />
              <Text style={[styles.requisitosTitle, { color: colors.text }]}>
                Requisitos para Celular
              </Text>
            </View>

            <View style={styles.requisitosColumns}>
              {/* Mínimos */}
              <View style={styles.requisitosColumn}>
                <View style={styles.requisitosColumnHeader}>
                  <Ionicons name="alert-circle-outline" size={18} color="#ff9800" />
                  <Text style={[styles.requisitosColumnTitle, { color: '#ff9800' }]}>
                    Mínimos
                  </Text>
                </View>

                {fangame.requisitos.minimo?.os ? (
                  <View style={styles.requisitoItem}>
                    <Text style={[styles.requisitoItemLabel, { color: colors.textMuted }]}>📱 Sistema</Text>
                    <Text style={[styles.requisitoItemValue, { color: colors.text }]}>
                      {fangame.requisitos.minimo.os}
                    </Text>
                  </View>
                ) : null}

                {fangame.requisitos.minimo?.processador ? (
                  <View style={styles.requisitoItem}>
                    <Text style={[styles.requisitoItemLabel, { color: colors.textMuted }]}>⚙️ Processador</Text>
                    <Text style={[styles.requisitoItemValue, { color: colors.text }]}>
                      {fangame.requisitos.minimo.processador}
                    </Text>
                  </View>
                ) : null}

                {fangame.requisitos.minimo?.memoria ? (
                  <View style={styles.requisitoItem}>
                    <Text style={[styles.requisitoItemLabel, { color: colors.textMuted }]}>🧠 RAM</Text>
                    <Text style={[styles.requisitoItemValue, { color: colors.text }]}>
                      {fangame.requisitos.minimo.memoria}
                    </Text>
                  </View>
                ) : null}

                {fangame.requisitos.minimo?.armazenamento ? (
                  <View style={styles.requisitoItem}>
                    <Text style={[styles.requisitoItemLabel, { color: colors.textMuted }]}>💾 Armazenamento</Text>
                    <Text style={[styles.requisitoItemValue, { color: colors.text }]}>
                      {fangame.requisitos.minimo.armazenamento}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Recomendados */}
              <View style={styles.requisitosColumn}>
                <View style={styles.requisitosColumnHeader}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#4caf50" />
                  <Text style={[styles.requisitosColumnTitle, { color: '#4caf50' }]}>
                    Recomendados
                  </Text>
                </View>

                {fangame.requisitos.recomendado?.os ? (
                  <View style={styles.requisitoItem}>
                    <Text style={[styles.requisitoItemLabel, { color: colors.textMuted }]}>📱 Sistema</Text>
                    <Text style={[styles.requisitoItemValue, { color: colors.text }]}>
                      {fangame.requisitos.recomendado.os}
                    </Text>
                  </View>
                ) : null}

                {fangame.requisitos.recomendado?.processador ? (
                  <View style={styles.requisitoItem}>
                    <Text style={[styles.requisitoItemLabel, { color: colors.textMuted }]}>⚙️ Processador</Text>
                    <Text style={[styles.requisitoItemValue, { color: colors.text }]}>
                      {fangame.requisitos.recomendado.processador}
                    </Text>
                  </View>
                ) : null}

                {fangame.requisitos.recomendado?.memoria ? (
                  <View style={styles.requisitoItem}>
                    <Text style={[styles.requisitoItemLabel, { color: colors.textMuted }]}>🧠 RAM</Text>
                    <Text style={[styles.requisitoItemValue, { color: colors.text }]}>
                      {fangame.requisitos.recomendado.memoria}
                    </Text>
                  </View>
                ) : null}

                {fangame.requisitos.recomendado?.armazenamento ? (
                  <View style={styles.requisitoItem}>
                    <Text style={[styles.requisitoItemLabel, { color: colors.textMuted }]}>💾 Armazenamento</Text>
                    <Text style={[styles.requisitoItemValue, { color: colors.text }]}>
                      {fangame.requisitos.recomendado.armazenamento}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        )}

        {/* TABS */}
        <View style={[styles.tabsContainer, { backgroundColor: colors.inputBackground }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'updates' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('updates')}
          >
            <Text style={[styles.tabText, { color: colors.textMuted }, activeTab === 'updates' && { color: '#000', fontWeight: 'bold' }]}>
              📢 Atualizações ({updates.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'comments' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('comments')}
          >
            <Text style={[styles.tabText, { color: colors.textMuted }, activeTab === 'comments' && { color: '#000', fontWeight: 'bold' }]}>
              💬 Comentários ({fangame.comentariosCount || 0})
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB UPDATES */}
        {activeTab === 'updates' && (
          <View>
            {isOwner && (
              <TouchableOpacity
                style={[styles.addUpdateBtn, { backgroundColor: colors.primary }]}
                onPress={() => setUpdateModalVisible(true)}
              >
                <Ionicons name="add-circle" size={20} color="#000" />
                <Text style={styles.addUpdateBtnText}>Publicar Atualização</Text>
              </TouchableOpacity>
            )}

            {updatesLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : updates.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="megaphone-outline" size={60} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  Nenhuma atualização ainda
                </Text>
              </View>
            ) : (
              updates.map((update) => (
                <View
                  key={update.id}
                  style={[styles.updateCard, { backgroundColor: colors.backgroundCard, borderColor: colors.cardBorder }]}
                >
                  <View style={styles.updateHeader}>
                    <Text style={[styles.updateTitle, { color: colors.text }]}>{update.titulo}</Text>
                    {isOwner && (
                      <TouchableOpacity onPress={() => deletarUpdate(update.id)}>
                        <Ionicons name="trash-outline" size={20} color="#ff5252" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text style={[styles.updateContent, { color: colors.textSecondary }]}>
                    {update.conteudo}
                  </Text>

                  {update.imagens && update.imagens.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.updateImageRow}>
                      {update.imagens.map((url: string, i: number) => (
                        <Image key={i} source={{ uri: url }} style={styles.updateImage} />
                      ))}
                    </ScrollView>
                  )}

                  <View style={styles.updateFooter}>
                    <Text style={[styles.updateTime, { color: colors.textMuted }]}>
                      {update.createdAt?.toDate
                        ? formatDistanceToNow(update.createdAt.toDate(), { addSuffix: true, locale: ptBR })
                        : 'Agora'}
                    </Text>

                    <TouchableOpacity
                      style={styles.updateLikeBtn}
                      onPress={() => toggleLikeUpdate(update.id, update.likes || [])}
                    >
                      <Ionicons
                        name={update.likes?.includes(auth.currentUser?.uid || '') ? 'heart' : 'heart-outline'}
                        size={18}
                        color={update.likes?.includes(auth.currentUser?.uid || '') ? '#ff5252' : colors.textMuted}
                      />
                      <Text style={[styles.updateLikeText, { color: colors.textMuted }]}>
                        {update.likes?.length || 0}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB COMMENTS */}
        {activeTab === 'comments' && (
          <View>
            {commentsLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : comments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={60} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  Nenhum comentário ainda
                </Text>
              </View>
            ) : (
              comments.map((comment) => (
                <View
                  key={comment.id}
                  style={[styles.commentCard, { backgroundColor: colors.backgroundCard, borderColor: colors.cardBorder }]}
                >
                  <View style={styles.commentHeader}>
                    <Text style={[styles.commentUser, { color: colors.primary }]}>
                      {comment.userEmail || 'Usuário'}
                    </Text>
                    <Text style={[styles.commentTime, { color: colors.textMuted }]}>
                      {comment.createdAt?.toDate
                        ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true, locale: ptBR })
                        : 'Agora'}
                    </Text>
                  </View>
                  <Text style={[styles.commentText, { color: colors.text }]}>{comment.texto}</Text>
                </View>
              ))
            )}

            <View style={[styles.commentInputRow, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
              <TextInput
                style={[styles.commentInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                placeholder="Digite seu comentário..."
                placeholderTextColor={colors.textMuted}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
                editable={!enviandoComentario}
              />
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: colors.primary }, (!commentText.trim() || enviandoComentario) && styles.sendBtnDisabled]}
                onPress={addComment}
                disabled={!commentText.trim() || enviandoComentario}
              >
                {enviandoComentario ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Ionicons name="send" size={20} color="#000" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL DE UPDATE */}
      <Modal visible={updateModalVisible} animationType="slide" transparent onRequestClose={() => !publicando && setUpdateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>📢 Nova Atualização</Text>
              <TouchableOpacity onPress={() => setUpdateModalVisible(false)} disabled={publicando}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Título *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }]}
                placeholder="Título da atualização"
                placeholderTextColor={colors.textMuted}
                value={newUpdateTitulo}
                onChangeText={setNewUpdateTitulo}
                editable={!publicando}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Conteúdo *</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.inputBorder }]}
                placeholder="Descreva o que mudou..."
                placeholderTextColor={colors.textMuted}
                value={newUpdateConteudo}
                onChangeText={setNewUpdateConteudo}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                editable={!publicando}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Imagens</Text>
              <View style={styles.updateImagesRow}>
                {newUpdateImagens.map((base64, i) => (
                  <View key={i} style={styles.updateImagePreview}>
                    <Image source={{ uri: `data:image/jpeg;base64,${base64}` }} style={styles.updateImageSmall} />
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      onPress={() => setNewUpdateImagens((prev) => prev.filter((_, idx) => idx !== i))}
                      disabled={publicando}
                    >
                      <Ionicons name="close-circle" size={22} color="#ff5252" />
                    </TouchableOpacity>
                  </View>
                ))}
                {newUpdateImagens.length < 3 && (
                  <TouchableOpacity
                    style={[styles.addImageBtn, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                    onPress={addUpdateImage}
                    disabled={publicando}
                  >
                    <Ionicons name="camera" size={28} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { backgroundColor: colors.inputBackground }]}
                  onPress={() => setUpdateModalVisible(false)}
                  disabled={publicando}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.publishBtn, { backgroundColor: colors.primary }, publicando && { opacity: 0.6 }]}
                  onPress={publicarUpdate}
                  disabled={publicando}
                >
                  {publicando ? (
                    <View style={styles.loadingContainerBtn}>
                      <ActivityIndicator color="#000" size="small" />
                      <Text style={styles.publishBtnText}>Publicando...</Text>
                    </View>
                  ) : (
                    <Text style={styles.publishBtnText}>Publicar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingContainerBtn: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  content: { padding: 16 },

  // CARD PRINCIPAL
  mainCard: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  fangameTitle: { fontSize: 22, fontWeight: 'bold', flex: 1 },
  categoriaTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 8 },
  categoriaText: { fontSize: 12, fontWeight: 'bold' },
  fangameDesc: { fontSize: 15, lineHeight: 22, marginBottom: 12 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  creatorText: { fontSize: 13, fontWeight: 'bold', textDecorationLine: 'underline' },
  imageRow: { marginBottom: 12, maxHeight: 200 },
  fangameImage: { width: 200, height: 200, borderRadius: 12, marginRight: 10, resizeMode: 'cover' },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    marginTop: 8,
  },
  statBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  statText: { fontSize: 15, fontWeight: '600' },

  // 🔥 LINKS
  linksCard: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1 },
  linksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  linksTitle: { fontSize: 18, fontWeight: 'bold' },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    gap: 10,
  },
  linkInfo: { flex: 1 },
  linkTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  linkUrl: { fontSize: 12 },
  linkCopyBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 🔥 REQUISITOS (CELULAR)
  requisitosCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  requisitosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  requisitosTitle: { fontSize: 18, fontWeight: 'bold' },
  requisitosColumns: { flexDirection: 'row', gap: 12 },
  requisitosColumn: { flex: 1 },
  requisitosColumnHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  requisitosColumnTitle: { fontSize: 14, fontWeight: 'bold' },
  requisitoItem: { marginBottom: 10 },
  requisitoItemLabel: { fontSize: 11, marginBottom: 2 },
  requisitoItemValue: { fontSize: 13, fontWeight: '500' },

  // TABS
  tabsContainer: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabText: { fontSize: 13, fontWeight: '500' },

  // UPDATES
  addUpdateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  addUpdateBtnText: { fontSize: 15, fontWeight: 'bold', color: '#000' },
  updateCard: { borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1 },
  updateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  updateTitle: { fontSize: 17, fontWeight: 'bold', flex: 1 },
  updateContent: { fontSize: 14, lineHeight: 20, marginBottom: 10 },
  updateImageRow: { marginBottom: 10, maxHeight: 150 },
  updateImage: { width: 150, height: 150, borderRadius: 8, marginRight: 8, resizeMode: 'cover' },
  updateFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  updateTime: { fontSize: 11 },
  updateLikeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  updateLikeText: { fontSize: 13 },

  // COMENTÁRIOS
  commentCard: { borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  commentUser: { fontSize: 13, fontWeight: 'bold' },
  commentTime: { fontSize: 11 },
  commentText: { fontSize: 14, lineHeight: 20 },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    gap: 8,
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 80,
    borderWidth: 1,
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.5 },

  // EMPTY
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, marginTop: 8, textAlign: 'center' },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  inputLabel: { fontSize: 14, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  input: { borderRadius: 10, padding: 12, fontSize: 15, borderWidth: 1 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  updateImagesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  updateImagePreview: { position: 'relative' },
  updateImageSmall: { width: 70, height: 70, borderRadius: 8 },
  removeImageBtn: { position: 'absolute', top: -8, right: -8, backgroundColor: '#fff', borderRadius: 12 },
  addImageBtn: {
    width: 70,
    height: 70,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600' },
  publishBtn: { flex: 2, paddingVertical: 12, borderRadius: 10, alignItems: 'center', minHeight: 46, justifyContent: 'center' },
  publishBtnText: { fontSize: 15, fontWeight: 'bold', color: '#000' },
});