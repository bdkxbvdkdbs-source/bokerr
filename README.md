# bokerr

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-3ccchpmx)

## المشروع

هذا المستودع يحتوي على واجهة Bokerr للويب، مكوّن React Native، تطبيق Android Kotlin، ولوحة الإدارة. المحفظة والدفع اختياريان، ويوجد زر «تخطي الآن» في الواجهة.

تم عزل Cloudflare Worker وDurable Objects وقاعدة D1 في المستودع المنفصل:

[bdkxbvdkdbs-source/boker](https://github.com/bdkxbvdkdbs-source/boker)

راجع [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md) لخطوات الربط. التكامل الرسمي مع Sham Cash يحتاج API أو اعتمادًا من مزود الخدمة؛ مستقبل SMS لا يشحن الرصيد مباشرة دون تحقق الخادم.

نشر واجهة Vite يتم من جذر هذا المستودع إلى `dist`. لا يوجد Backend Worker داخل هذا المستودع بعد الآن.
