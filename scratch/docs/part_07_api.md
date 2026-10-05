# الفصل السابع: مرجع واجهات الـ API

هذا الفصل مرجع سريع لواجهات الخادم في مشروع JO Cars. تحتوي الشجرة `src/app/api` على **203 ملف** مسار (`route.ts`) موزعة على 14 مجالاً.
استخدم الجداول للعثور على المسار والطريقة والمصادقة المطلوبة، ثم راجع قسم مخططات الطلب قبل أول استدعاء.

[[PAGEBREAK]]

## كيف تستدعي الـ API

### طرق المصادقة

يوجد طريقتان فقط لتعريف الخادم بهويتك، وترتيب الفحص مهم:

1. ترويسة `Authorization: Bearer <TOKEN>` — تُفحص أولاً.
2. كوكي الجلسة `token` — يُفحص بعدها، وهو HttpOnly و `SameSite=Strict` ومدة صلاحيته 7 أيام (`Max-Age=604800`).

يصدر الخادم رمز JWT صالح 7 أيام عند نجاح تسجيل الدخول، ويضعه في الكوكي تلقائياً.
بعض المسارات **عامة تماماً** ولا تحتاج شيئاً، وبعضها يقبل المستخدم العادي بينما تُحظر الكتابة إلا للمشرف.

> لا ترسل رمز الدخول في نص الرابط أو في مسار API مكشوف. استخدم الترويسة أو الكوكي فقط.

### ترميز النصوص العربية

كل مسار يستخدم مساعدات `src/lib/api.ts` يعيد الرد بـ `Content-Type: application/json; charset=utf-8`.
هذا الترويس ضروري لكي تظهر الحروف العربية سليمة عندك؛ في المقابل 46 ملفاً تعيد JSON دون هذا الترويس وستجد تفصيلها في قسم ملاحظات التوافق.

### أول طلب لك

ابدأ بتسجيل الدخول، ثم استخدم الرمز الناتج في بقية الطلبات:

```http
POST /api/auth/login HTTP/1.1
Host: localhost:3000
Content-Type: application/json; charset=utf-8

{"email":"0791234567","password":"Passw0rd!"}
```

ستظهر لك استجابة تحمل المستخدم والرمز معاً، ويُضبط الكوكي في نفس الرد:

```json
{
  "success": true,
  "data": {
    "user": { "id": "clx...", "name": "علي", "email": "ali@example.com", "role": "USER" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

بعدها تستدعي أي مسار محمي بإحدى الطريقتين المذكورتين أعلاه.

[[PAGEBREAK]]

## هيكل الردود

### ظرف النجاح

كل مسار حديث يعيد الحقل `success: true` والبيانات داخل `data`:

```json
{ "success": true, "data": { "id": "clx...", "title": "تويوتا كورولا 2019" } }
```

المسار المُصرَّف يضيف حقولاً اختيارية في المستوى نفسه:

| الحقل | النوع | متى يظهر | ملاحظات |
|---|---|---|---|
| `success` | منطقي | دائماً | `true` عند النجاح |
| `data` | أي نوع | دائماً | البيانات المطلوبة |
| `error` | نص | عند الفشل | رسالة بالعربية |
| `details` | مصفوفة | خطأ 422 | `{field, message}` لكل حقل |
| `pagination` | كائن | المسارات المُصفَّة | انظر قسم ترقيم الصفحات |

### ظرف الخطأ

الفشل يحمل `success: false` مع رسالة واحدة قابلة للعرض للمستخدم:

```json
{ "success": false, "error": "خطأ في التحقق من البيانات",
  "details": [{ "field": "password", "message": "كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل" }] }
