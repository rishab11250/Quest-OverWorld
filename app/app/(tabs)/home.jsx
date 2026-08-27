import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quest Overworld</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1A33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#F2C84B',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
