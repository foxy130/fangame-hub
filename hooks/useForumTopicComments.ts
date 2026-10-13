import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { auth, db } from '../firebase';
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    doc,
    updateDoc,
    deleteDoc,
    arrayUnion,
    arrayRemove,
    increment,
    Timestamp,
} from 'firebase/firestore';

export interface ForumComment {
    id: string;
    conteudo: string;
    userId: string;
    userEmail: string;
    userPhoto: string | null;
    createdAt: Timestamp;
    likes: string[];
    resolvido: boolean;
}

export function useForumTopicComments(topicId: string) {
    const [comments, setComments] = useState<ForumComment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!topicId) {
            setLoading(false);
            return;
        }

        const commentsRef = collection(db, 'forumTopics', topicId, 'comments');
        const q = query(commentsRef, orderBy('createdAt', 'asc'));

        const unsub = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as ForumComment[];
            setComments(list);
            setLoading(false);
        }, (error) => {
            console.error('Erro ao carregar comentários:', error);
            setLoading(false);
        });

        return unsub;
    }, [topicId]);

    // Adicionar comentário
    const adicionarComentario = async (conteudo: string): Promise<boolean> => {
        if (!auth.currentUser) {
            Alert.alert('Erro', 'Você precisa estar logado');
            return false;
        }

        if (conteudo.trim() === '') {
            Alert.alert('Erro', 'Digite um comentário');
            return false;
        }

        try {
            const commentsRef = collection(db, 'forumTopics', topicId, 'comments');
            await addDoc(commentsRef, {
                conteudo: conteudo.trim(),
                userId: auth.currentUser.uid,
                userEmail: auth.currentUser.email || 'Usuário',
                userPhoto: null,
                createdAt: Timestamp.now(),
                likes: [],
                resolvido: false,
            });

            // Incrementar contador no tópico
            const topicRef = doc(db, 'forumTopics', topicId);
            await updateDoc(topicRef, {
                comentariosCount: increment(1),
                updatedAt: Timestamp.now(),
            });

            return true;
        } catch (error) {
            console.error('Erro ao adicionar comentário:', error);
            Alert.alert('Erro', 'Não foi possível adicionar o comentário');
            return false;
        }
    };

    // Marcar como solução (apenas o criador do tópico pode fazer)
    const marcarComoSolucao = async (commentId: string, topicUserId: string) => {
        if (!auth.currentUser) {
            Alert.alert('Erro', 'Você precisa estar logado');
            return;
        }

        if (auth.currentUser.uid !== topicUserId) {
            Alert.alert('Acesso negado', 'Apenas o criador do tópico pode marcar uma solução');
            return;
        }

        try {
            const commentRef = doc(db, 'forumTopics', topicId, 'comments', commentId);
            await updateDoc(commentRef, {
                resolvido: true,
            });

            // Marcar tópico como resolvido
            const topicRef = doc(db, 'forumTopics', topicId);
            await updateDoc(topicRef, {
                resolvido: true,
            });

            Alert.alert('Sucesso', 'Solução marcada!');
        } catch (error) {
            console.error('Erro ao marcar solução:', error);
            Alert.alert('Erro', 'Não foi possível marcar a solução');
        }
    };

    // Deletar comentário
    const deletarComentario = async (commentId: string) => {
        if (!auth.currentUser) return;

        Alert.alert(
            'Confirmar',
            'Tem certeza que deseja excluir este comentário?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'forumTopics', topicId, 'comments', commentId));

                            // Decrementar contador
                            const topicRef = doc(db, 'forumTopics', topicId);
                            await updateDoc(topicRef, {
                                comentariosCount: increment(-1),
                            });

                            Alert.alert('Sucesso', 'Comentário excluído');
                        } catch (error) {
                            console.error('Erro ao deletar comentário:', error);
                            Alert.alert('Erro', 'Não foi possível excluir o comentário');
                        }
                    },
                },
            ]
        );
    };

    return {
        comments,
        loading,
        adicionarComentario,
        marcarComoSolucao,
        deletarComentario,
    };
}