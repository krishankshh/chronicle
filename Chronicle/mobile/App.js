import { useEffect, useState } from 'react'
import { SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View, FlatList } from 'react-native'
import Constants from 'expo-constants'
import { api } from './src/api/client'

export default function App() {
  const [notices, setNotices] = useState([])
  const [rollNo, setRollNo] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/notices')
        setNotices(res.data.data || [])
      } catch {
        // ignore
      }
    })()
  }, [])

  const login = async () => {
    try {
      const res = await api.post('/api/auth/student/login', { rollNo, password })
      setMessage('Logged in as ' + (res.data.data?.student?.name || ''))
    } catch (e) {
      setMessage(e?.response?.data?.data?.error || 'Login failed')
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Chronicle (Mobile)</Text>

      <View style={styles.card}>
        <Text style={styles.subtitle}>Student Login</Text>
        <TextInput style={styles.input} placeholder="Roll No" value={rollNo} onChangeText={setRollNo} />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={styles.button} onPress={login}><Text style={styles.buttonText}>Login</Text></TouchableOpacity>
        {!!message && <Text style={styles.message}>{message}</Text>}
      </View>

      <Text style={styles.subtitle}>Latest Notices</Text>
      <FlatList
        data={notices}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>{item.title}</Text>
            <Text style={styles.noticeType}>{item.type}</Text>
            <Text>{item.description}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: (Constants && Constants.statusBarHeight) || 32 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  subtitle: { fontSize: 18, fontWeight: '600', marginTop: 12, marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12, borderColor: '#eee', borderWidth: 1 },
  input: { borderColor: '#ccc', borderWidth: 1, padding: 8, borderRadius: 6, marginBottom: 8 },
  button: { backgroundColor: '#333', padding: 10, borderRadius: 6, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  message: { marginTop: 6, color: '#c00' },
  notice: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 8, borderColor: '#eee', borderWidth: 1 },
  noticeTitle: { fontSize: 16, fontWeight: '600' },
  noticeType: { fontSize: 12, color: '#666' }
})

