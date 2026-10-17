import React, { useEffect, useState } from 'react';
import { Linking, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const TABLES = [
  { id: 'berlin-9max', name: 'طاولة بوكر تكساس', city: 'Berlin', variant: 'تكساس هولدم', blinds: '5 / 10', buyIn: '350 - 5000', seated: 6, capacity: 9 },
  { id: 'london-5max', name: 'طاولة بوكر أوماها', city: 'London', variant: 'أوماها', blinds: '5 / 10', buyIn: '500 - 5000', seated: 3, capacity: 5 },
];

export default function PokerApp({ apiUrl, supportPhone = '963999888777' }) {
  const [tab, setTab] = useState('lobby');
  const [balance, setBalance] = useState(null);
  const [skippedWallet, setSkippedWallet] = useState(false);

  useEffect(() => {
    if (tab !== 'wallet' || skippedWallet) return;
    fetch(`${apiUrl}/api/wallet`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setBalance(data.balanceSyp ?? 0))
      .catch(() => setBalance(null));
  }, [apiUrl, skippedWallet, tab]);

  const render = () => {
    if (tab === 'wallet') return (
      <View style={styles.card}>
        <Text style={styles.title}>المحفظة اختيارية</Text>
        <Text style={styles.muted}>يمكنك استكشاف الصالة دون إضافة وسيلة دفع.</Text>
        {balance !== null && <Text style={styles.balance}>{balance.toLocaleString('ar-SY')} ل.س</Text>}
        <View style={styles.row}>
          <Action text="إيداع" onPress={() => {}} primary />
          <Action text="سحب" onPress={() => {}} />
        </View>
        <Action text="تخطي الآن" onPress={() => { setSkippedWallet(true); setTab('lobby'); }} />
      </View>
    );
    if (tab === 'support') return <View style={styles.card}><Text style={styles.title}>الدعم الفني</Text><Action text="فتح واتساب" primary onPress={() => Linking.openURL(`https://wa.me/${supportPhone}`)} /></View>;
    if (tab === 'profile') return <View style={styles.card}><Text style={styles.title}>حسابي</Text><Text style={styles.muted}>لاعب_دمشق</Text></View>;
    return <View>{TABLES.map((table) => <View key={table.id} style={styles.table}><Text style={styles.title}>{table.name}</Text><Text style={styles.muted}>{table.city} · {table.variant}</Text><Text style={styles.muted}>Blinds {table.blinds} · دخول {table.buyIn} ل.س</Text><Text style={styles.balance}>{table.seated}/{table.capacity}</Text><Action text="دخول الطاولة" primary onPress={() => {}} /></View>)}</View>;
  };

  return <SafeAreaView style={styles.screen}><Text style={styles.brand}>BOKERR</Text>{render()}<View style={styles.nav}>{[['lobby','الصالة'],['wallet','المحفظة'],['support','الدعم'],['profile','حسابي']].map(([key, label]) => <TouchableOpacity key={key} onPress={() => setTab(key)}><Text style={tab === key ? styles.active : styles.navText}>{label}</Text></TouchableOpacity>)}</View></SafeAreaView>;
}

function Action({ text, onPress, primary }) { return <TouchableOpacity style={[styles.button, primary && styles.primary]} onPress={onPress}><Text style={primary ? styles.darkText : styles.buttonText}>{text}</Text></TouchableOpacity>; }

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#06140e', padding: 16, direction: 'rtl' }, brand: { color: '#e8c75e', fontSize: 24, fontWeight: '800', marginBottom: 16 }, card: { backgroundColor: '#101a13', borderRadius: 18, padding: 16, gap: 12 }, table: { backgroundColor: '#101a13', borderRadius: 18, padding: 16, marginBottom: 12, gap: 8 }, title: { color: '#fff', fontSize: 18, fontWeight: '800' }, muted: { color: '#a8b2aa', fontSize: 13 }, balance: { color: '#f0d98a', fontSize: 24, fontWeight: '800' }, row: { flexDirection: 'row', gap: 8 }, button: { borderColor: '#3a493e', borderWidth: 1, borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 4 }, primary: { backgroundColor: '#d4af37', borderColor: '#d4af37' }, buttonText: { color: '#f0d98a', fontWeight: '700' }, darkText: { color: '#071008', fontWeight: '800' }, nav: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 'auto', paddingVertical: 16, backgroundColor: '#0c130e', borderRadius: 16 }, navText: { color: '#a8b2aa' }, active: { color: '#e8c75e', fontWeight: '800' } });