```

### أكواد الحالة الشائعة

| الكود | متى يظهر | نص الخطأ الشائع | ماذا تفعل |
|---|---|---|---|
| 200 / 201 | نجاح الطلب أو إنشاء مورد | — | اقرأ `data` |
| 400 | JSON معطوب أو طلب غير صالح | `طلب غير صالح` | صحّح المدخلات |
| 401 | لا رمز أو انتهت صلاحيته | `غير مصرح لك بالوصول` | سجّل الدخول مجدداً |
| 403 | الدور غير كافٍ أو حساب محظور | `لا تملك صلاحية` | تحقق من الدور |
| 404 | المورد غير موجود | `السيارة غير موجود` | تحقق من المعرّف |
| 409 | تعارض في نفس اللحظة | `تمت مزايدة أعلى قبل لحظة، حدّث السعر وحاول مجددًا` | أعد المحاولة |
| 413 | صورة أكبر من الحد أو فشل قراءة الملف | — | صغّر الملف |
| 422 | فشل التحقق بـ zod | `خطأ في التحقق من البيانات` | اقرأ `details` |
| 429 | تجاوز حد المعدل أو قفل مؤقت | `تم تجاوز الحد المسموح` | انتظر ثم أعد المحاولة |
| 500 | خطأ داخلي | `حدث خطأ` | أعد المحاولة لاحقاً |

> عند تسجيل الدخول، 5 محاولات فاشلة تُقفل الحساب 30 دقيقة وتضيف IP إلى قائمة الحظر مؤقتاً.
> بعض المسارات القديمة تعيد `Unauthorized` بدل الرسالة العربية، والتفصيل في قسم ملاحظات التوافق.

[[PAGEBREAK]]

## جداول المراجع حسب المجال

كل صف يمثّل ملف `route.ts` واحداً، وعدد الملفات بين قوسين في عنوان القسم. مجموع الملفات في هذا القسم **203**.

رموز عمود المصادقة:

| الرمز | المعنى |
|---|---|
| عام | لا يحتاج أي رمز |
| مستخدم | يحتاج رمز مستخدم صالح بأي دور |
| مشرف | يحتاج دور `ADMIN` |
| مالك أو مشرف | صاحب المورد أو `ADMIN` |
| Cron | ترويسة `x-cron-secret` أو `Bearer` مع سر المجدول |

### حساب المستخدم والمصادقة (10 ملفات)

| المسار | الطرق | المصادقة | الغرض وملاحظات |
|---|---|---|---|
| `/api/auth/register` | POST | عام | إنشاء حساب؛ حد `3/15 دقيقة` لكل IP |
| `/api/auth/login` | POST | عام | بريد أو رقم هاتف أردني يبدأ بـ `07`؛ 5 محاولات فاشلة تقفل الحساب 30 دقيقة |
| `/api/auth/login-otp` | POST | عام | إرسال رمز دخول برسالة؛ حد `5/15 دقيقة` لكل IP |
| `/api/auth/verify-login-otp` | POST | عام | تأكيد رمز الدخول؛ حد `10/15 دقيقة` لكل IP |
| `/api/auth/google` | POST | عام | دخول بحساب جوجل؛ حد `10/15 دقيقة` لكل IP |
| `/api/auth/forgot-password` | POST, PUT | عام | طلب الاستعادة `3/60 ثانية` ثم تغيير السر `5/60 ثانية` |
| `/api/auth/send-otp` | POST | مستخدم | إرسال رمز تحقق للجوال؛ حد `3/60 ثانية` لكل IP |
| `/api/auth/verify-otp` | POST | مستخدم | تأكيد الرقم؛ حد `10/60 ثانية` لكل IP |
| `/api/auth/profile` | GET, PUT | مستخدم | قراءة وتعديل الملف الشخصي |
| `/api/auth/logout` | POST | عام | يحذف كوكي الجلسة |

### السيارات والإعلانات (19 ملفاً)

| المسار | الطرق | المصادقة | الغرض وملاحظات |
|---|---|---|---|
| `/api/cars` | GET, POST | عام (GET) / مستخدم (POST) | بحث ونشر؛ `limit` افتراضي 20 والأقصى 100 |
| `/api/cars/my` | GET | مستخدم | إعلاناتي مع عدّادات التفاعل |
| `/api/cars/favorites` | GET, POST | مستخدم | قراءة المفضلة وإضافة أو إزالة |
| `/api/cars/bookings` | POST | مستخدم | إنشاء حجز موعد بالسيارة |
| `/api/cars/brands` | GET, POST | عام | قراءة الماركات؛ الكتابة بلا تحقق من الدور |
| `/api/cars/models` | GET, POST | عام (GET) / مشرف (POST) | الموديلات المرتبطة بالماركة |
| `/api/cars/cities` | GET | عام | المدن الأردنية |
| `/api/cars/bulk-import` | POST | مستخدم | استيراد دفعة؛ حد `5/10 دقائق` لكل مستخدم |
| `/api/cars/[id]` | GET, PUT, DELETE | عام (GET) / مالك أو مشرف | تعديل وحذف ناعم مع سجل من قام به |
| `/api/cars/[id]/comments` | GET, POST | عام (GET) / مستخدم (POST) | تعليقات الإعلان |
| `/api/cars/[id]/images` | GET | عام | الصور الإضافية؛ `offset` افتراضي 6 و`limit` افتراضي 20 (1–30) |
| `/api/cars/[id]/reviews` | GET, POST | عام (GET) / مستخدم (POST) | تقييمات السيارة؛ 20 للصفحة والأقصى 50 |
| `/api/cars/[id]/report` | GET | عام | تقرير ذكي عن الوقائع والصيانة، يعيد 10 سجلات |
| `/api/cars/[id]/viewers` | POST, GET | عام | تسجيل وقراءة المشاهدات؛ حد `60/60 ثانية` لكل IP |
| `/api/cars/[id]/reactivate` | POST | مالك أو مشرف | إعادة نشر إعلان منتهٍ |
| `/api/cars/[id]/sold` | POST | مالك أو مشرف | تعليم الإعلان كمباع |
| `/api/cars/[id]/sounds` | GET, POST | عام (GET) / مستخدم (POST) | مقاطع صوت مرفقة بالسيارة |
| `/api/cars/[id]/sounds/analyze` | POST | مالك أو مشرف | تحليل صوت المحرك؛ حد `30/60 ثانية` |
| `/api/cars/[id]/sounds/[soundId]` | GET, DELETE | عام (GET) / مالك أو مشرف (DELETE) | قراءة أو حذف مقطع |

### المنتدى (6 ملفات)

| المسار | الطرق | المصادقة | الغرض وملاحظات |
|---|---|---|---|
| `/api/forum/categories` | GET | عام | أقسام المنتدى |
| `/api/forum/topics` | GET, POST | عام (GET) / مستخدم (POST) | المواضيع؛ حد `10/60 ثانية` لكل مستخدم |
| `/api/forum/topics/[id]` | GET, PATCH, DELETE | عام (GET) / مالك أو مشرف | موضوع واحد وتحريره |
| `/api/forum/posts` | POST | مستخدم | رد جديد؛ حد `10/60 ثانية` لكل مستخدم |
| `/api/forum/posts/[id]` | DELETE, PATCH | مالك أو مشرف | حذف وتعديل الرد |
| `/api/forum/posts/[id]/report` | POST | مستخدم | الإبلاغ عن رد |

### المرآب والصيانة والتذكيرات (9 ملفات)

| المسار | الطرق | المصادقة | الغرض وملاحظات |
|---|---|---|---|
| `/api/garage` | GET, POST | مستخدم | مركباتي في المرآب |
| `/api/garage/[id]` | GET, PUT, DELETE | مستخدم | مركبة واحدة |
| `/api/expenses` | GET, POST | مستخدم | مصروفات المركبة |
| `/api/maintenance` | GET, POST | عام (GET) / مستخدم (POST) | سجل الصيانة |
| `/api/maintenance/[id]` | PUT, DELETE | PUT مالك أو مشرف / DELETE مشرف | تعديل السجل أو حذفه نهائياً |
| `/api/reminders` | GET, POST | مستخدم | التذكيرات العامة؛ حد `20/60 ثانية` لكل مستخدم |
| `/api/car-reminders` | GET, POST | مستخدم | تذكيرات مرتبطة بمركبة أو لوحة |
| `/api/car-reminders/[id]` | PUT, DELETE | مستخدم | تعديل تذكير أو حذفه |
| `/api/car-reminders/send` | POST | مستخدم | إرسال التذكيرات المستحقة الآن |

### الرسائل والإشعارات (7 ملفات)

| المسار | الطرق | المصادقة | الغرض وملاحظات |
|---|---|---|---|
| `/api/messages` | GET, POST, PUT | مستخدم | آخر 100 رسالة، ثم الإرسال وتعليم كمقروء |
| `/api/conversations` | GET, POST | مستخدم | المحادثات؛ 20 للصفحة والأقصى 50 |
| `/api/conversations/[id]/messages` | GET | مشارك أو مشرف | رسائل المحادثة؛ حد `limit` 200 |
| `/api/notifications` | GET, PUT | مستخدم | آخر 50 إشعاراً وتعليم الكل كمقروء |
| `/api/realtime/token` | POST | مستخدم | رمز قناة Ably صالح ساعة كحد أقصى |
| `/api/presence` | POST | مستخدم | تحديث حالة الاتصال للمستخدم |
| `/api/push/subscribe` | POST, DELETE | مستخدم | الاشتراك في الإشعارات وإلغاؤه |

### قطع الغيار واللوحات والمطلوبات والمزادات (10 ملفات)

| المسار | الطرق | المصادقة | الغرض وملاحظات |
|---|---|---|---|
| `/api/parts` | GET, POST | عام (GET) / مستخدم (POST) | قطع الغيار؛ 24 للصفحة والأقصى 100 |
| `/api/parts/[id]` | GET, PATCH, DELETE | عام (GET) / مالك أو مشرف | تفاصيل القطعة وتعديلها وحذفها |
| `/api/plates` | GET, POST | عام (GET) / مستخدم (POST) | لوحات السيارات المعروضة |
| `/api/plates/[id]` | GET, PUT, DELETE | عام (GET) / بائع أو مشرف | إدارة إعلان لوحة |
| `/api/wanted` | GET, POST | عام (GET) / مستخدم (POST) | المطلوبات؛ 20 للصفحة والأقصى 50 |
| `/api/wanted/[id]` | GET, PUT, DELETE | عام (GET) / مالك أو مشرف | إعلان مطلوب واحد |
| `/api/wanted/[id]/offers` | POST | مستخدم | تقديم عرض؛ حد `200/60 ثانية` لكل مستخدم |
| `/api/auctions` | GET, POST | مستخدم | المزادات؛ 20 للصفحة والأقصى 50 |
| `/api/auctions/[id]` | GET, PATCH | عام (GET) / بائع أو مشرف | تعديل المزاد وإدارة حالته |
| `/api/auctions/[id]/bid` | POST | مستخدم | مزايدة؛ حماية آخر ثانية بمقدار دقيقتين |

### المحتوى المجاور للإعلانات (17 ملفاً)

| المسار | الطرق | المصادقة | الغرض وملاحظات |
|---|---|---|---|
| `/api/articles` | GET, POST, DELETE | عام (GET) / مشرف (POST, DELETE) | المقالات؛ `limit` افتراضي 20 بلا سقف |
| `/api/articles/[slug]` | GET, PUT, DELETE | عام (GET) / مشرف (PUT, DELETE) | مقال واحد برابطه |
| `/api/dealers` | GET | عام | دليل المعارض |
| `/api/deals` | GET | عام | العروض؛ 24 للصفحة والأقصى 48 |
| `/api/badges` | GET | عام | الشارات المتاحة للعرض |
| `/api/premium-requests` | POST, GET | مستخدم | طلب اشتراك مميز لسيارة |
| `/api/car-tags` | GET, POST, DELETE | عام (GET) / مشرف (POST, DELETE) | وسوم السيارات |
| `/api/car-comments/[id]` | DELETE | مالك أو مشرف | حذف تعليق |
| `/api/car-comments/[id]/report` | POST | مستخدم | الإبلاغ عن تعليق |
| `/api/bookings` | GET | مستخدم | قراءة الحجوزات؛ الإنشاء في `/api/cars/bookings` |
| `/api/bookings/[id]` | GET, PATCH | مستخدم | تفاصيل الحجز وتعديله |
| `/api/car-history` | POST, GET | مستخدم (POST) / عام (GET) | تسجيل وقراءة أحداث تاريخ السيارة |
| `/api/car-history/[vin]` | GET | عام | تاريخ مركبة بالـ VIN |
| `/api/car-history/decode/[vin]` | GET | عام | فك بيانات الـ VIN |
| `/api/news-image` | GET | عام | جلب صورة خبر محفوظة |
| `/api/client-errors` | POST | عام | تسجيل أخطاء الواجهة؛ حد `20/60 ثانية` لكل IP |
| `/api/internal/sentinel-probe` | POST | سر `x-sentinel-secret` | مسبار داخلي للمراقبة لا يُستدعى من المتصفح |

### الاجتماعي والمنصة (14 ملفاً)

| المسار | الطرق | المصادقة | الغرض وملاحظات |
|---|---|---|---|
| `/api/users` | GET | عام (المشاهد اختياري) | قائمة المستخدمين؛ 12 نتيجة + 5 مميزة |
| `/api/users/[id]/follow` | GET, POST | عام (GET) / مستخدم (POST) | المتابعون والمتابعة؛ حد `30/60 ثانية` |
| `/api/stories` | GET, POST | عام (GET) / مستخدم موثّق (POST) | النشر لـ `TRADER` أو `DEALER` أو `ADMIN` بعد التوثيق؛ حد `20/ساعة` |
| `/api/stories/[id]` | POST, DELETE | عام (POST) / مالك أو مشرف (DELETE) | زيادة عدّاد المشاهدة ثم الحذف |
| `/api/sounds/stream/[id]` | GET | مالك السيارة أو مشرف | بث مقطع صوتي مرفوع |
| `/api/sounds/check-ban` | GET | مستخدم | هل حُظر المستخدم من الرفع؟ |
| `/api/sounds/bans` | POST, GET, DELETE | مشرف | إدارة حظر رفع المقاطع |
| `/api/sounds/reports` | POST, GET | مستخدم (POST) / مشرف (GET) | بلاغات المقاطع الصوتية |
| `/api/upload` | POST | مستخدم | رفع ملف؛ حد `20/60 ثانية` لكل IP |
| `/api/cron/backup` | POST, GET | Cron | تشغيل النسخة الاحتياطية المجدولة |
| `/api/cron/weekly-report` | POST, GET | Cron | إرسال التقرير الأسبوعي |
| `/api/cron/recalculate` | POST, GET | Cron | إعادة حساب المؤشرات |
| `/api/health` | GET | عام | فحص حيّ يعيد `{ok:true,t}` دون ظرف |
| `/api/status` | GET | عام | حالة النظام العامة بلا أسرار |

### التذاكر والبلاغات (4 ملفات)

| المسار | الطرق | المصادقة | الغرض وملاحظات |
|---|---|---|---|
| `/api/tickets` | GET, POST | مستخدم | قراءة تذاكر الدعم وفتح تذكرة |
| `/api/tickets/[id]` | GET, POST, PATCH | مالك أو مشرف | الرد على التذكرة؛ الإغلاق النهائي للمشرف |
| `/api/reports` | POST | مستخدم | بلاغ عن إعلان مع السبب وإشعار المشرفين |
| `/api/contact` | POST | عام | نموذج التواصل؛ حد `5/60 ثانية` لكل IP |

### التقييمات والمؤشرات (12 ملفاً)

| المسار | الطرق | المصادقة | الغرض وملاحظات |
|---|---|---|---|
| `/api/valuations` | POST | مستخدم | تقييم ذكي؛ حصة يومية `dailyQuota` (افتراضي 5) والمشرف معفى |
| `/api/valuations` | GET | عام | تقييم سيارة وسجل السعر عبر `carId` |
| `/api/valuations/stream` | POST | مستخدم | بث لحظي بنفس الحصة اليومية وأحداث `error` خاصة |
| `/api/valuations/[id]` | GET | مالك الطلب أو مشرف | تقييم محفوظ سابقاً |
| `/api/financing/calculate` | POST | عام | حساب قسط التمويل |
| `/api/financing/calculate` | GET | عام | جداول وأسعار التمويل |
| `/api/ratings` | POST | مستخدم | إضافة تقييم لمستخدم |
| `/api/ratings` | GET | عام | قائمة التقييمات كمصفوفة خام |
| `/api/ratings/user/[id]` | GET | عام | تقييمات مستخدم محدد |
| `/api/users/[id]/accuracy` | GET | عام | دقة إعلانات مستخدم |
| `/api/resale-value` | POST | عام | تقدير قيمة إعادة البيع |
| `/api/market-index` | GET | عام | مؤشر سوق السيارات |
| `/api/car-finder` | POST | عام | ترشيح حتى 50 سيارة حسب احتياجك |
| `/api/price-alerts` | GET, POST | مستخدم | تنبيهات السعر |
| `/api/price-alerts/[id]` | DELETE, PATCH | مالك أو مشرف | تعديل تنبيه أو حذفه |

### ورش العمل (20 ملفاً)

| المسار | الطرق | المصادقة | الغرض وملاحظات |
|---|---|---|---|
| `/api/workshops` | GET, POST | عام (GET) / مستخدم (POST) | دليل الورش؛ `limit` افتراضي 20 بلا سقف |
| `/api/workshops/[id]` | GET, PUT, DELETE | عام (GET) / مالك أو مشرف | ورشة واحدة |
| `/api/workshops/[id]/reviews` | GET, POST | عام (GET) / مستخدم (POST) | تقييمات الورشة |
| `/api/workshops/[id]/appointments` | GET, POST | مستخدم | قراءة المواعيد وحجز موعد |
| `/api/workshops/[id]/ads` | GET, POST | عام (GET) / مالك الورشة (POST) | إعلانات الورشة |
| `/api/workshops/[id]/costs` | GET, POST | عام (GET) / مستخدم (POST) | أسعار الخدمات |
| `/api/workshops/[id]/report` | POST | مستخدم | الإبلاغ عن ورشة |
| `/api/workshops/[id]/stats` | GET | عام | إحصاءات الورشة العامة |
| `/api/workshops/dashboard/info` | GET, PUT | مالك الورشة | بيانات الملف التعريفي |
| `/api/workshops/dashboard/stats` | GET | مالك الورشة | لوحة إحصاءات المالك |
| `/api/workshops/dashboard/ads` | GET, POST | مالك الورشة | إعلاناتي في الورشة |
| `/api/workshops/dashboard/ads/[id]` | DELETE | مالك الورشة | حذف إعلان |
| `/api/workshops/dashboard/appointments` | GET, PUT | مالك الورشة | المواعيد وتحديث حالتها |
| `/api/workshops/dashboard/brands` | GET, POST | مالك الورشة | الماركات التي تخدمها الورشة |
| `/api/workshops/dashboard/brands/[id]` | DELETE | مالك الورشة | إزالة ماركة |
| `/api/workshops/dashboard/prices` | GET, POST | مالك الورشة | قائمة أسعاري |
| `/api/workshops/dashboard/prices/[id]` | DELETE | مالك الورشة | حذف سعر |
| `/api/workshops/dashboard/reviews` | GET, PUT | مالك الورشة | تقييمي وإدارتها |
| `/api/workshops/dashboard/services` | GET, POST | مالك الورشة | خدماتي |
| `/api/workshops/dashboard/services/[id]` | DELETE | مالك الورشة | حذف خدمة |

### الذكاء الاصطناعي (14 ملفاً)

| المسار | الطرق | المصادقة | الغرض وملاحظات |
|---|---|---|---|
| `/api/ai/chat` | POST | مستخدم | محادثة عادية؛ حد `20/60 ثانية` لكل مستخدم |
| `/api/ai/chat/stream` | POST | مستخدم | محادثة بثّ لحظي؛ حد `20/60 ثانية` |
| `/api/ai/car-review` | POST | عام | مراجعة سيارة؛ حد `30/60 ثانية` لكل IP |
| `/api/ai/sound` | POST | عام | تحليل خصائص صوت دون حد معدل |
| `/api/ai/description` | POST | عام | وصف ترويجي؛ حد `30/60 ثانية` لكل IP |
| `/api/ai/market-price` | POST | عام | سعر السوق؛ حد `30/60 ثانية` لكل IP |
| `/api/ai/price-estimate` | POST | عام | تقدير سعر؛ حد `30/60 ثانية` لكل IP |
| `/api/ai/price-analysis` | POST | عام | تحليل فرق السعر؛ حد `30/60 ثانية` لكل IP |
| `/api/ai/personality-match` | POST | عام | مطابقة شخصية السيارة؛ حد `30/60 ثانية` لكل IP |
| `/api/ai/smart-search` | POST | عام | بحث بلغة طبيعية؛ حد `30/60 ثانية` لكل IP |
| `/api/ai/customs` | POST | مستخدم | احتساب الجمارك؛ حد `30/60 ثانية` لكل مستخدم |
| `/api/ai/inspection` | POST | مستخدم | قائمة فحص؛ حد `30/60 ثانية` لكل مستخدم |
| `/api/ai/purchase-assistant` | POST | مستخدم | مساعد الشراء؛ حد `30/60 ثانية` لكل مستخدم |
| `/api/ai/analysis/[id]` | GET | عام | نتيجة تحليل محفوظة |

### حساب التاجر (ملف واحد)

| المسار | الطرق | المصادقة | الغرض وملاحظات |
|---|---|---|---|
| `/api/trader/verification` | GET, POST | مستخدم | طلب التوثيق لدور `TRADER` أو `DEALER`؛ حد `3/ساعة` |

> إرسال طلب التوثيق لحساب عادي يعيد 403 مع `طلب التوثيق متاح لحسابات التجار فقط`.

### لوحة الإدارة (60 ملفاً)

كل مسارات هذا القسم تتحقق من دور `ADMIN` قبل الكتابة وتعيد `غير مصرح لك بالوصول` لغير المشرف، باستثناء ستة مسارات تُقرأ بـ `GET` بلا تحقق:`/api/admin/brands` و`/api/admin/cities` و`/api/admin/models` و`/api/admin/provinces` و`/api/admin/maintenance` و`/api/admin/news-aggregator`.

| المسار | الطرق | المصادقة | الغرض وملاحظات |
|---|---|---|---|
| `/api/admin/advanced-stats` | GET | مشرف | إحصاءات متقدمة |
| `/api/admin/audit-logs` | GET | مشرف | سجل التدقيق؛ 50 للأصفحة والأقصى 200 |
| `/api/admin/backup` | GET, POST | مشرف | قراءة النسخ الاحتياطية وإنشاؤها |
| `/api/admin/backup/auto` | POST | مشرف | ضبط النسخ التلقائي |
| `/api/admin/backup/run` | GET, POST | مشرف | تشغيل نسخة يدوياً |
| `/api/admin/backup/[filename]` | GET, DELETE | مشرف | تنزيل نسخة أو حذفها |
| `/api/admin/badges` | GET, POST | مشرف | إدارة الشارات |
| `/api/admin/badges/[id]` | PUT, DELETE | مشرف | تعديل شارة أو حذفها |
| `/api/admin/brands` | GET, POST, PATCH, DELETE | عام (GET) / مشرف (البقية) | إدارة الماركات |
| `/api/admin/car-comment-reports` | GET, PATCH, DELETE | مشرف | بلاغات تعليقات السيارات |
| `/api/admin/car-comment-users/[id]/ban` | POST | مشرف | حظر مستخدم من التعليق |
| `/api/admin/car-logs` | GET | مشرف | سجل أحداث الإعلانات |
| `/api/admin/cars` | GET | مشرف | إدارة الإعلانات؛ 50 للأصفحة والأقصى 100 |
| `/api/admin/cars/[id]` | PUT, DELETE | مشرف | تعديل أو حذف إعلان |
| `/api/admin/cars/[id]/feature` | POST, DELETE | مشرف | تمييز إعلان وإلغاء تمييزه |
| `/api/admin/cars/[id]/permanent` | DELETE | مشرف | حذف نهائي لا يمكن التراجع عنه |
| `/api/admin/cars/[id]/restore` | PATCH | مشرف | استرجاع إعلان محذوف |
| `/api/admin/cities` | GET, POST | عام (GET) / مشرف (POST) | إدارة المدن |
| `/api/admin/cities/[id]` | PUT, DELETE | مشرف | تعديل مدينة أو حذفها |
| `/api/admin/content-tools` | POST | مشرف | أدوات توليد وتنظيف المحتوى |
| `/api/admin/conversations` | GET | مشرف | مراقبة المحادثات |
| `/api/admin/conversations/[id]` | GET, POST | مشرف | قراءة محادثة والإرسال فيها |
| `/api/admin/fair-price` | GET, POST | مشرف | حساب وضبط السعر العادل |
| `/api/admin/forum-categories` | GET, POST | مشرف | أقسام المنتدى |
| `/api/admin/forum-categories/[id]` | PUT, DELETE | مشرف | تعديل قسم أو حذفه |
| `/api/admin/forum-reports` | GET, DELETE, PATCH | مشرف | بلاغات المنتدى |
| `/api/admin/forum-users/[id]/ban` | POST | مشرف | حظر مستخدم منتدى |
| `/api/admin/maintenance` | GET, PUT | عام (GET) / مشرف (PUT) | قراءة وضع الصيانة وتبديله |
| `/api/admin/models` | GET, POST, PATCH, DELETE | عام (GET) / مشرف (البقية) | إدارة الموديلات |
| `/api/admin/news-aggregator` | POST, GET | مشرف أو Cron (POST) / عام (GET) | مجمّع الأخبار اليدوي والمجدول |
| `/api/admin/notifications` | GET, PUT | مشرف | إشعارات المشرفين؛ آخر 50 |
| `/api/admin/parts` | GET | مشرف | إدارة قطع الغيار |
| `/api/admin/parts/[id]` | PUT, DELETE | مشرف | تعديل قطعة أو حذفها |
| `/api/admin/plans` | GET, POST | مشرف | باقات الاشتراك |
| `/api/admin/plans/[id]` | GET, PUT, DELETE | مشرف | باقة واحدة |
| `/api/admin/premium-requests` | GET, POST | مشرف | طلبات التمييز الواردة |
| `/api/admin/provinces` | GET, POST | عام (GET) / مشرف (POST) | إدارة المحافظات |
| `/api/admin/provinces/[id]` | PUT, DELETE | مشرف | تعديل محافظة أو حذفها |
| `/api/admin/reports` | GET, PATCH, DELETE | مشرف | البلاغات؛ 20 للأصفحة والأقصى 100 |
| `/api/admin/security` | GET | مشرف | إعدادات الحماية عبر `requireRole('ADMIN')` |
| `/api/admin/seller-reports` | GET | مشرف | بلاغات البائعين |
| `/api/admin/sentinel` | GET, POST | مشرف | نظام الحارس؛ 30 للأصفحة والأقصى 100 |
| `/api/admin/settings` | GET, PUT | مشرف | الإعدادات العامة |
| `/api/admin/stats` | GET | مشرف | الإحصاءات الأساسية عبر `requireRole('ADMIN')` |
| `/api/admin/subscriptions` | GET | مشرف | الاشتراكات؛ 20 للأصفحة والأقصى 100 |
| `/api/admin/subscriptions/[id]` | GET, PATCH, DELETE | مشرف | اشتراك واحد |
| `/api/admin/tags` | GET, POST | مشرف | إدارة الوسوم |
| `/api/admin/tags/[id]` | PUT, DELETE | مشرف | تعديل وسم أو حذفه |
| `/api/admin/tickets` | GET, POST | مشرف | تذاكر الدعم من جهة المشرف |
| `/api/admin/traders-approval` | GET, POST | مشرف | الموافقة على طلبات التجار |
| `/api/admin/users` | GET | مشرف | المستخدمون؛ 20 للأصفحة والأقصى 100 |
| `/api/admin/users/bulk` | POST | مشرف | عمليات جماعية على الحسابات |
| `/api/admin/users/[id]` | GET, PUT, DELETE | مشرف | مستخدم واحد وصلاحياته |
| `/api/admin/valuations` | GET, POST | مشرف | التقييمات؛ 20 للأصفحة والأقصى 100 |
| `/api/admin/valuations/intelligence` | GET, POST | مشرف | ضبط محرك الذكاء |
| `/api/admin/valuations/listings` | POST | مشرف | ربط الإعلانات بنتائج التقييم |
| `/api/admin/valuations/revalue` | POST, GET | مشرف | إعادة تقييم دفعات |
| `/api/admin/workshops` | GET, DELETE, PUT | مشرف | إدارة الورش؛ `limit` افتراضي 20 بلا سقف |
| `/api/admin/workshops/ads` | GET, DELETE, PUT | مشرف | إعلانات الورش |
| `/api/admin/workshops/reports` | GET, PUT | مشرف | بلاغات الورش |

[[PAGEBREAK]]

## مخططات الطلب المهمة

كل مخطط أدناه يوضح حقول الطلب وأنواعها، ثم مثال JSON قصير. الحقول غير المعلّمة «اختيارية» هي إلزامية.

### إنشاء حساب — POST /api/auth/register

| الحقل | النوع | إلزامي | الحدود |
|---|---|---|---|
| `name` | نص | نعم | 2–100 حرف |
| `email` | نص | نعم | بريد صالح |
| `password` | نص | نعم | 8 أحرف فأكثر ويشتمل على حرف كبير وصغير ورقم ورمز |
| `phone` | نص | لا | رقم جوال |
| `role` | قائمة | لا | `USER` أو `DEALER` أو `TRADER` (افتراضي `USER`) |
| `dealerName` | نص | لا | اسم المعرض |
| `dealerDescription` | نص | لا | حتى 1000 حرف |
| `dealerAddress` | نص | لا | حتى 300 حرف |
| `commercialReg` | نص | لا | حتى 100 حرف |

```json
{ "name": "علي أحمد", "email": "ali@example.com", "password": "Passw0rd!",
  "phone": "0791234567", "role": "DEALER", "dealerName": "معرض النور" }
