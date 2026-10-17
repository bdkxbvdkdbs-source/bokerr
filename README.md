# bokerr

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-3ccchpmx)

## الوحدات المضافة

المجلد `src` هو واجهة الويب الحالية. تمت إضافة `backend/worker` لخادم Cloudflare Worker وDurable Object ومحرك الجولات، و`mobile` لمكوّن React Native وAndroid SMS receiver، و`admin` لمكوّن لوحة الإدارة. المحفظة والدفع اختياريان، ويوجد زر «تخطي الآن» في الواجهة.

راجع [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md) لخطوات إعداد D1 وSecrets والنشر. التكامل الرسمي مع Sham Cash يحتاج API أو اعتمادًا من مزود الخدمة؛ مستقبل SMS لا يشحن الرصيد مباشرة دون تحقق الخادم.
