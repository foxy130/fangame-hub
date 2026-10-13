import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { auth, db } from '../firebase';
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';

export function useFollowers(userId?: string) {
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentUserId = auth.currentUser?.uid;
  const targetUserId = userId || currentUserId;

  // 🔥 Usar ref para evitar problemas com closures
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!targetUserId || !currentUserId) {
      setLoading(false);
      setFollowers([]);
      setFollowing([]);
      setIsFollowing(false);
      return;
    }

    setLoading(true);

    const targetUserRef = doc(db, 'users', targetUserId);
    const unsubTarget = onSnapshot(
      targetUserRef,
      (docSnap) => {
        // 🔥 Só atualiza se o componente ainda estiver montado
        if (!mountedRef.current) return;

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFollowing(Array.isArray(data.following) ? data.following : []);
          setFollowers(Array.isArray(data.followers) ? data.followers : []);

          if (currentUserId && currentUserId !== targetUserId) {
            const isFollowingNow = (data.followers || []).includes(currentUserId);
            setIsFollowing(isFollowingNow);
          }
        } else {
          setFollowers([]);
          setFollowing([]);
          setIsFollowing(false);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Erro no listener de seguidores:', error);
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    );

    return () => {
      unsubTarget();
    };
  }, [targetUserId, currentUserId]);

  const followUser = async (userIdToFollow: string) => {
    if (!currentUserId) {
      Alert.alert('Atenção', 'Faça login para seguir');
      return;
    }

    if (currentUserId === userIdToFollow) {
      Alert.alert('Atenção', 'Você não pode seguir a si mesmo');
      return;
    }

    try {
      const currentUserRef = doc(db, 'users', currentUserId);
      await updateDoc(currentUserRef, {
        following: arrayUnion(userIdToFollow),
      });

      const targetUserRef = doc(db, 'users', userIdToFollow);
      await updateDoc(targetUserRef, {
        followers: arrayUnion(currentUserId),
      });
    } catch (error) {
      console.error('Erro ao seguir:', error);
      Alert.alert('Erro', 'Não foi possível seguir');
    }
  };

  const unfollowUser = async (userIdToUnfollow: string) => {
    if (!currentUserId) return;

    try {
      const currentUserRef = doc(db, 'users', currentUserId);
      await updateDoc(currentUserRef, {
        following: arrayRemove(userIdToUnfollow),
      });

      const targetUserRef = doc(db, 'users', userIdToUnfollow);
      await updateDoc(targetUserRef, {
        followers: arrayRemove(currentUserId),
      });
    } catch (error) {
      console.error('Erro ao deixar de seguir:', error);
      Alert.alert('Erro', 'Não foi possível deixar de seguir');
    }
  };

  const toggleFollow = async (userIdToToggle: string) => {
    if (isFollowing) {
      await unfollowUser(userIdToToggle);
    } else {
      await followUser(userIdToToggle);
    }
  };

  return {
    followers,
    following,
    isFollowing,
    loading,
    followUser,
    unfollowUser,
    toggleFollow,
    followersCount: followers.length,
    followingCount: following.length,
  };
}