```

### تسجيل الدخول — POST /api/auth/login

| الحقل | النوع | إلزامي | الحدود |
|---|---|---|---|
| `email` | نص | نعم | بريد أو رقم هاتف أردني يبدأ بـ `07` |
| `password` | نص | نعم | حرف واحد على الأقل |

```json
{ "email": "0791234567", "password": "Passw0rd!" }
```

### نشر سيارة — POST /api/cars

هذا المسار يستقبل `multipart/form-data` وليس JSON، ويقبل حتى 10 صور.

| الحقل | النوع | إلزامي | الحدود |
|---|---|---|---|
| `brandId` / `modelId` | نص | نعم | معرّفات موجودة |
| `year` | عدد صحيح | نعم | 1990–2030 |
| `kilometers` | عدد صحيح | نعم | 0 فأكثر |
| `fuelType` | قائمة | نعم | `PETROL` `DIESEL` `HYBRID` `ELECTRIC` `PLUGIN_HYBRID` |
| `transmission` | قائمة | نعم | `MANUAL` `AUTOMATIC` `CVT` `DCT` `SEMI_AUTOMATIC` |
| `condition` | قائمة | نعم | `EXCELLENT` `VERY_GOOD` `GOOD` `FAIR` `NEEDS_MAINTENANCE` `NEEDS_INSPECTION` |
| `description` | نص | نعم | 20–5000 حرف |
| `price` | عدد | نعم | أكبر من صفر |
| `cityId` / `phone` / `color` | نص | نعم | — |
| `vin` | نص | لا | 17 حرفاً بالضبط |
| `ownerCount` | عدد صحيح | لا | 1–20 (افتراضي 1) |
| `doors` | عدد صحيح | لا | 1–7 (افتراضي 4) |
| `engineCapacity` | عدد | لا | 500–10000 |

```text
images[]   : حتى 10 ملفات (jpg/jpeg/png/webp/gif، لكل منها حد 10MB)
coverImage : صورة الغلاف
video      : ملف الفيديو المرفق
```

> فشل قراءة `FormData` يعيد 413، والتحقق الفاشل يعيد 422 مع `details`.

### فتح محادثة — POST /api/conversations

| الحقل | النوع | إلزامي | ملاحظات |
|---|---|---|---|
| `carId` | نص | لا | محادثة مرتبطة بإعلان |
| `sellerId` | نص | لا | محادثة مباشرة مع بائع |
| `content` | نص | لا | رسالة أولى |
| `bookingId` | نص | لا | محادثة مرتبطة بحجز |

```json
{ "carId": "clx...", "sellerId": "clx...", "content": "هل السيارة متوفرة؟" }
```

### إرسال رسالة — POST /api/messages

| الحقل | النوع | إلزامي | الحدود |
|---|---|---|---|
| `content` | نص | نعم | 1–5000 حرف |
| `receiverId` | نص | نعم | معرّف المستلم |
| `carId` | نص | لا | ربط الرسالة بإعلان |
| `conversationId` | نص | لا | محادثة قائمة |

```json
{ "receiverId": "clx...", "content": "السلام عليكم، ما آخر سعر؟", "carId": "clx..." }
```

### الإبلاغ عن إعلان — POST /api/reports

| الحقل | النوع | إلزامي | الحدود |
|---|---|---|---|
| `reason` | قائمة | نعم | `SPAM` `FAKE_PRICE` `WRONG_INFO` `SOLD` `DUPLICATE` `OFFENSIVE` `SCAM` `OTHER` |
| `description` | نص | لا | حتى 500 حرف |
| `carId` | نص | نعم | الإعلان المُبلَّغ عنه |

```json
{ "reason": "FAKE_PRICE", "description": "السعر غير واقعي", "carId": "clx..." }
```

### تقديم مزايدة — POST /api/auctions/[id]/bid

| الحقل | النوع | إلزامي | الحدود |
|---|---|---|---|
| `amount` | عدد | نعم | أكبر من صفر وقيمة منتهية |

```json
{ "amount": 12500 }
```

> المزايدة في آخر لحظتين تمدّد المزاد دقيقتين، ومحاولة مزايدة متأخرة تعيد 409، وتوقف المزادات يعيد 403.

### تقييم بثّ لحظي — POST /api/valuations/stream

| الحقل | النوع | إلزامي | الحدود |
|---|---|---|---|
| `carId` | نص | لا* | تقييم إعلان قائم |
| `spec` | كائن | لا* | مواصفات يدوية عند غياب `carId` |
| `targetPrice` | عدد | لا | سعر المستهدف للمقارنة |

```json
{ "carId": "clx...", "targetPrice": 9500 }
```

> يجب تقديم `carId` أو `spec` معاً؛ والأحداث الصادرة هي `stage` و`insufficient` و`result` و`done` و`error`.

### محادثة بثّ لحظي — POST /api/ai/chat/stream

| الحقل | النوع | إلزامي | الحدود |
|---|---|---|---|
| `messages` | مصفوفة | نعم | كل عنصر `{role, content}` ودور صالح |
| `sessionId` | نص | لا | متابعة جلسة سابقة |
| `model` | نص | لا | `glm` أو `minimax` أو `mistral` أو `gpt-oss` |
| `images` | مصفوفة | لا | صور مرفقة للتحليل |
| `userName` / `userRole` | نص | لا | سياق المستخدم |
| `carFlowStep` / `carFlowData` | نص / كائن | لا | استئناف مسار جمع بيانات السيارة |

```json
{ "messages": [{ "role": "user", "content": "أبحث عن سيارة عائلية" }],
  "sessionId": "s-123", "model": "glm", "userRole": "USER" }
