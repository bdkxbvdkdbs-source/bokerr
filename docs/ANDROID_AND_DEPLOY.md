# النشر والبناء

## Cloudflare Worker

يوجد مساران منفصلان: تطبيق الويب في جذر المستودع، وBackend Worker داخل `backend/worker`. لا تستخدم `npx wrangler deploy` من جذر المستودع؛ هذا يجعل Cloudflare يكتشف Vite ويحاول تهيئته تلقائيًا. في Cloudflare Workers Builds اجعل **Root directory** هو `backend/worker`، واترك Build command فارغًا أو استخدم `npm install`، واجعل Deploy command هو `npm run deploy`. أما Cloudflare Pages للواجهة فليستخدم `npm run build` ومجلد `dist` فقط، دون `wrangler deploy`.

سجّل الدخول محليًا أولًا:

```bash
cd backend/worker
npx wrangler login
npx wrangler whoami
npx wrangler d1 create bokerr
# ضع database_id في wrangler.toml
npx wrangler d1 execute bokerr --remote --file schema.sql
npx wrangler secret put ADMIN_TOKEN
npx wrangler secret put SMS_SIGNING_SECRET
npx wrangler deploy
```

النشر التلقائي من GitHub يحتاج Secrets باسم `CLOUDFLARE_API_TOKEN` و`CLOUDFLARE_ACCOUNT_ID`. لا تضع هذه القيم في الملفات أو الكود.

## اختبار WebSocket

بعد أن يعطي `wrangler deploy` عنوان Worker، اختبر الصحة أولًا:

```bash
curl https://YOUR_WORKER.workers.dev/health
```

ثم استخدم عميل WebSocket. الاتصال يعطي رسالة `ready` وبداخلها `turnToken`. يجب استعمال الرمز الصادر من الخادم، وليس القيمة التجريبية الموجودة في اختبار المثال. يمكن استخدام `wscat`:

```bash
npx wscat -c wss://YOUR_WORKER.workers.dev/ws/berlin-9max
```

الطاولات المتاحة هي `berlin-9max` و`london-5max`. مسار الحالة العام هو `/api/tables`.

## Android

المشروع الأصلي موجود في `mobile/android`. محليًا يحتاج Android SDK وGradle 8.10 أو أعلى:

```bash
cd mobile/android
gradle assembleDebug bundleRelease
```

GitHub Action `android.yml` يبني APK debug وAAB release ويرفعهما كـ Artifacts. نسخة release الحالية تستخدم debug signing لتسهيل الاختبار. قبل رفع AAB إلى Google Play يجب إضافة keystore حقيقي إلى GitHub Secrets وتغيير `signingConfig` إلى إعداد release.

عدّل عنوان WebSocket في `MainActivity.kt` من `wss://api.example.com` إلى عنوان Worker المنشور. كما يجب استبدال عنوان API داخل `ShamCashSmsListener.kt`.
