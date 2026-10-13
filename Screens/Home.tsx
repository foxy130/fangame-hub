import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useHomeLogic } from '../hooks/useHomeLogic';
import { useTheme } from '../hooks/useTheme';
import CommunityScreen from './CommunityScreen';
import CreateFangameScreen from './CreateFangameScreen';
import ForumScreen from './ForumScreen';
import ThreeDotMenu from '../components/ThreeDotMenu';
import { auth } from '../firebase';

const Tab = createBottomTabNavigator();

// Tela "Meus Fangames"
function MyFangamesScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const {
    fangames,
    deletarFangame,
    adicionarImagemFangame,
    fazerUploadFangame,
    deslogar,
    userEmail,
    userPhoto,
    userUsername,
  } = useHomeLogic();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.7}>
            <View style={[styles.avatar, { borderColor: colors.primary }]}>
              {userPhoto ? (
                <Image source={{ uri: userPhoto }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>👾</Text>
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.usernameText, { color: colors.text }]}>
              @{userUsername || userEmail?.split('@')[0] || 'Usuário'}
            </Text>
            <Text style={[styles.emailText, { color: colors.textMuted }]}>{userEmail}</Text>
          </View>
          <ThreeDotMenu
            userId={auth.currentUser?.uid}
            userName={userUsername || userEmail || 'Usuário'}
          />
        </View>

        {fazerUploadFangame && (
          <Text style={[styles.uploadText, { color: colors.primary }]}>Enviando imagem...</Text>
        )}

        <FlatList
          data={fangames}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.cardBorder }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{item.nome}</Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('EditFangame', { fangameId: item.id })}
                    style={styles.iconButton}
                  >
                    <Ionicons name="pencil" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deletarFangame(item.id)} style={styles.iconButton}>
                    <Ionicons name="trash-outline" size={20} color="#ff5252" />
                  </TouchableOpacity>
                </View>
              </View>
              {item.descricao ? (
                <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>{item.descricao}</Text>
              ) : null}
              {item.imagens && item.imagens.length > 0 && (
                <FlatList
                  horizontal
                  data={item.imagens}
                  keyExtractor={(imgUrl, index) => `${item.id}-img-${index}`}
                  renderItem={({ item: imgUrl }) => (
                    <Image source={{ uri: imgUrl }} style={[styles.cardImage, { backgroundColor: colors.inputBackground }]} />
                  )}
                  style={styles.imageRow}
                  showsHorizontalScrollIndicator={false}
                />
              )}
              <TouchableOpacity
                style={[styles.addPhotoBtn, { backgroundColor: colors.inputBackground }]}
                onPress={() => adicionarImagemFangame(item.id)}
              >
                <Text style={[styles.addPhotoText, { color: colors.primary }]}>+ Adicionar foto</Text>
              </TouchableOpacity>
            </View>
          )}
        />

        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: '#ff5252', backgroundColor: colors.inputBackground }]}
          onPress={deslogar}
        >
          <Text style={styles.logoutText}>Sair (Logout)</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// Componente principal com as abas
export default function Home() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Meus Fangames') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Comunidade') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Criar') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Fórum') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Meus Fangames" component={MyFangamesScreen} />
      <Tab.Screen name="Criar" component={CreateFangameScreen} />
      <Tab.Screen name="Comunidade" component={CommunityScreen} />
      <Tab.Screen name="Fórum" component={ForumScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollView: { flex: 1 },
  container: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  headerCenter: { flex: 1, marginLeft: 12 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2f2f4f',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatarImage: { width: 50, height: 50, borderRadius: 25 },
  avatarText: { fontSize: 24 },
  usernameText: { fontSize: 16, fontWeight: 'bold' },
  emailText: { fontSize: 12 },
  uploadText: { marginBottom: 12, fontSize: 13 },
  card: { borderRadius: 16, padding: 18, marginBottom: 18, borderWidth: 1 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 19, fontWeight: 'bold', flex: 1 },
  cardActions: { flexDirection: 'row', gap: 8 },
  iconButton: { padding: 6 },
  cardDescription: { marginBottom: 12, fontSize: 14, lineHeight: 20 },
  imageRow: { marginBottom: 14 },
  cardImage: { width: 130, height: 130, borderRadius: 12, marginRight: 10, resizeMode: 'cover' },
  addPhotoBtn: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  addPhotoText: { fontWeight: '600', fontSize: 13 },
  logoutBtn: {
    marginTop: 25,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  logoutText: { color: '#ff5252', fontWeight: 'bold', fontSize: 16 },
});