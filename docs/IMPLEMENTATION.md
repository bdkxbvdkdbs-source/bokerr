# تشغيل الوحدات الجديدة

## 1. Worker وD1

```bash
cd backend/worker
npx wrangler d1 create bokerr
# ضع database_id الناتج في wrangler.toml
npx wrangler d1 execute bokerr --remote --file schema.sql
npx wrangler secret put ADMIN_TOKEN
npx wrangler secret put SMS_SIGNING_SECRET
npx wrangler dev
```

بعد النشر:

```bash
npx wrangler deploy
```

اربط `DB` و`POKER_TABLE` كما في `wrangler.toml`. كل طاولة تستخدم Durable Object مستقلًا بالمعرّف `tableId`.

## 2. الواجهات

- `mobile/src/PokerApp.jsx` هو مكوّن React Native الأساسي.
- `admin/src/AdminDashboard.tsx` يُضمّن في تطبيق React/Next.js إداري منفصل.
- أضف متغير البيئة `API_URL` إلى التطبيقين، ولا تضع `ADMIN_TOKEN` داخل تطبيق الهاتف أو الويب العام.

## 3. إشعارات Sham Cash

يجب تسجيل `ShamCashSmsListener` في Android Manifest مع صلاحية SMS المناسبة وسياسة Google Play. الملف لا يشحن الرصيد محليًا؛ يرسل إثباتًا للخادم، ويجب استبدال عنوان `api.example.com` بعنوان Worker. لا يمكن اعتماد التكامل الحقيقي دون API/صيغة SMS رسمية من Sham Cash.

## 4. الأمان

- استخدم HTTPS فقط.
- استبدل التحقق التجريبي من JWT في `authenticateUser` بموفر هوية حقيقي.
- خزّن رمز الإدارة في Secret، وطبّق تدويرًا ومعدل طلبات.
- لا تعتمد على نص SMS وحده في الإنتاج؛ استخدم توقيع المزود أو API رسميًا.
- استخدم Durable Object كمصدر الحقيقة للعبة، وD1 كدفتر محاسبي.
- لا تضع أي مفاتيح سرية في JSX أو APK.

## 5. المحفظة الاختيارية

المستخدم يستطيع فتح الصالة دون إنشاء محفظة أو إضافة دفع. أزرار الإيداع والسحب متاحة من شاشة المحفظة فقط، وزر «تخطي الآن» يعيد المستخدم إلى الصالة.
