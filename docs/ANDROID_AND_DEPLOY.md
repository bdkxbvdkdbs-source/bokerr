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

## Android (Kotlin)

المشروع الأصلي موجود في `mobile/android` ومصدر التطبيق بلغة Kotlin. يتطلب البناء Android SDK وGradle 8.10 أو أحدث:

```bash
cd mobile/android
gradle assembleDebug bundleRelease
```

يشغّل GitHub Action `android.yml` بناء APK debug وAAB release ويرفعهما كـ Artifacts. دون إعداد توقيع، يكون AAB غير موقّع ولا يصلح للنشر على Google Play؛ لا يستخدم المشروع مفتاح debug لتوقيع إصدار release. لإصدار قابل للنشر، أضف إلى GitHub Actions Secrets القيم `ANDROID_KEYSTORE_BASE64` و`ANDROID_KEYSTORE_PASSWORD` و`ANDROID_KEY_ALIAS` و`ANDROID_KEY_PASSWORD`. يُفك مخزن المفاتيح داخل مساحة runner المؤقتة فقط. لا ترفع keystore أو كلمات مروره إلى Git.

اضبط متغير المستودع `BOKERR_API_BASE_URL` بعنوان API المنشور بصيغة HTTPS (دون `/` في النهاية). يدخل العنوان وقت البناء في `BuildConfig`، ولا يُضمّن أي رمز إدارة أو مفتاح سري في التطبيق. لا توضع الأسرار في `gradle.properties` أو ملفات `.env` أو شفرة Kotlin.

مستقبل SMS يرسل مرجعًا ومبلغًا مستخرجين من الرسالة كبيانات غير موثوقة فقط؛ SHA-256 على الهاتف ليس إثبات دفع. لا يجوز للخادم إضافة رصيد قبل التحقق من المعاملة عبر واجهة رسمية موثوقة لمزود الدفع، مع منع التكرار. صلاحية SMS حساسة وقد تخضع لقيود Google Play وسياساته، لذلك لا تنشر هذا التكامل قبل مراجعتها والحصول على الموافقات اللازمة.