```

الأحداث الصادرة هي `meta` ثم أحداث `token` متعددة ثم `done`، والمسار `/api/ai/chat` يعيد الرد كاملاً في JSON واحد.

### رفع ملف — POST /api/upload

| الحقل | النوع | إلزامي | الحدود |
|---|---|---|---|
| `file` | ملف | نعم | jpg/jpeg/png/webp/gif، حتى 10MB، ويُفحص بايت البداية |

```json
{ "success": true, "data": { "url": "https://...", "provider": "cloudinary" } }
```

### طلب توثيق التاجر — POST /api/trader/verification

| الحقل | النوع | إلزامي | الحدود |
|---|---|---|---|
| `notes` | نص | لا | حتى 1000 حرف |

```json
{ "notes": "سجل تجاري رقم 12345" }
```

### اختيار سيارة بالذكاء — POST /api/car-finder

| الحقل | النوع | إلزامي | الافتراضي |
|---|---|---|---|
| `dailyDistance` | عدد (نص رقمي) | لا | 30 كم |
| `passengers` | عدد (نص رقمي) | لا | 2 |
| `budget` | عدد (نص رقمي) | لا | 20000 |
| `preference` | نص | لا | — |
| `fuelPreference` | نص | لا | يُستخدم كفلتر وقود |
| `bodyType` | نص | لا | يُستخدم كفلتر هيكل |

```json
{ "dailyDistance": "60", "passengers": "4", "budget": "15000",
  "preference": "economy", "fuelPreference": "HYBRID", "bodyType": "SUV" }
