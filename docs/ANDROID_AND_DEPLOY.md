# تطبيق Android والنشر

## الباك إند على Cloudflare

الباك إند في المستودع المنفصل [boker](https://github.com/bdkxbvdkdbs-source/boker)، ويُنشر كـCloudflare Worker باسم `bokerr-api`. عنوان الإنتاج الافتراضي هو `https://bokerr-api.bdkxbvdkdbs.workers.dev`.

تُحفظ جلسة الضيف في KV عبر binding باسم `SESSION_KV` لمدة 30 يوماً. ينشئ الخادم رمز جلسة عشوائياً، ويحفظ في KV بصمة SHA-256 للرمز وبيانات الجلسة فقط. يحتفظ Android بالرمز في `SharedPreferences` خاص بالتطبيق. حالة الجولة الحية ومقاعد الطاولة تبقى في Durable Object لكل طاولة وتُحفظ باستخدام تخزين Durable Object؛ KV ليس مصدراً لحالة اللعب الحية.

المسارات الحالية: `GET /health`، و`GET /api/tables`، و`POST/GET/PUT/DELETE /api/session`، واتصال WebSocket على `/ws/berlin-9max` أو `/ws/london-5max`. يتطلب WebSocket جلسة صالحة عبر بروتوكول `bokerr-v1` ورمز الجلسة، وليس عبر عنوان URL. جلسات الضيف لا تعادل تسجيل دخول بحساب موثّق.

أزيلت واجهة المحفظة وتدفقات SMS/الدفع من تطبيق Android ومساراتها العامة من Worker. تُركت جداول D1 القديمة دون حذف لتفادي فقد البيانات الموجودة؛ لا تستخدمها الواجهة الحالية.

## تطبيق Android

المشروع Kotlin في `mobile/android`. شاشة التطبيق أصول HTML/CSS/JavaScript محلية داخل APK، وتُعرض عبر `WebViewAssetLoader` على origin آمن `https://appassets.androidplatform.net`. لا يحتاج التطبيق إلا إذن `INTERNET`؛ لا يطلب صلاحيات SMS أو ملفات أو موقع. عنوان API يُحقن في `BuildConfig` وقت البناء، ولا يوجد مفتاح إدارة داخل التطبيق.

الحد الأدنى للبناء Android 5.0 / API 21. قابلية العرض الفعلية تعتمد أيضاً على نسخة Android System WebView المثبتة على الجهاز؛ لذلك لا يمكن ضمان التوافق مع كل نسخة WebView قديمة أو معدّلة.

للبناء محلياً:

```bash
cd mobile/android
gradle assembleDebug bundleRelease
```

يمكن تجاوز عنوان API الافتراضي بمتغير البيئة أو Gradle property باسم `BOKERR_API_BASE_URL`، ويجب أن يكون عنوان HTTPS. أُعد GitHub Actions لاستخدام Worker الإنتاجي افتراضياً.

## إصدار APK وAAB

يشغّل `.github/workflows/android.yml` بناء APK debug وAAB تجريبياً عند تحديث `main`، ثم يرفع الناتج كـArtifact في Actions. يشغّل `.github/workflows/android-release.yml` بناء الإصدار عند دفع tag يبدأ بـ`v`، ثم يرفع APK وAAB إلى [صفحة Releases](https://github.com/bdkxbvdkdbs-source/bokerr/releases).

يتطلب إصدار الإنتاج أسرار GitHub Actions التالية: `PASTE_ANDROID_KEYSTORE_BASE64_HERE` و`ANDROID_KEYSTORE_PASSWORD` و`ANDROID_KEY_ALIAS` و`ANDROID_KEY_PASSWORD`. لا ترفع ملف keystore أو كلمات المرور إلى Git. يستخدم Workflow عنوان API الافتراضي، أو متغير المستودع `BOKERR_API_BASE_URL` إذا ضُبط.

بعد الإصدار `v1.0.3`، يمكن إنشاء الإصدار التالي مثلاً هكذا:

```bash
git tag v1.0.4
git push origin v1.0.4
```

ينبغي تنزيل APK من صفحة Releases؛ ملف AAB مخصص غالباً للنشر عبر متاجر التطبيقات، بينما APK هو الأنسب للتثبيت اليدوي.
