# تشغيل وحدات Bokerr

## 1. Backend Worker وD1

تم عزل Cloudflare Worker وDurable Objects ومحرك الجولات وقاعدة D1 في المستودع المنفصل:

https://github.com/bdkxbvdkdbs-source/boker

نفّذ أوامر Worker من مستودع `boker` فقط:

```bash
npm install
npx wrangler d1 create bokerr
# ضع database_id الناتج في wrangler.toml
npm run db:migrate
npx wrangler secret put ADMIN_TOKEN
npx wrangler secret put SMS_SIGNING_SECRET
npm run dev
npm run deploy
```

يوجد Workflow نشر مستقل داخل مستودع `boker` باسم `Deploy Bokerr Backend Worker`. أضف إليه أسرار `CLOUDFLARE_API_TOKEN` و`CLOUDFLARE_ACCOUNT_ID`.

## 2. الواجهات

- `mobile/src/PokerApp.jsx` هو مكوّن React Native الأساسي.
- `admin/src/AdminDashboard.tsx` يُضمّن في تطبيق React/Next.js إداري منفصل.
- أضف عنوان Worker المنشور إلى `API_URL` في التطبيقين.
- لا تضع `ADMIN_TOKEN` داخل تطبيق الهاتف أو الويب العام.

## 3. إشعارات Sham Cash

يجب تسجيل `ShamCashSmsListener` في Android Manifest مع صلاحية SMS المناسبة وسياسة Google Play. الملف لا يشحن الرصيد محليًا؛ يرسل إثباتًا للخادم، ويجب استبدال عنوان `api.example.com` بعنوان Worker في مستودع `boker`. لا يمكن اعتماد التكامل الحقيقي دون API أو صيغة SMS رسمية من Sham Cash.

## 4. الأمان

استخدم HTTPS فقط، واستبدل التحقق التجريبي من JWT بموفر هوية حقيقي، وخزّن رمز الإدارة في Secret مع تدويره وتطبيق معدل طلبات. لا تعتمد على نص SMS وحده في الإنتاج؛ استخدم توقيع المزود أو API رسميًا. لا تضع مفاتيح سرية في JSX أو APK.

## 5. المحفظة الاختيارية

المستخدم يستطيع فتح الصالة دون إنشاء محفظة أو إضافة دفع. أزرار الإيداع والسحب متاحة من شاشة المحفظة فقط، وزر «تخطي الآن» يعيد المستخدم إلى الصالة.
