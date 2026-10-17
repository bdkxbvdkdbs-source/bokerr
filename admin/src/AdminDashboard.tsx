import { useCallback, useEffect, useState } from 'react';

type DashboardData = { users: Array<{ id: string; username: string; balanceSyp: number; status: string }>; transactions: Array<{ id: string; type: string; amountSyp: number; status: string; username: string }>; tables: Array<{ id: string; name: string; seated: number; capacity: number }> };

export default function AdminDashboard({ apiUrl, adminToken }: { apiUrl: string; adminToken: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(() => fetch(`${apiUrl}/api/admin/overview`, { headers: { Authorization: `Bearer ${adminToken}` } }).then((r) => r.ok ? r.json() : Promise.reject(new Error('غير مصرح'))).then(setData).catch((e) => setError(e.message)), [apiUrl, adminToken]);
  useEffect(() => { void load(); }, [load]);
  const action = (path: string, body: object) => fetch(`${apiUrl}${path}`, { method: 'POST', headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(load);
  if (error) return <main dir="rtl"><h1>لوحة الإدارة</h1><p>{error}</p></main>;
  if (!data) return <main dir="rtl"><p>جارٍ التحميل…</p></main>;
  return <main dir="rtl" style={{ maxWidth: 1100, margin: 'auto', padding: 24 }}><h1>لوحة إدارة Bokerr</h1><section style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}><Panel title="المستخدمون" value={data.users.length} /><Panel title="المعاملات" value={data.transactions.length} /><Panel title="الطاولات النشطة" value={data.tables.length} /></section><h2>الحسابات</h2><table><thead><tr><th>المستخدم</th><th>الرصيد</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>{data.users.map((user) => <tr key={user.id}><td>{user.username}</td><td>{user.balanceSyp.toLocaleString('ar-SY')} ل.س</td><td>{user.status}</td><td><button onClick={() => action('/api/admin/freeze', { userId: user.id, frozen: user.status !== 'frozen' })}>{user.status === 'frozen' ? 'فك التجميد' : 'تجميد'}</button><button onClick={() => { const amount = Number(prompt('المبلغ الجديد بالليرة السورية')); if (Number.isFinite(amount)) action('/api/admin/balance', { userId: user.id, balanceSyp: amount }); }}>تعديل الرصيد</button></td></tr>)}</tbody></table><h2>المعاملات</h2><ul>{data.transactions.map((tx) => <li key={tx.id}>{tx.username} · {tx.type} · {tx.amountSyp.toLocaleString('ar-SY')} ل.س · {tx.status}</li>)}</ul><h2>الطاولات</h2><ul>{data.tables.map((table) => <li key={table.id}>{table.name}: {table.seated}/{table.capacity}</li>)}</ul></main>;
}
function Panel({ title, value }: { title: string; value: number }) { return <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}><small>{title}</small><strong style={{ display: 'block', fontSize: 28 }}>{value}</strong></div>; }
