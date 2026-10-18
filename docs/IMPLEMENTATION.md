# تشغيل وحدات Bokerr

## البنية الحالية

واجهة Bokerr موجودة في هذا المستودع، ويُدار Worker ومحرك اللعب في مستودع backend منفصل:

- واجهة React/Vite والواجهة المدمجة في Android: هذا المستودع `bdkxbvdkdbs-source/bokerr`.
- Cloudflare Worker وDurable Objects ومحرك Texas/Omaha: [`bdkxbvdkdbs-source/boker`](https://github.com/bdkxbvdkdbs-source/boker).

يعمل `boardgame.io` Master داخل Worker، وتنفذ كل طاولة في Durable Object مستقل، مع تخزين حالة اللعبة عبر StorageAPI مخصص فوق Durable Object storage. يستخدم `SESSION_KV` جلسات الضيف فقط. يتولى Worker تعاقب الأدوار والرهانات وكشف الأوراق، ويرسل أوراق كل لاعب الخاصّة له وحده. بروتوكول الواجهة WebSocket مخصص ومتوافق مع هذا المحرك؛ لا يلزم خادم Node منفصل.

## عناوين الاتصال

- عنوان HTTP الافتراضي: `https://bokerr-api.bdkxbvdkdbs.workers.dev`.
- يمكن ضبط عنوان الويب عبر متغير البناء `VITE_BOKERR_API_BASE_URL`.
- Android يستعمل `BOKERR_API_BASE_URL`، وله قيمة افتراضية لنفس Worker في GitHub Actions.
- الجلسة تُنشأ عبر `POST /api/session`؛ ويحمل WebSocket إلى `/ws/<tableId>` الرمز ضمن `Sec-WebSocket-Protocol` باسم `bokerr-v1`، لا ضمن URL.
- أفعال اللعبة تشمل `start`, `startNextHand`, `fold`, `check`, `call`, `bet`, `raise`, `allIn`. كل فعل يرسل `actionId` فريداً و`stateID` الرقمي الحالي؛ `raise.amount` هو إجمالي الرهان المستهدف في الجولة.

يستخدم Worker قائمة CORS في `ALLOWED_ORIGINS` للسماح بـAndroid WebView وGitHub Pages وعناوين التطوير المحلية. عند تغيير النطاق، حدّث هذا المتغير في `boker/wrangler.toml` ثم انشر Worker.

## النشر

- يُبنى الويب محلياً بـ`npm ci && npm run build` إلى `dist`؛ لا يوجد في المستودع حالياً Workflow ينشر Vite إلى GitHub Pages. Workflows الموجودة في `.github/workflows` تخص بناء Android وإصداراته.
- نشر Worker يتم من مستودع `boker`، وسير العمل `Deploy Bokerr Backend Worker` ينشر عند push إلى `main` بعد نجاح `npm run typecheck` و`npm test`.
- يلزم أن يحتوي مستودع `boker` على GitHub Actions Secret باسم `CLOUDFLARE_API_TOKEN`. لا يُطلب `CLOUDFLARE_ACCOUNT_ID` كـSecret في سير العمل الحالي؛ معرّف الحساب محفوظ بإعداد Wrangler في المستودع.
- لتغيير عنوان API، حدّث قيمة `VITE_BOKERR_API_BASE_URL` للويب و`BOKERR_API_BASE_URL` لعملية بناء Android، مع ضبط CORS في backend.

## المدفوعات وإشعارات Sham Cash

لا يضيف Worker لعبة البوكر مسارات تحويل مالية أو دفع أو SMS. تبقى أي شاشة محفظة موجودة في الواجهة منفصلة عن هذا المحرك، ولا يتغير رصيدها من API اللعب. رصيد الطاولة افتراضي خاص باللعبة، وليس إيداعاً أو سحباً حقيقياً. يتطلب أي تكامل مالي لاحق API رسمياً وتحققاً خادمياً؛ لا تعتمد على رسائل SMS غير الموثقة.

## أسرار وأمان

لا تضع `ADMIN_TOKEN` أو `CLOUDFLARE_API_TOKEN` أو مفاتيح التوقيع في واجهة الويب أو Android أو Git. خزّنها في GitHub Actions Secrets أو Cloudflare Worker Secrets حسب موضع استخدامها. جلسات Bokerr الحالية جلسات ضيوف وليست هوية حساب موثّقة لأغراض مالية.
