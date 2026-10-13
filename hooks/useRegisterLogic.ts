import { useState, useRef } from 'react';
import { Alert } from 'react-native';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDocs, query, where, collection } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type RegisterScreenProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

export function useRegisterLogic() {
  const navigation = useNavigation<RegisterScreenProp>();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔥 REF DE PROTEÇÃO CONTRA MÚLTIPLOS CLIQUES
  const isRegisteringRef = useRef(false);

  const verificarUsername = async (username: string): Promise<boolean> => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username.toLowerCase()));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Erro ao verificar username:', error);
      return false;
    }
  };

  const cadastrar = async () => {
    // 🔥 PREVINE MÚLTIPLOS CLIQUES
    if (isRegisteringRef.current) {
      console.log('⚠️ Cadastro já em andamento, ignorando clique');
      return;
    }

    // Validações
    if (!username.trim()) {
      Alert.alert('Atenção', 'Digite um nome de usuário');
      return;
    }

    if (username.length < 3) {
      Alert.alert('Atenção', 'O nome de usuário deve ter pelo menos 3 caracteres');
      return;
    }

    if (username.length > 20) {
      Alert.alert('Atenção', 'O nome de usuário deve ter no máximo 20 caracteres');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      Alert.alert('Atenção', 'Use apenas letras, números e underscore (_)');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Atenção', 'Digite seu e-mail');
      return;
    }

    if (!senha) {
      Alert.alert('Atenção', 'Digite uma senha');
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert('Atenção', 'As senhas não coincidem');
      return;
    }

    if (senha.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    // 🔥 ATIVA A PROTEÇÃO
    isRegisteringRef.current = true;
    setLoading(true);

    try {
      // Verificar se o username já existe
      const usernameExiste = await verificarUsername(username);
      if (usernameExiste) {
        Alert.alert('Atenção', 'Este nome de usuário já está em uso. Escolha outro.');
        return;
      }

      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // Salvar dados do usuário no Firestore
      await setDoc(doc(db, 'users', user.uid), {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        displayName: username,
        photoURL: null,
        followers: [],
        following: [],
        createdAt: new Date().toISOString(),
      });

      Alert.alert('Sucesso!', 'Conta criada com sucesso!');
      navigation.replace('Home');
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Atenção', 'Este e-mail já está cadastrado');
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Atenção', 'A senha é muito fraca');
      } else {
        Alert.alert('Erro', error.message || 'Não foi possível criar a conta');
      }
    } finally {
      // 🔥 LIBERA A PROTEÇÃO SEMPRE (mesmo com erro)
      isRegisteringRef.current = false;
      setLoading(false);
    }
  };

  return {
    username,
    setUsername,
    email,
    setEmail,
    senha,
    setSenha,
    confirmarSenha,
    setConfirmarSenha,
    loading,
    cadastrar,
    verificarUsername,
  };
}