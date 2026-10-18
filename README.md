# Bokerr

يضم هذا المستودع واجهة React/Vite، مشروع Android/Kotlin، وواجهة Android WebView العربية. اللعب الشبكي لـTexas Hold'em وOmaha يتصل بمحرك `boardgame.io` الموجود في مستودع backend المنفصل: [bdkxbvdkdbs-source/boker](https://github.com/bdkxbvdkdbs-source/boker).

تستخدم الواجهة عنوان Worker الافتراضي `https://bokerr-api.bdkxbvdkdbs.workers.dev`؛ يمكن تغييره عند البناء باستخدام `VITE_BOKERR_API_BASE_URL` لواجهة Vite أو `BOKERR_API_BASE_URL` لبناء Android. تُنشأ جلسات ضيف، ثم يتصل العميل بـWebSocket إلى Durable Object الطاولة. يحتفظ التطبيق بميزات الطاولات والملف الشخصي والشاشات الحالية؛ شاشة المحفظة القديمة غير مرتبطة بدفع حقيقي أو بمحرك الطاولة.

## البناء المحلي

```bash
npm ci
npm run typecheck
npm run build
npm run lint
```

ينتج بناء الويب إلى `dist`. يبني `.github/workflows/android.yml` نسخة Android عند التغيير على `main`؛ وسير `android-release.yml` ينشر APK وAAB موقّعين عند إنشاء tag يبدأ بـ`v` إذا كانت أسرار التوقيع مضبوطة. نشر Cloudflare Worker واختباراته يديرهما المستودع `boker`، لا هذا المستودع.

راجع [دليل التنفيذ والاتصال](docs/IMPLEMENTATION.md) لعقد HTTP/WebSocket وأسماء الإعدادات والأسرار المطلوبة.