```

الخادم يسحب حتى 50 سيارة نشطة ثم يرتّبها بدرجة مطابقة وأسباب مقروءة.

[[PAGEBREAK]]

## حدود المعدل

الحد المركزي معرّف في `src/lib/rate-limit.ts` كثوابت ثابتة، ولكل ثابت نافذة زمنية وعدد مسموح.

### الثوابت المعرّفة

| الثابت | النافذة | الحد | أين يُستخدم |
|---|---|---|---|
| `LOGIN` | 15 دقيقة | 5 | `/api/auth/login` |
| `REGISTER` | 15 دقيقة | 3 | `/api/auth/register` |
| `UPLOAD` | 60 ثانية | 20 | `/api/upload` |
| `AI` | 60 ثانية | 30 | أدوات الذكاء الاصطناعي |
| `AI_CHAT` | 60 ثانية | 20 | `/api/ai/chat` و `/api/ai/chat/stream` |
| `MESSAGE` | 60 ثانية | 30 | غير مستخدم حالياً |
| `FORUM` | 60 ثانية | 10 | `/api/forum/topics` و `/api/forum/posts` |
| `CONTACT` | 60 ثانية | 5 | `/api/contact` |
| `RATING` | 60 ثانية | 10 | غير مستخدم حالياً |
| `WANTED` | 60 ثانية | 10 | `/api/wanted` |
| `CAR_CREATE` | 60 ثانية | 5 | غير مستخدم حالياً |
| `GENERAL` | 60 ثانية | 200 | `/api/wanted/[id]/offers` |

> ثلاثة ثوابت معرّفة ولا يُستدعى أي منها في أي مسار: `MESSAGE` و`RATING` و`CAR_CREATE`.
> لذلك لا يوجد حدٍّ لإرسال الرسائل أو التقييمات أو نشر السيارة، ولا تفترض وجودها.

### حدود مخصّصة داخل المسارات

بعض المسارات تتجاوز الثوابت بحدّ محلي مكتوب في الملف نفسه:

| المفتاح | النافذة | الحد | المسار |
|---|---|---|---|
| `otp:${ip}` | 60 ثانية | 3 | `/api/auth/send-otp` |
| `verify-otp:${ip}` | 60 ثانية | 10 | `/api/auth/verify-otp` |
| `login-otp:${ip}` | 15 دقيقة | 5 | `/api/auth/login-otp` |
| `verify-login-otp:${ip}` | 15 دقيقة | 10 | `/api/auth/verify-login-otp` |
| `google-login:${ip}` | 15 دقيقة | 10 | `/api/auth/google` |
| `forgot-password:${ip}` | 60 ثانية | 3 | `POST /api/auth/forgot-password` |
| `reset-password:${ip}` | 60 ثانية | 5 | `PUT /api/auth/forgot-password` |
| `bulk-import:${user.id}` | 10 دقائق | 5 | `/api/cars/bulk-import` |
| `viewers:${ip}` | 60 ثانية | 60 | `/api/cars/[id]/viewers` |
| `client-errors:${ip}` | 60 ثانية | 20 | `/api/client-errors` |
| `reminders:${user.id}` | 60 ثانية | 20 | `/api/reminders` |
| `story:${user.id}` | ساعة | 20 | `POST /api/stories` |
| `verify-req:${user.id}` | ساعة | 3 | `/api/trader/verification` |
| `follow:${viewer.id}` | 60 ثانية | 30 | `POST /api/users/[id]/follow` |

### خريطة مفاتيح الثوابت

تُبنى المفاتيح من جزء ثابت ثم النطاق المطبَّق عليه، وهذا تحديد من يشترك في العدّاد:

| الجزء الثابت | النطاق | السياسة |
|---|---|---|
| `login` و `register` | عنوان IP | `LOGIN` و `REGISTER` |
| `upload` و `contact` | عنوان IP | `UPLOAD` و `CONTACT` |
| `forum-topic` و `forum-post` | معرّف المستخدم | `FORUM` |
| `wanted` | معرّف المستخدم | `WANTED` |
| `wanted-offer` | معرّف المستخدم | `GENERAL` |
| `ai-chat` و `ai-chat-stream` | معرّف المستخدم | `AI_CHAT` |
| `ai-customs` و `ai-inspection` و `ai-purchase` | معرّف المستخدم | `AI` |
| `ai-review` و `ai-desc` و `ai-market` و `ai-personality` | عنوان IP | `AI` |
| `ai-analysis` و `ai-price` و `ai-search` | عنوان IP | `AI` |
| `sound-analyze` | معرّف المستخدم ثم IP | `AI` |

عنوان IP يُقرأ من `x-real-ip` ثم من أول عنوان عام في `x-forwarded-for`.
النسخة المتزامنة تعتمد على ذاكرة داخل العملية، والنسخة غير المتزامنة تستخدم Upstash Redis إن وُجد ثم تعود للذاكرة.

[[PAGEBREAK]]

## ترقيم الصفحات

معظم قوائم القائمة تقبل `page` و `limit`، وبعضها ثابت العدد. اقرأ العمود الأخير لمعرفة شكل الظرف.

| المورد | الافتراضي | الأقصى | ملاحظات |
|---|---|---|---|
| `/api/cars` | 20 | 100 | `pagination` فيها `total` و `totalPages` و `hasMore` |
| `/api/conversations` | 20 | 50 | `pagination` فيها `page` و `limit` و `hasMore` |
| `/api/conversations/[id]/messages` | 200 | 200 | نفس القيمة للحد والافتراضي |
| `/api/bookings` | 20 | 50 | — |
| `/api/auctions` | 20 | 50 | — |
| `/api/forum/topics` | 20 | 50 | — |
| `/api/wanted` | 20 | 50 | — |
| `/api/parts` | 24 | 100 | — |
| `/api/deals` | 24 | 48 | قراءة من مصفوفة مُحمَّلة ثم قص |
| `/api/cars/[id]/reviews` | 20 | 50 | — |
| `/api/admin/cars` | 50 | 100 | `hasMore` فقط دون `total` |
| `/api/admin/reports` | 20 | 100 | — |
| `/api/admin/users` | 20 | 100 | — |
| `/api/admin/valuations` | 20 | 100 | — |
| `/api/admin/sentinel` | 30 | 100 | — |
| `/api/admin/subscriptions` | 20 | 100 | — |
| `/api/admin/audit-logs` | 50 | 200 | — |
| `/api/articles` | 20 | بلا سقف | يكفي تحديد `limit` |
| `/api/workshops` | 20 | بلا سقف | يكفي تحديد `limit` |
| `/api/workshops/[id]/reviews` | 20 | بلا سقف | — |
| `/api/workshops/[id]/appointments` | 20 | بلا سقف | — |
| `/api/workshops/[id]/ads` | 20 | بلا سقف | — |
| `/api/admin/workshops` | 20 | بلا سقف | — |
| `/api/admin/workshops/ads` | 20 | بلا سقف | — |
| `/api/admin/workshops/reports` | 20 | بلا سقف | — |
| `/api/cars/[id]/images` | `offset=6` و`limit=20` | 30 | يعتمد الإزاحة لا رقم الصفحة |
| `/api/messages` | 100 | ثابت | لا يوجد `page` |
| `/api/notifications` | 50 | ثابت | لا يوجد `page` |
| `/api/stories` | 100 | ثابت | لا يوجد `page` |
| `/api/cars/[id]/report` | 10 | ثابت | لا يوجد `page` |

> عند تجاوز الحد الأقصى يُقصّ الطلب إلى القيمة القصوى بدل إرجاع خطأ، فلا تعتمد على 422 للتحقق من `limit`.

[[PAGEBREAK]]

## نماذج أكواد

### استدعاء بـ curl

```bash
# 1) تسجيل الدخول وحفظ الكوكي
curl -c jar.txt -X POST 'http://localhost:3000/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"0791234567","password":"Passw0rd!"}'

