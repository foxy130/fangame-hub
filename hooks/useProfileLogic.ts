import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { auth, db } from '../firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  setDoc 
} from 'firebase/firestore';
import { 
  updateEmail, 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToImgBB } from '../utils/uploadImage';

export function useProfileLogic() {
  const [userData, setUserData] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [editandoEmail, setEditandoEmail] = useState(false);
  const [editandoSenha, setEditandoSenha] = useState(false);

  const userId = auth.currentUser?.uid;
  const user = auth.currentUser;

  // Carregar dados do usuário
  useEffect(() => {
    if (!userId) return;

    const loadUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setUsername(data.username || '');
          setEmail(data.email || auth.currentUser?.email || '');
          setNewEmail(data.email || auth.currentUser?.email || '');
          setPhotoURL(data.photoURL || null);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [userId]);

  // Verificar se o nome de usuário já existe (excluindo o próprio usuário)
  const verificarUsername = async (newUsername: string): Promise<boolean> => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', newUsername.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        for (const doc of querySnapshot.docs) {
          if (doc.id !== userId) {
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Erro ao verificar username:', error);
      return false;
    }
  };

  // Verificar se o email já existe
  const verificarEmail = async (newEmail: string): Promise<boolean> => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', newEmail.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        for (const doc of querySnapshot.docs) {
          if (doc.id !== userId) {
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      return false;
    }
  };

  // Reautenticar usuário
  const reauthenticateUser = async (password: string): Promise<boolean> => {
    if (!user || !user.email) {
      Alert.alert('Erro', 'Usuário não autenticado');
      return false;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      return true;
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        Alert.alert('Erro', 'Senha atual incorreta');
      } else if (error.code === 'auth/user-not-found') {
        Alert.alert('Erro', 'Usuário não encontrado');
      } else {
        Alert.alert('Erro', 'Falha na reautenticação: ' + error.message);
      }
      return false;
    }
  };

  // Atualizar nome de usuário
  const atualizarUsername = async (): Promise<boolean> => {
    if (!userId) {
      Alert.alert('Erro', 'Usuário não autenticado');
      return false;
    }

    if (!username.trim()) {
      Alert.alert('Atenção', 'Digite um nome de usuário');
      return false;
    }

    if (username.length < 3) {
      Alert.alert('Atenção', 'O nome de usuário deve ter pelo menos 3 caracteres');
      return false;
    }

    if (username.length > 20) {
      Alert.alert('Atenção', 'O nome de usuário deve ter no máximo 20 caracteres');
      return false;
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      Alert.alert('Atenção', 'Use apenas letras, números e underscore (_)');
      return false;
    }

    try {
      // Verificar se o username já existe
      const usernameExiste = await verificarUsername(username);
      if (usernameExiste) {
        Alert.alert('Atenção', 'Este nome de usuário já está em uso. Escolha outro.');
        return false;
      }

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        username: username.toLowerCase(),
        displayName: username,
        updatedAt: new Date().toISOString(),
      });

      setUserData({ ...userData, username: username.toLowerCase(), displayName: username });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar username:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o nome de usuário');
      return false;
    }
  };

  // Atualizar email
  const atualizarEmail = async (): Promise<boolean> => {
    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado');
      return false;
    }

    if (!newEmail.trim()) {
      Alert.alert('Atenção', 'Digite um novo e-mail');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      Alert.alert('Atenção', 'Digite um e-mail válido');
      return false;
    }

    if (newEmail.toLowerCase() === email.toLowerCase()) {
      Alert.alert('Atenção', 'O novo e-mail é igual ao atual');
      return false;
    }

    // Verificar se o email já existe
    const emailExiste = await verificarEmail(newEmail);
    if (emailExiste) {
      Alert.alert('Atenção', 'Este e-mail já está em uso por outra conta');
      return false;
    }

    // Reautenticar para segurança
    const reauthSuccess = await reauthenticateUser(currentPassword);
    if (!reauthSuccess) {
      return false;
    }

    setSalvando(true);
    try {
      // Atualizar email no Firebase Auth
      await updateEmail(user, newEmail);
      
      // Atualizar email no Firestore
      const userRef = doc(db, 'users', userId!);
      await updateDoc(userRef, {
        email: newEmail.toLowerCase(),
        updatedAt: new Date().toISOString(),
      });

      setEmail(newEmail);
      setNewEmail(newEmail);
      setCurrentPassword('');
      setEditandoEmail(false);
      Alert.alert('Sucesso', 'E-mail atualizado com sucesso!');
      return true;
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert('Erro', 'Por favor, faça login novamente para alterar o e-mail');
      } else {
        Alert.alert('Erro', 'Não foi possível atualizar o e-mail: ' + error.message);
      }
      return false;
    } finally {
      setSalvando(false);
    }
  };

  // Atualizar senha
  const atualizarSenha = async (): Promise<boolean> => {
    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado');
      return false;
    }

    if (!newPassword) {
      Alert.alert('Atenção', 'Digite uma nova senha');
      return false;
    }

    if (newPassword.length < 6) {
      Alert.alert('Atenção', 'A nova senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert('Atenção', 'As senhas não coincidem');
      return false;
    }

    // Reautenticar para segurança
    const reauthSuccess = await reauthenticateUser(currentPassword);
    if (!reauthSuccess) {
      return false;
    }

    setSalvando(true);
    try {
      await updatePassword(user, newPassword);
      
      setNewPassword('');
      setConfirmNewPassword('');
      setCurrentPassword('');
      setEditandoSenha(false);
      Alert.alert('Sucesso', 'Senha atualizada com sucesso!');
      return true;
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert('Erro', 'Por favor, faça login novamente para alterar a senha');
      } else {
        Alert.alert('Erro', 'Não foi possível atualizar a senha: ' + error.message);
      }
      return false;
    } finally {
      setSalvando(false);
    }
  };

  // Atualizar perfil completo
  const atualizarPerfil = async () => {
    // Primeiro atualiza o username
    const usernameOk = await atualizarUsername();
    if (!usernameOk) return;
    
    Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
  };

  // Upload de foto de perfil
  const uploadProfilePhoto = async (base64: string) => {
    if (!userId) return;

    setSalvando(true);
    try {
      const url = await uploadImageToImgBB(base64);
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        photoURL: url,
      });
      setPhotoURL(url);
      Alert.alert('Sucesso', 'Foto de perfil atualizada!');
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a foto');
    } finally {
      setSalvando(false);
    }
  };

  // Escolher imagem da galeria ou câmera
  const escolherImagem = async (origem: 'camera' | 'galeria') => {
    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      };

      let result;
      if (origem === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permissão necessária', 'Precisa de permissão para usar a câmera');
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permissão necessária', 'Precisa de permissão para acessar a galeria');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets[0].base64) {
        await uploadProfilePhoto(result.assets[0].base64);
      }
    } catch (error) {
      console.error('Erro ao escolher imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  return {
    userData,
    username,
    setUsername,
    email,
    setEmail,
    newEmail,
    setNewEmail,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmNewPassword,
    setConfirmNewPassword,
    photoURL,
    loading,
    salvando,
    editandoEmail,
    setEditandoEmail,
    editandoSenha,
    setEditandoSenha,
    atualizarPerfil,
    atualizarUsername,
    atualizarEmail,
    atualizarSenha,
    escolherImagem,
    uploadProfilePhoto,
    reauthenticateUser,
  };
}