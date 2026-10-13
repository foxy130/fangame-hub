import { useState } from 'react';
import { Alert } from 'react-native';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type LoginScreenProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export function useLoginLogic() {
  const navigation = useNavigation<LoginScreenProp>();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const logar = () => {
    signInWithEmailAndPassword(auth, email, senha)
      .then(() => {
        navigation.replace('Home');
      })
      .catch((erro) => {
        Alert.alert("Erro", erro.message);
      });
  };

  return {
    email,
    setEmail,
    senha,
    setSenha,
    logar,
  };
}