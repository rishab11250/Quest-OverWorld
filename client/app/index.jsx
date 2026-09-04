import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { getToken, getUserData } from '../lib/secureStore';
import colors from '../theme/colors';

export default function Index() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const token = await getToken();
        const user = await getUserData();
        if (!isMounted) return;

        if (token) {
          if (user?.isAdmin || user?.role === 'admin') {
            router.replace('/admin/dashboard');
          } else {
            router.replace('/(tabs)/home');
          }
        } else {
          router.replace('/(auth)/login');
        }
      } catch (error) {
        if (isMounted) {
          router.replace('/(auth)/login');
        }
      } finally {
        if (isMounted) {
          setChecking(false);
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent.gold} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.dusk,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