# 2) قراءة الإعلانات بالكوكي المحفوظ
curl -b jar.txt 'http://localhost:3000/api/cars?page=1&limit=10'

# 3) أو باستخدام رمز Bearer مباشرة
curl 'http://localhost:3000/api/cars/my' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9'
```

### قراءة قائمة مع ترقيم الصفحات

```ts
type Page<T> = {
  success: boolean;
  data: T[];
  pagination?: { page: number; limit: number; hasMore: boolean };
};

export async function fetchCars(page = 1, limit = 20) {
  const res = await fetch(`/api/cars?page=${page}&limit=${limit}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body: Page<Car> = await res.json();
  if (!body.success) throw new Error('تعذر تحميل السيارات');
  return { cars: body.data, nextPage: body.pagination?.hasMore ? page + 1 : null };
}
```

### إرسال رسالة

```ts
export async function sendMessage(receiverId: string, content: string, carId?: string) {
  const res = await fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ receiverId, content, carId }),
  });
  const body = await res.json();
  if (res.status === 401) throw new Error('سجّل الدخول أولاً');
  if (res.status === 422) console.table(body.details);
  if (!body.success) throw new Error(body.error);
  return body.data;
}
```

### قراءة تقييم بثّ لحظي

```ts
export async function streamValuation(payload: { carId?: string; spec?: object }) {
  const res = await fetch('/api/valuations/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    for (const chunk of buffer.split('\n\n')) {
      const line = chunk.split('\n').find((l) => l.startsWith('data: '));
      if (!line) continue;
      const evt = JSON.parse(line.slice(6));
      if (evt.message) console.log('[valuation]', evt.message);
    }
  }
}
```

[[PAGEBREAK]]

## ملاحظات توافق

بعض المسارات القديمة صُدرت قبل اعتماد ظرف `success`/`data`، وستجدها تعيد أشكالاً مختلفة.

### ردود بلا ظرف

| المسار | الشكل المُعاد | أين يظهر |
|---|---|---|
| `/api/price-alerts` (GET) | مصفوفة خام | لا يوجد `success` |
| `/api/ratings` (GET) | مصفوفة خام | لا يوجد `success` |
| `/api/ratings` (POST) | كائن واحد بحالة 201 | لا يوجد `success` |
| `/api/realtime/token` | رمز نصّي مباشر | لا يوجد `data` |
| `/api/ai/car-review` | نتيجة التحليل مباشرة | لا يوجد `success` |
| `/api/health` | `{ok:true,t}` | بديل عن `success` |

### ردود `{error}` بدل `{success:false,error}`

| المسار | ملاحظة |
|---|---|
| `/api/auctions` و `/api/auctions/[id]` و `/api/auctions/[id]/bid` | يعيد `{error}` مع الحالة |
| `/api/forum/topics` و `/api/forum/topics/[id]` | يعيد `{error}` |
| `/api/forum/posts` و `/api/forum/posts/[id]` و `/api/forum/posts/[id]/report` | يعيد `{error}` |
| `/api/parts` و `/api/parts/[id]` | يعيد `{error}` |
| `/api/price-alerts` و `/api/price-alerts/[id]` | يعيد `{error}` |
| `/api/ratings` | يعيد `{error}` |
| `/api/ai/car-review` | يعيد `{error}` |

> راجع `error` أولاً ثم `success`؛ اعتمادك على `success` وحدها سيُعتبر نجاحاً زائفاً في هذه المسارات.
> كذلك نص `Unauthorized` القديم يقابل الرسالة العربية `غير مصرح لك بالوصول` في هذه القوائم.

### ترويسة الترميز المفقودة

157 ملفاً تمر عبر مساعدات `src/lib/api.ts` وترسل `charset=utf-8`، و46 ملفاً تبني الرد بـ `Response.json` مباشرة.
الملفات الستة والأربعون بلا ترويس تشمل مسارات متداولة مثل `/api/auth/login-otp` و`/api/auth/logout` و`/api/health` و`/api/upload` و`/api/contact`.
إن ظهرت الحروف العربية مشوّهة عندك، أضف قراءة الاستجابة بـ `TextDecoder('utf-8')` في العميل بدلاً من الاعتماد على المتصفح.

> هذه القائمة تُحدَّث مع توحيد المسارات الجديدة على `successResponse`؛ لا تفترض أن المسار القديم بقي كما هو بعد أي تحديث.
