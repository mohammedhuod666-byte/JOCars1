"""Arabic Report Data - Part 3: Deep Dives (Sections 14-29)"""

# ===================== القسم 14: تفصيل مسارات API =====================
API_DETAIL_TITLE = "تفصيل تطبيقات واجهة البرمجة API"

API_DETAIL_SECTIONS = {
    "نظام المصادقة (5 مسارات)": {
        "intro": (
            "يتضمن نظام المصادقة خمسة مسارات رئيسية تدير عملية تسجيل الدخول والخروج وإدارة الحساب. "
            "يعمل النظام بنمط JWT (JSON Web Token) مع HttpOnly cookies لحماية البيانات. "
            "كلمات المرور مشفرة باستخدام bcrypt مع 10 جولات تشفير."
        ),
        "routes": [
            {
                "name": "تسجيل الدخول - POST /api/auth/login",
                "lines": 85,
                "auth": "عامة (بدون مصادقة)",
                "description": "يعالج عملية تسجيل الدخول مع حماية متعددة الطبقات",
                "details": [
                    "التحقق من IP المحظور عبر isIPBlocked() لمنع الهجمات المعروفة",
                    "فحص Rate Limiting لكل IP عبر checkRateLimit() مع RATE_LIMITS.LOGIN",
                    "تتبع النشاط المشبوه - إذا تم تجاوز الحد، يتم حظر IP لمدة 30 دقيقة",
                    "قفل الحساب بعد 5 محاولات فاشلة مع إعادة ضبط عند النجاح",
                    "إنشاء JWT token عبر signToken() مع صلاحية 30 يوم",
                    "تعيين HttpOnly cookie عبر setAuthCookie()",
                    "إعادة بيانات المستخدم الكاملة (id, name, email, role, image, phone, whatsapp)",
                ],
                "error_handling": "رسائل خطأ بالعربية مع كود الحالة المناسب (400, 401, 403, 429)",
            },
            {
                "name": "إنشاء حساب - POST /api/auth/register",
                "lines": 99,
                "auth": "عامة (بدون مصادقة)",
                "description": "يدير تسجيل حسابات المستخدمين الجدد",
                "details": [
                    "فحص Honeypot (حقل website أو honeypot) لمنع البريد المزعج",
                    "دعم تسجيل حسابات التجار (TRADER) مع حقول خاصة (dealerName, commercialReg)",
                    "حسابات التجار تتطلب موافقة المدير (dealerVerified=false)",
                    "استخدام prisma.$transaction لإنشاء المستخدم بشكل ذري",
                    "إرسال إشعار للمدير عبر notifyAdmins() (NEW_TRADER أو NEW_USER)",
                    "إنشاء JWT token + cookie بعد التسجيل الناجح",
                ],
                "error_handling": "تحقق من تكرار البريد الإلكتروني مع رسالة خطأ عربية واضحة",
            },
            {
                "name": "الملف الشخصي - GET/PUT /api/auth/profile",
                "lines": 51,
                "auth": "مطلوبة (مصادقة المستخدم)",
                "description": "عرض وتعديل الملف الشخصي للمستخدم",
                "details": [
                    "GET: إعادة البيانات الكاملة مع حقول البائع (dealerVerified, dealerViewCount, dealerBannerImage)",
                    "PUT: تحديث الملف الشخصي مع تحقق Zod عبر updateProfileSchema",
                    "تحديث مرن - كل حقل يُحدّث بشكل مستقل",
                ],
                "error_handling": "401 إذا لم يتم المصادقة",
            },
            {
                "name": "إرسال OTP - POST /api/auth/send-otp",
                "lines": 59,
                "auth": "مطلوبة",
                "description": "إرسال رمز التحقق عبر WhatsApp",
                "details": [
                    "تخزين OTP في ذاكرة مؤقتة (Map) مع انتهاء الصلاحية بعد 5 دقائق",
                    "Rate Limiting: 3 طلبات في الدقيقة لكل IP",
                    "التحقق من صحة رقم الهاتف الأردني: /^(?:\\+?962|0)?7[789]\\d{7}$/",
                    "تنسيق الرقم تلقائياً: 07X... إلى +9627X...",
                    "إرسال عبر WhatsApp باستخدام sendWhatsApp()",
                ],
                "error_handling": "رسائل خطأ واضحة لرقم الهاتف غير الصالح",
            },
            {
                "name": "التحقق من OTP - POST /api/auth/verify-otp",
                "lines": 59,
                "auth": "مطلوبة",
                "description": "التحقق من رمز OTP وتفعيل رقم الهاتف",
                "details": [
                    "مشاركة OTP store مع send-otp عبر الاستيراد",
                    "التحقق من الرمز والصلاحية",
                    "حذف OTP بعد الاستخدام بنجاح",
                    "تحديث phone, whatsapp, phoneVerified=true في قاعدة البيانات",
                ],
                "error_handling": "رسائل خطأ للرمز غير صحيح أو منتهي الصلاحية",
            },
        ],
    },
    "نظام السيارات (18 مسار)": {
        "intro": (
            "نظام السيارات هو العمود الفقري للمنصة مع 18 مساراً API يغطي جميع العمليات. "
            "يتضمن إنشاء القوائم، إدارة الصور، التعليقات، التقييمات، الحجوزات، والمزيد. "
            "يتميز بفلاتر البحث المتقدمة ونظام السجل المرجعي الفريد (refCode)."
        ),
        "routes": [
            {
                "name": "السيارات - GET/POST /api/cars",
                "lines": 343,
                "auth": "GET: اختيارية | POST: مطلوبة",
                "description": "مسار رئيسي لعرض وإنشاء قوائم السيارات",
                "details": [
                    "GET - عرض السيارات:",
                    "  فلاتر متعددة: brandId, modelId, cityId, fuelType, transmission, condition, bodyType, drivetrain, color",
                    "  نطاقات سعرية وسنوية ومسافة",
                    "  البحث بالنص الحر (query) مع دعم أكواد المرجع (refCode)",
                    "  كشف أنماط refCode: [A-Z]{1,3}\\d{1,4}-[A-Z]{3}",
                    "  ترتيب حسب: createdAt, price, year, kilometers, views, featured",
                    "  تصفية مخزنة مؤقتاً للمستخدمين غير المسجلين (15 ثانية TTL)",
                    "  عرض isFavorited للمستخدمين المسجلين",
                    "  paginate: page, limit, total, totalPages, hasMore",
                    "POST - إنشاء سيارة:",
                    "  قبول FormData مع صور (Cloudinary أو base64 كخيار بديل)",
                    "  التحقق من صلاحيات النشر (canPost) وحالة الحظر",
                    "  إنشاء slug وrefCode تلقائياً",
                    "  الحالة الافتراضية: PENDING (تنتظر موافقة المدير)",
                    "  تحليل سعر AI غير متزامن (fire-and-forget)",
                    "  إبطال التخزين المؤقت بعد الإنشاء",
                    "  إشعار المدير بقائمة جديدة",
                ],
            },
            {
                "name": "تفاصيل السيارة - GET/PUT/DELETE /api/cars/[id]",
                "lines": 123,
                "auth": "GET: اختيارية | PUT: مطلوبة (المالك أو المدير) | DELETE: مطلوبة (المدير فقط)",
                "description": "عرض وتعديل وحذف سيارة محددة",
                "details": [
                    "GET: بحث بالـ id أو slug مع lazy loading للصور",
                    "  حمّل 6 صور افتراضياً، configurable عبر imageLimit (حتى 20)",
                    "  trackView يزيد العدد بشكل غير متزامن",
                    "PUT: تحديث حقول محددة فقط (whitelisted fields)",
                    "DELETE: حذف ناعم مع إنشاء CarLog entry (SOFT_DELETED)",
                ],
            },
            {
                "name": "نظام المفضلة - GET/POST /api/cars/favorites",
                "lines": 55,
                "auth": "مطلوبة",
                "description": "إدارة قائمة السيارات المفضلة",
                "details": [
                    "GET: عرض جميع المفضلات مع mark, model, city, الصورة الأولى",
                    "POST: سلوك Toggle - إضافة/حذف مع تحديث عداد saves",
                    "مفتاح فريد مركب: carId_userId",
                ],
            },
            {
                "name": "نظام التعليقات - GET/POST /api/cars/[id]/comments",
                "lines": 43,
                "auth": "GET: عامة | POST: مطلوبة",
                "description": "إدارة التعليقات على السيارات",
                "details": [
                    "GET: عرض التعليقات مع معلومات المستخدم",
                    "POST: التحقق من حالة الحظر (carCommentBannedUntil) قبل الإضافة",
                ],
            },
            {
                "name": "نظام التقييمات - GET/POST /api/cars/[id]/reviews",
                "lines": 178,
                "auth": "GET: عامة | POST: مطلوبة",
                "description": "نظام تقييمات شامل للسيارات",
                "details": [
                    "POST: يتطلب bookingId - تأكيد أن الحجز مكتمل",
                    "تقييم واحد لكل مشتري لكل سيارة (@@unique)",
                    "حساب rating وreviewCount في transaction",
                    "تقييمات فرعية: carConditionRating, descriptionAccuracy, valueForMoney, dealerExperience",
                    "إرسال إشعار للتاجر عند إنشاء التقييم",
                ],
            },
            {
                "name": "نظام الحجوزات - POST /api/cars/bookings",
                "lines": 130,
                "auth": "مطلوبة",
                "description": "إنشاء حجوزات اختبار القيادة والشراء",
                "details": [
                    "حماية: السيارة يجب ألا تكون مملوكة للمحجز، يجب ألا تكون SOLD/DELETED",
                    "תאריך الزيارة يجب أن يكون في المستقبل",
                    "معالجة P2002 (قيود فريدة) بشكل ذكي - 409 إذا كان الحجز موجوداً",
                    "إنشاء إشعار للمالك عبر نظام المحادثات",
                    "تسجيل معلومات الاتصال (الاسم، الهاتف، البريد، المدينة، طريقة الاتصال)",
                ],
            },
            {
                "name": "تحليل السيارة - GET /api/ai/analysis/[id]",
                "lines": 265,
                "auth": "عامة",
                "description": "تحليل شامل للسيارة بالذكاء الاصطناعي",
                "details": [
                    "مهلة زمنية حرجة: 10 ثوانٍ لمنع صفحة 'لا يوجد إنترنت' في Chrome",
                    "مهلة 6 ثوانٍ على تقدير السعر (OpenSooq خارجي)",
                    "دمج: بيانات السيارة، قواعد بيانات مشابهة، تقدير السعر، تقييم الحالة",
                    "تقييم الحالة: هيكل خارجي، داخلي، غطاء المحرك",
                    "حساب الثقة بناءً على: الحقول المملوءة، عدد الصور، عدد السيارات المشابهة",
                ],
            },
        ],
    },
    "نظام ورش العمل (17 مسار)": {
        "intro": (
            "نظام ورش العمل يوفر حضوراً رقمياً شاملاً لورش العمل في الأردن. "
            "يتضمن إدارة الخدمات والمواعيد والأسعار والتقييمات والإعلانات. "
            "يتميز بنظام حجز المواعيد المتكامل مع نظام المحادثات."
        ),
        "routes": [
            {
                "name": "الورش - GET/POST /api/workshops",
                "lines": 207,
                "auth": "GET: عامة | POST: مطلوبة",
                "description": "عرض وإنشاء ورش العمل",
                "details": [
                    "GET: فلاتر متقدمة: بحث، خدمة، محافظة، مدينة، ماركة، موثوق، خدمة متنقلة، سحب، ضمان، منطقة انتظار، قطع غيار",
                    "ترتيب: تقييم، الأحدث، مشاهدات، تقييمات",
                    "POST: إنشاء في transaction مع خدمات، ماركات، أسعار متداخلة",
                    "حقول شاملة: ساعات/أيام العمل، الخبرة، عدد الموظفين، طرق الدفع، التخصصات",
                ],
            },
            {
                "name": "تقييمات الورشة - GET/POST /api/workshops/[id]/reviews",
                "lines": 143,
                "auth": "GET: عامة | POST: مطلوبة",
                "description": "نظام تقييمات غني لورش العمل",
                "details": [
                    "7 تقييمات فرعية: الجودة، السعر، السرعة، الخدمة، النظافة، الدقة، القطع",
                    "إعادة حساب متوسط التقييم ونسبة التوصية في transaction",
                    "معلومات إضافية: معلومات السيارة، تفاصيل الإصلاح، صور قبل/بعد",
                ],
            },
            {
                "name": "نظام المواعيد - GET/POST /api/workshops/[id]/appointments",
                "lines": 156,
                "auth": "مطلوبة",
                "description": "إدارة مواعيد ورش العمل",
                "details": [
                    "GET: المالك يرى جميع المواعيد، المستخدمون يرون مواعيدهم فقط",
                    "POST: إنشاء في transaction مع زيادة عداد المواعيد",
                    "إنشاء رسالة إشعار تلقائي لمالك الورشة عبر نظام المحادثات",
                ],
            },
            {
                "name": "لوحة تحكم الورشة - dashboard endpoints",
                "lines": 350,
                "auth": "مطلوبة (مالك الورشة)",
                "description": "مجموعة نقاط نهاية لإدارة الورشة من لوحة التحكم",
                "details": [
                    "dashboard/info: عرض وتحديث معلومات الورشة",
                    "dashboard/services: إدارة الخدمات",
                    "dashboard/prices: إدارة الأسعار",
                    "dashboard/brands: إدارة الماركات المدعومة",
                    "dashboard/reviews: إدارة التقييمات",
                    "dashboard/appointments: إدارة المواعيد مع تحديث الحالة والسعر",
                    "dashboard/ads: إدارة الإعلانات الترويجية",
                    "dashboard/stats: إحصائيات الورشة",
                ],
            },
        ],
    },
    "نظام المزادات (3 مسارات)": {
        "intro": (
            "نظام المزادات يوفر بيئة مزاد حية للسيارات. "
            "يتضمن تقديم العروض والتحديث اللحظي للأسعار ونظام الفوز التلقائي. "
            "يستخدم المعاملات الذرية لضمان سلامة البيانات أثناء العروض المتزامنة."
        ),
        "routes": [
            {
                "name": "المزادات - GET/POST /api/auctions",
                "lines": 79,
                "auth": "GET: اختيارية | POST: مطلوبة",
                "description": "عرض وإنشاء المزادات",
                "details": [
                    "GET: ثلاثة أوضاع - all (عامة), seller (مبيعاتي), bidder (عروضي)",
                    "POST: التحقق من ملكية السيارة ومنع المزادات المكررة",
                ],
            },
            {
                "name": "تقديم عرض - POST /api/auctions/[id]/bid",
                "lines": 43,
                "auth": "مطلوبة",
                "description": "تقديم عرض مزاد جديد",
                "details": [
                    "التحقق: المزاد موجود ونشط وغير منتهي والمحجز ليس البائع",
                    "المبلغ >= currentPrice + minBidIncrement",
                    "معاملة ذرية: تحديث المزاد + إنشاء العرض",
                    "إشعار للمزاجز السابقين عبر BID_OUTBID",
                ],
            },
        ],
    },
    "نظام المنتدى (6 مسارات)": {
        "intro": (
            "منتدى تفاعلي لإدارة المعرفة المجتمعية. "
            "يتضمن أقساماً ومواضيع ومنشورات مع نظام بلاغات وتقييمات. "
            "يدعم الصور المدمجة والردود المتداخلة."
        ),
        "routes": [
            {
                "name": "أقسام المنتدى - GET /api/forum/categories",
                "lines": 42,
                "auth": "عامة",
                "description": "عرض جميع أقسام المنتدى مع إحصائيات",
                "details": [
                    "عدد المواضيع والمنشورات لكل قسم (محسوب ديناميكياً)",
                    "معلومات آخر موضوع في كل قسم",
                ],
            },
            {
                "name": "المواضيع - GET/POST /api/forum/topics",
                "lines": 81,
                "auth": "GET: عامة | POST: مطلوبة",
                "description": "عرض وإنشاء مواضيع المنتدى",
                "details": [
                    "GET: فلترة حسب categorySlug، المواضيع المثبتة أولاً",
                    "POST: Rate limiting + فحص الحظر + تنقية المحتوى",
                    "حدود: العنوان 200 حرف، المحتوى 10,000 حرف",
                    "دعم الصور المدمجة في المحتوى",
                ],
            },
            {
                "name": "إدارة الموضوع - GET/PATCH/DELETE /api/forum/topics/[id]",
                "lines": 90,
                "auth": "GET: عامة | PATCH/DELETE: مطلوبة",
                "description": "عرض وتعديل وحذف موضوع محدد",
                "details": [
                    "GET: بحث بالـ id أو slug مع جميع المنشورات",
                    "PATCH: إجراءات: like, toggleSolved, toggleLocked, togglePinned",
                    "DELETE: حذف متسلسل للمنشورات أولاً",
                ],
            },
            {
                "name": "المنشورات - POST /api/forum/posts",
                "lines": 48,
                "auth": "مطلوبة",
                "description": "إنشاء منشور جديد في موضوع",
                "details": [
                    "التحقق من أن الموضوع غير مقفل",
                    "دعم الردود المتداخلة عبر replyToId, replyToUser, replyToContent",
                    "تحديث lastPostAt على الموضوع",
                ],
            },
        ],
    },
    "نظام المحادثات (2 مسار)": {
        "intro": (
            "نظام المحادثات الفورية بين المستخدمين. "
            "يتضمن إنشاء المحادثات وإدارة الرسائل مع إشعارات WhatsApp. "
            "يتكامل مع حجوزات السيارات وورش العمل."
        ),
        "routes": [
            {
                "name": "المحادثات - GET/POST /api/conversations",
                "lines": 215,
                "auth": "مطلوبة",
                "description": "عرض وإنشاء محادثات جديدة",
                "details": [
                    "GET: جميع المحادثات مع آخر رسالة وعد غير مقروء",
                    "POST: مساران - مرتبط بالحجز أو قياسي",
                    "إنشاء محادثة مع Upsert (دمج المحادثات غير المرتبطة)",
                    "إرسال إشعار NEW_MESSAGE للمالك",
                    "تكامل WhatsApp: إرسال رسالة واتساب إذا كان المالك مفعلاً",
                ],
            },
        ],
    },
    "نظام التذاكر (2 مسار)": {
        "intro": (
            "نظام دعم فني عبر التذاكر. "
            "يتضمن إنشاء التذاكر والرد عليها مع إشعارات WhatsApp. "
            "يدعم تصنيف التذاكر وتعيين المدير المسؤول."
        ),
        "routes": [
            {
                "name": "التذاكر - GET/POST /api/tickets",
                "lines": 67,
                "auth": "مطلوبة",
                "description": "عرض وإنشاء تذاكر الدعم",
                "details": [
                    "GET: تذاكر المستخدم مع فلترة حسب الحالة",
                    "POST: إنشاء تذكرة مع أول رسالة",
                    "إرسال إشعار WhatsApp للمديرين عبر sendWhatsAppToAdmins()",
                ],
            },
            {
                "name": "تفاصيل التذكرة - GET/POST/PATCH /api/tickets/[id]",
                "lines": 114,
                "auth": "مطلوبة (صاحب التذكرة أو المدير)",
                "description": "عرض والرد على تحديث حالة التذكرة",
                "details": [
                    "GET: التذكرة الكاملة مع خيط الرسائل",
                    "POST: إضافة رد - رد المدير يغير الحالة إلى IN_PROGRESS تلقائياً",
                    "PATCH: تحديث الحالة - المستخدم يغلق فقط، المدير يتحكم بالحالة + التعيين",
                    "إرسال إشعار WhatsApp للمستخدم عند رد المدير",
                ],
            },
        ],
    },
    "نظام التحليل بالذكاء الاصطناعي (13 مسار)": {
        "intro": (
            "تستفيد المنصة من NVIDIA AI API لتوفير 13 أداة ذكاء اصطناعي متنوعة. "
            "تشمل المحادثة الذكية وتقدير الأسعار وتحليل السوق وتوليد الأوصاف. "
            "تدعم 4 نماذج ذكاء اصطناعي مع نظام fallback محكم."
        ),
        "routes": [
            {
                "name": "المحادثة البث المباشر - POST /api/ai/chat/stream",
                "lines": 1148,
                "auth": "عامة (تقبل userName اختيارياً)",
                "description": "أكبر ملف في قاعدة الكود - محادثة ذكية بث مباشر",
                "details": [
                    "SSE streaming مع أحداث: meta, token, done",
                    "نظام كشف النوايا: 14 نية (car_search, workshop, parts, price_analysis, car_listing, navigation, etc.)",
                    "normalizeDialect(): تحويل اللهجة إلى الفصحى",
                    "parseNaturalLanguageQuery(): استخراج العلامات من النص العربي",
                    "carFlowStore: حالة المحادثة مع fallback عميل Stateless",
                    "ذاكرة المحادثة: Map مع 30 دقيقة TTL، 20 رسالة كحد أقصى",
                    "بيانات السوق الخارجية: fetchOpenSooqListings()",
                    "نظام التنقل: كشف الصفحة المطلوبة من اللغة الطبيعية",
                    "نظام refCode: كشف أنماط مثل S44-XBY مع تقرير كامل",
                    "نظام брендات الأسعار: قيم مخزنة لأكثر من 15 ماركة",
                    "17 قاعدة في System Prompt",
                ],
            },
            {
                "name": "حاسبة الجمارك - POST /api/ai/customs",
                "lines": 121,
                "auth": "عامة",
                "description": "حاسبة الرسوم الجمركية الأردنية",
                "details": [
                    "处理 EV, Hybrid, و Petrol/Diesel بشكل مختلف",
                    "إهلاك العمر: 5% سنوياً، 25% كحد أقصى",
                    "طبقات الضريبة حسب سعة المحرك (1600cc, 2000cc, 3000cc, 3000cc+)",
                    "حسابات: رسوم جمركية 5%، ضريبة خاصة، ضريبة قيمة مضافة 16%، رسوم تسجيل 150 دينار",
                ],
            },
            {
                "name": "مطابقة الشخصية - POST /api/ai/personality-match",
                "lines": 120,
                "auth": "عامة",
                "description": "اختبار شخصية يربط المستخدم مع السيارة المناسبة",
                "details": [
                    "5 أسئلة بالضبط، أبعاد شخصية عبر calculatePersonality()",
                    "نوع الشخصية: اسم عربي + إنجليزي + وصف + emoji + لون",
                    "توصيات سيارات بناءً على الماركات المفضلة والأنواع",
                ],
            },
            {
                "name": "تحليل الصوت - POST /api/ai/sound",
                "lines": 33,
                "auth": "عامة",
                "description": "تشخيص مشاكل المحرك عبر تحليل الصوت",
                "details": [
                    "استقبال خصائص الصوت (dominantFrequency, etc.)",
                    "تحديد نمط الصوت عبر identifySoundPattern()",
                    "إنشاء تشخيص عبر generateDiagnosis()",
                ],
            },
        ],
    },
}


# ===================== القسم 15: تفصيل نماذج قاعدة البيانات =====================
DB_DETAIL_TITLE = "تفصيل نماذج قاعدة البيانات"
DB_DETAIL_DESC = (
    "يحتوي الـ schema على 1757 سطراً يعرّف أكثر من 50 نموذج مع "
    "أكثر من 120 علاقة و50 فهرس. كل نموذج مُوثّق بتعليقات ويتبع "
    "اتفاقيات تسمية واضحة."
)

DB_MODEL_DETAILS = {
    "النموذج الأساسي - User": {
        "desc": (
            "النموذج الأساسي الذي يمثل كل مستخدم في المنصة. "
            "يدعم الأدوار المتعددة (USER, ADMIN, TRADER) مع حقول البائع الموسعة."
        ),
        "fields": [
            ("id", "String", "@id @default(cuid())", "المعرّف الفريد"),
            ("email", "String", "@unique", "البريد الإلكتروني"),
            ("name", "String", "required", "اسم المستخدم"),
            ("phone", "String?", "@unique", "رقم الهاتف (اختياري)"),
            ("password", "String", "required", "كلمة المرور المشفرة (bcrypt)"),
            ("role", "UserRole", "@default(USER)", "دور المستخدم (USER/ADMIN/TRADER)"),
            ("image", "String?", "nullable", "صورة الملف الشخصي"),
            ("whatsapp", "String?", "nullable", "رقم واتساب"),
            ("dealerName", "String?", "nullable", "اسم الورشة/البائع"),
            ("dealerDescription", "String?", "nullable", "وصف البائع"),
            ("dealerAddress", "String?", "nullable", "عنوان البائع"),
            ("dealerLogo", "String?", "nullable", "شعار البائع"),
            ("dealerBannerImage", "String?", "nullable", "صورة البانر"),
            ("dealerVerified", "Boolean", "@default(false)", "موثقة أم لا"),
            ("dealerViewCount", "Int", "@default(0)", "عدد مشاهدات ملف البائع"),
            ("phoneVerified", "Boolean", "@default(false)", "موثقة أم لا"),
            ("failedLoginAttempts", "Int", "@default(0)", "محاولات الدخول الفاشلة"),
            ("lockedUntil", "DateTime?", "nullable", "وقت انتهاء القفل"),
            ("lastLoginAt", "DateTime?", "nullable", "آخر تسجيل دخول"),
            ("lastLoginIp", "String?", "nullable", "IP آخر تسجيل دخول"),
            ("banStatus", "BanStatus", "@default(NONE)", "حالة الحظر"),
            ("bannedUntil", "DateTime?", "nullable", "وقت انتهاء الحظر"),
            ("whatsappNotifications", "Boolean", "@default(true)", "إشعارات واتساب"),
        ],
        "relations": [
            "User 1:N Car - السيارات المنشورة",
            "User 1:N Favorite - المفضلات",
            "User 1:N Conversation - المحادثات",
            "User 1:N Message - الرسائل",
            "User 1:N Ticket - التذاكر",
            "User 1:N ForumTopic - مواضيع المنتدى",
            "User 1:N ForumPost - منشورات المنتدى",
            "User 1:N Workshop - ورش العمل المملوكة",
            "User 1:N Auction - المزادات",
            "User 1:N Bid - العروض",
            "User 1:N UserGarage - الجراج الشخصي",
        ],
    },
    "النموذج الرئيسي - Car": {
        "desc": (
            "النموذج الأكبر والأهم في النظام. يمثل إعلان بيع سيارة واحد. "
            "يتضمن أكثر من 40 حقلاً مع صور وتقييمات وسجل مشاهدات."
        ),
        "fields": [
            ("id", "String", "@id @default(cuid())", "المعرّف الفريد"),
            ("slug", "String", "@unique", "الرابط المختصر"),
            ("refCode", "String", "@unique", "الكود المرجعي الفريد"),
            ("title", "String?", "nullable", "عنوان الإعلان"),
            ("description", "String", "required", "وصف السيارة"),
            ("price", "Float", "required", "السعر بالدينار الأردني"),
            ("year", "Int", "required", "سنة الصنع"),
            ("kilometers", "Int", "required", "المسافة المقطوعة بالكيلومتر"),
            ("fuelType", "FuelType", "required", "نوع الوقود"),
            ("transmission", "Transmission", "required", "نوع ناقل الحركة"),
            ("color", "String", "required", "اللون"),
            ("drivetrain", "Drivetrain", "required", "نوع الدفع"),
            ("condition", "CarCondition", "required", "حالة السيارة"),
            ("bodyType", "BodyType?", "nullable", "نوع الهيكل"),
            ("doors", "Int?", "nullable", "عدد الأبواب"),
            ("engineCapacity", "Float?", "nullable", "سعة المحرك"),
            ("cylinders", "Int?", "nullable", "عدد الأسطوانات"),
            ("seats", "Int?", "nullable", "عدد المقاعد"),
            ("status", "CarStatus", "@default(PENDING)", "حالة الإعلان"),
            ("views", "Int", "@default(0)", "عدد المشاهدات"),
            ("saves", "Int", "@default(0)", "عدد الحفظ في المفضلة"),
            ("rating", "Float?", "nullable", "متوسط التقييم"),
            ("reviewCount", "Int", "@default(0)", "عدد التقييمات"),
            ("featured", "Boolean", "@default(false)", "مميز أم لا"),
            ("isNew", "Boolean", "@default(false)", "جديد أم لا"),
            ("fairPriceEstimate", "Float?", "nullable", "تقدير السعر العادل"),
            ("aiScore", "Float?", "nullable", "نتيجة تحليل AI"),
            ("soldAt", "DateTime?", "nullable", "وقت البيع"),
            ("deletedAt", "DateTime?", "nullable", "وقت الحذف الناعم"),
            ("deletedBy", "String?", "nullable", "من حذف"),
            ("createdAt", "DateTime", "@default(now())", "وقت الإنشاء"),
            ("updatedAt", "DateTime", "@updatedAt", "وقت آخر تحديث"),
        ],
        "relations": [
            "Car N:1 Brand - الماركة",
            "Car N:1 CarModel - الطراز",
            "Car N:1 City - المدينة",
            "Car N:1 User - البائع",
            "Car 1:N CarImage - الصور (حتى 20)",
            "Car 1:N CarView - سجل المشاهدات",
            "Car 1:N CarViewer - المشاهدون الفعليون",
            "Car 1:N CarComment - التعليقات",
            "Car 1:N CarReview - التقييمات",
            "Car 1:N CarHistory - سجل الصيانة",
            "Car 1:N CarReminder - تذكيرات الصيانة",
            "Car 1:N CarBooking - الحجوزات",
            "Car 1:N CarLog - سجل التغييرات",
            "Car 1:N Favorite - المفضلات",
            "Car 1:N Auction - المزادات",
            "Car 1:N ComparisonItem - عناصر المقارنة",
        ],
    },
    "نموذج ورشة العمل - Workshop": {
        "desc": (
            "يمثل ورشة عمل مسجلة في المنصة. يتضمن معلومات موسعة "
            "مع خدمات وماركات وأسعار وتقييمات."
        ),
        "fields": [
            ("id", "String", "@id @default(cuid())", "المعرّف"),
            ("name", "String", "required", "اسم الورشة"),
            ("description", "String", "required", "الوصف"),
            ("address", "String", "required", "العنوان"),
            ("phone", "String", "required", "رقم الهاتف"),
            ("whatsapp", "String?", "nullable", "رقم واتساب"),
            ("workingHours", "String?", "nullable", "ساعات العمل"),
            ("workingDays", "String?", "nullable", "أيام العمل"),
            ("experience", "Int?", "nullable", "سنوات الخبرة"),
            ("employeeCount", "Int?", "nullable", "عدد الموظفين"),
            ("rating", "Float", "@default(0)", "متوسط التقييم"),
            ("reviewCount", "Int", "@default(0)", "عدد التقييمات"),
            ("viewCount", "Int", "@default(0)", "المشاهدات"),
            ("appointmentCount", "Int", "@default(0)", "المواعيد"),
            ("status", "WorkshopStatus", "@default(PENDING)", "الحالة"),
            ("verified", "Boolean", "@default(false)", "موثقة"),
            ("mobileService", "Boolean", "@default(false)", "خدمة متنقلة"),
            ("towingService", "Boolean", "@default(false)", "خدمة سحب"),
            ("waitingArea", "Boolean", "@default(false)", "منطقة انتظار"),
            ("spareParts", "Boolean", "@default(false)", "قطع غيار"),
            ("paymentMethods", "Json?", "nullable", "طرق الدفع"),
            ("specialties", "Json?", "nullable", "التخصصات"),
            ("discountOffers", "Boolean", "@default(false)", "عروض خصم"),
        ],
        "relations": [
            "Workshop N:1 User - المالك",
            "Workshop 1:N WorkshopService - الخدمات",
            "Workshop 1:N WorkshopBrand - الماركات",
            "Workshop 1:N WorkshopPrice - الأسعار",
            "Workshop 1:N WorkshopReview - التقييمات",
            "Workshop 1:N WorkshopAppointment - المواعيد",
            "Workshop 1:N WorkshopAd - الإعلانات",
        ],
    },
    "نماذج المزادات - Auction & Bid": {
        "desc": (
            "نظام المزادات يتضمن نموذجين مترابطين: المزاد نفسه والعرض المقدم عليه."
        ),
        "fields_auction": [
            ("id", "String", "@id @default(cuid())", "المعرّف"),
            ("startPrice", "Float", "required", "سعر البداية"),
            ("currentPrice", "Float", "required", "السعر الحالي"),
            ("minBidIncrement", "Float", "@default(50)", "الحد الأدنى للزيادة"),
            ("reservePrice", "Float?", "nullable", "سعر الاحتياطي"),
            ("startTime", "DateTime", "required", "وقت البداية"),
            ("endTime", "DateTime", "required", "وقت النهاية"),
            ("status", "AuctionStatus", "@default(ACTIVE)", "الحالة"),
            ("winnerId", "String?", "nullable", "الفائز"),
        ],
        "fields_bid": [
            ("id", "String", "@id @default(cuid())", "المعرّف"),
            ("amount", "Float", "required", "مبلغ العرض"),
            ("status", "BidStatus", "@default(PENDING)", "الحالة"),
        ],
    },
    "نماذج المنتدى - ForumTopic & ForumPost": {
        "desc": (
            "المنتدى التفاعلي يتضمن موضوعات ومنشورات مع نظام بلاغات."
        ),
        "fields_topic": [
            ("id", "String", "@id @default(cuid())", "المعرّف"),
            ("title", "String", "required (max 200)", "العنوان"),
            ("content", "String", "required (max 10000)", "المحتوى"),
            ("images", "String[]", "@default([])", "الصور"),
            ("views", "Int", "@default(0)", "المشاهدات"),
            ("likes", "Int", "@default(0)", "الإعجابات"),
            ("isPinned", "Boolean", "@default(false)", "مثبت"),
            ("isSolved", "Boolean", "@default(false)", "محلول"),
            ("isLocked", "Boolean", "@default(false)", "مقفل"),
            ("slug", "String", "@unique", "الرابط المختصر"),
        ],
        "fields_post": [
            ("id", "String", "@id @default(cuid())", "المعرّف"),
            ("content", "String", "required (max 10000)", "المحتوى"),
            ("images", "String[]", "@default([])", "الصور"),
            ("likes", "Int", "@default(0)", "الإعجابات"),
            ("isHidden", "Boolean", "@default(false)", "مخفي"),
            ("isAnswer", "Boolean", "@default(false)", "إجابة مقبولة"),
            ("replyToId", "String?", "nullable", "رّد على"),
            ("replyToUser", "String?", "nullable", "اسم المستخدم"),
            ("replyToContent", "String?", "nullable", "المحتوى الأصلي"),
        ],
    },
    "نماذج الصوت - CarSoundRecording & SoundAnalysis": {
        "desc": (
            "نظام تسجيل وتحليل أصوات المحركات بالذكاء الاصطناعي."
        ),
        "fields_recording": [
            ("id", "String", "@id @default(cuid())", "المعرّف"),
            ("audioData", "Bytes", "required", "بيانات الصوت الخام"),
            ("audioType", "String", "required", "نوع الملف الصوتي"),
            ("title", "String?", "nullable", "العنوان"),
            ("description", "String?", "nullable", "الوصف"),
            ("duration", "Float?", "nullable", "المدة بالثواني"),
            ("carMake", "String", "required", "ماركة السيارة"),
            ("carModel", "String", "required", "طراز السيارة"),
            ("carYear", "Int", "required", "سنة الصنع"),
            ("engineRpm", "Int?", "nullable", "الدورات/دقيقة"),
            ("diagnosis", "String?", "nullable", "التشخيص"),
            ("confidence", "Float?", "nullable", "نسبة الثقة"),
            ("status", "RecordingStatus", "@default(PENDING)", "الحالة"),
        ],
        "fields_analysis": [
            ("id", "String", "@id @default(cuid())", "المعرّف"),
            ("pattern", "String", "required", "نمط الصوت"),
            ("confidence", "Float", "required", "نسبة الثقة"),
            ("severity", "String", "required", "الخطورة"),
            ("report", "String", "required", "التقرير"),
            ("recommendations", "Json", "required", "التوصيات"),
        ],
    },
}


# ===================== القسم 16: تفصيل المكونات React =====================
COMPONENTS_TITLE = "تفصيل المكونات React"
COMPONENTS_DESC = (
    "تتضمن المنصة أكثر من 46 مكوناً React قابلاً لإعادة الاستخدام. "
    "كل مكون يتبع معايير تصميم Velocity Elite مع دعم كامل RTL."
)

COMPONENT_DETAILS = [
    {
        "name": "HeroSection",
        "file": "src/components/HeroSection.tsx",
        "desc": "المكون الرئيسي للصفحة الرئيسية - تأثير سينمائي متعدد الطبقات",
        "features": [
            "صورة خلفية مع تأثير multi-layer depth",
            "تأثير Typewriter على العنوان الرئيسي",
            "شريط بحث مدمج مع glassmorphism",
            "Scroll indicator للتنقل السريع",
            "cta buttons مع تأثيرات hover",
            "تصميم متجاوب: موبايل + تابلت + سطح المكتب",
        ],
    },
    {
        "name": "CarCard",
        "file": "src/components/CarCard.tsx",
        "desc": "بطاقة عرض السيارة مع إضاءة محيطة وتأثيرات ذهبية",
        "features": [
            "صورة السيارة مع lazy loading",
            "السعر والماركة والطراز والسنة",
            "عداد المشاهدات والحفظ",
            "زر المفضلة مع تأثير toggle",
            "عرض الماركة والطراز",
            "اسم المدينة ورقم الهاتف",
            "إضاءة محيطة عند التمرير (gold hover)",
            "تصميم RTL كامل",
        ],
    },
    {
        "name": "Header / Navbar",
        "file": "src/components/Header.tsx",
        "desc": "شريط التنقل العلوي مع تأثير شفاف",
        "features": [
            "شفاف في الأعلى، يتحول للصلب عند التمرير",
            "شعار المنصة",
            "روابط التنقل الرئيسية",
            "زر تسجيل الدخول/الملف الشخصي",
            "عداد الإشعارات",
            "بحث سريع",
        ],
    },
    {
        "name": "MobileBottomNav",
        "file": "src/components/MobileBottomNav.tsx",
        "desc": "شريط التنقل السفلي للموبايل",
        "features": [
            "5 أيقونات رئيسية: الرئيسية، البحث، إضافة (+)، الرسائل، الحساب",
            "عداد غير مقروء على الرسائل",
            "تصميم sticky في الأسفل",
            "أيقونات نشطة بلون ذهبي",
        ],
    },
    {
        "name": "BrandsSection",
        "file": "src/components/BrandsSection.tsx",
        "desc": "قسم عرض ماركات السيارات مع carousel",
        "features": [
            "Carousel أفقي للماركات",
            "شعار كل ماركة مع عدد السيارات",
            "رابط للماركات المشابهة",
        ],
    },
    {
        "name": "FeaturedCars",
        "file": "src/components/FeaturedCars.tsx",
        "desc": "قسم السيارات المميزة في الصفحة الرئيسية",
        "features": [
            "عنوان القسم مع وصف",
            "شبكة CarCards (3-4 أعمدة)",
            "روابط عرض المزيد",
        ],
    },
    {
        "name": "LatestCars",
        "file": "src/components/LatestCars.tsx",
        "desc": "أحدث الإعلانات في الصفحة الرئيسية",
        "features": [
            "تحديث تلقائي بالبيانات الجديدة",
            "شبكة إعلانات ديناميكية",
        ],
    },
    {
        "name": "SearchBar",
        "file": "src/components/SearchBar.tsx",
        "desc": "شريط البحث الرئيسي مع تأثيرات زجاجية",
        "features": [
            "تأثير glassmorphism",
            "بحث بالنص الحر",
            "فلاتر سريعة (الماركة، المدينة، السنة)",
            "اقتراحات ذكية",
        ],
    },
    {
        "name": "SearchFilters",
        "file": "src/components/SearchFilters.tsx",
        "desc": "فلاتر البحث المتقدمة لصفحة السيارات",
        "features": [
            "فلاتر متعددة: ماركة، طراز، مدينة، سعر، سنة، مسافة",
            "نوع الوقود، ناقل الحركة، الحالة، نوع الهيكل",
            "色 (color)",
            "الدفع (drivetrain)",
            "زر إعادة تعيين الفلاتر",
            "عداد النتائج",
        ],
    },
    {
        "name": "CarImageGallery",
        "file": "src/components/CarImageGallery.tsx",
        "desc": "معرض صور السيارة مع lazy loading",
        "features": [
            "صورة رئيسية كبيرة",
            " thumbnails صغيرة",
            "عرض lightbox عند النقر",
            "تحمييل تدريجي للصور",
            "عداد الصور",
        ],
    },
    {
        "name": "AIChat",
        "file": "src/components/AIChat.tsx",
        "desc": "مكون المحادثة الذكية",
        "features": [
            "واجهة محادثة عربية",
            "اختيار النموذج (4 نماذج)",
            "إرسال رسائل نصية + صور",
            "عرض الإجابات مع تنسيق markdown",
            "أزرار اقتراح سريعة",
            "مؤشر الكتابة",
        ],
    },
    {
        "name": "Footer",
        "file": "src/components/Footer.tsx",
        "desc": "تذييل الصفحة مع روابط المنصة",
        "features": [
            "روابط سريعة",
            "معلومات الاتصال",
            "وسائل التواصل الاجتماعي",
            "حقوق النشر",
            "سياسة الخصوصية وشروط الاستخدام",
        ],
    },
    {
        "name": "CarFormSteps",
        "file": "src/components/CarFormSteps.tsx",
        "desc": "خطوات نموذج إضافة السيارة",
        "features": [
            "4 خطوات: المتطلبات الأساسية، التفاصيل الإضافية، معلومات الاتصال، الصور",
            "شريط تقدم",
            "تنقية البيانات في كل خطوة",
            "رفع الصور مع معاينة",
        ],
    },
    {
        "name": "MobileNav",
        "file": "src/components/MobileNav.tsx",
        "desc": "قائمة الموبايل الجانبية",
        "features": [
            "فتح/إغلاق بتأثير slide",
            "روابط التنقل الكاملة",
            "زر تسجيل الدخول/الخروج",
            "معلومات المستخدم",
        ],
    },
]


# ===================== القسم 17: تفصيل ملفات المكتبة =====================
LIB_TITLE = "تفصيل ملفات المكتبة والأدوات المساعدة"
LIB_DESC = (
    "تحتوي المجلدات src/lib, src/ai, src/hooks, src/stores, src/types "
    "على أكثر من 40 ملفاً يشكلون الأساس البرمجي للمنصة."
)

LIB_DETAILS = [
    {
        "name": "src/lib/auth.ts",
        "lines": 280,
        "desc": "نظام المصادقة المركزي",
        "features": [
            "signToken(payload): إنشاء JWT token مع صلاحية 30 يوم",
            "verifyToken(token): التحقق من JWT token",
            "hashPassword(password): تشفير كلمة المرور (bcrypt 10 جولات)",
            "comparePassword(password, hash): مقارنة كلمة المرور المشفرة",
            "setAuthCookie(response, token): تعيين HttpOnly cookie",
            "getAuthToken(request): استخراج token من الـ Headers أو Cookie",
            "authenticateRequest(request): استخراج المستخدم من الطلب ( Headers + Cookie fallback)",
            "requireRole(role): middleware للتحقق من دور المستخدم",
            "canPost(user): التحقق من صلاحية النشر (ليس محظوراً)",
            "notifyAdmins(data): إرسال إشعارات للمديرين",
        ],
    },
    {
        "name": "src/lib/prisma.ts",
        "lines": 45,
        "desc": "عميل قاعدة البيانات Prisma",
        "features": [
            "PrismaClient singleton pattern لتجنب اتصالات متعددة",
            "getCached(key, ttl, fetcher): تخزين مؤقت في الذاكرة",
            "invalidateCache(pattern): إبطال التخزين المؤقت",
            "globalForPrisma instance للبيئة Entwicklung",
        ],
    },
    {
        "name": "src/lib/cloudinary.ts",
        "lines": 120,
        "desc": "إدارة الصور عبر Cloudinary",
        "features": [
            "uploadImage(file): رفع صورة مع تحسين تلقائي",
            "deleteImage(publicId): حذف صورة",
            "optimizeImage(url, width, height): تحسين أبعاد الصورة",
            "cloudinary.v2.uploader.upload() مع folder: 'jo-cars'",
            "أنواع مدعومة: JPEG, PNG, WebP, GIF",
            "حد أقصى 5 ميجا لكل صورة",
        ],
    },
    {
        "name": "src/lib/csrf.ts",
        "lines": 60,
        "desc": "نظام CSRF token",
        "features": [
            "generateCSRFToken(): إنشاء token HMAC-SHA256",
            "validateCSRFToken(token): التحقق من صلاحية الـ token",
            "تشفير مع timestamp لمنع إعادة الاستخدام",
            "صلاحية 24 ساعة",
        ],
    },
    {
        "name": "src/lib/rate-limit.ts",
        "lines": 80,
        "desc": "نظام تحديد المعدل",
        "features": [
            "checkRateLimit(key, config): فحص Rate Limit per key",
            "RATE_LIMITS.LOGIN: 5 محاولات / 15 دقيقة",
            "RATE_LIMITS.REGISTER: 3 محاولات / 15 دقيقة",
            "RATE_LIMITS.AI_CHAT: 30 طلب / دقيقة",
            "RATE_LIMITS.FORUM: 5 طلبات / دقيقة",
            "تخزين في الذاكرة (Map) مع TTL",
        ],
    },
    {
        "name": "src/lib/sanitize.ts",
        "lines": 50,
        "desc": "تنقية المدخلات",
        "features": [
            "sanitizePlainText(text): تنقية نص عادي",
            "sanitizeHtml(html): تنقية HTML عبر DOMPurify",
            "إزالة script tags وأكواد JavaScript",
            "إزالة event handlers (onclick, onerror, etc.)",
        ],
    },
    {
        "name": "src/lib/ip-blacklist.ts",
        "lines": 70,
        "desc": "قائمة IPs المحظورة",
        "features": [
            "isIPBlocked(ip): فحص إذا كان IP محظوراً",
            "blockIP(ip, duration): حظر IP لمدة محددة",
            "trackSuspiciousActivity(ip): تتبع النشاط المشبوه",
            "escalateToBlock(ip): تصعيد الحظر تلقائياً",
            "تخزين في الذاكرة مع TTL",
        ],
    },
    {
        "name": "src/lib/audit.ts",
        "lines": 90,
        "desc": "نظام سجل المراجعة",
        "features": [
            "createAuditLog(action, userId, details): إنشاء سجل",
            "getAuditLogs(filters): استعلام السجلات",
            "الإجراءات المسجلة: BAN_USER, UNBAN_USER, UPDATE_USER_ROLE, DELETE_CAR, etc.",
            "تتبع IP والوقت والمستخدم المسؤول",
        ],
    },
    {
        "name": "src/lib/api.ts",
        "lines": 110,
        "desc": "مساعدات الاستجابة الموحدة",
        "features": [
            "successResponse(data, status): استجابة نجاح",
            "errorResponse(message, status): استجابة خطأ",
            "unauthorizedResponse(message): 401",
            "notFoundResponse(message): 404",
            "validationErrorResponse(errors): 422",
            "formatUnifiedResponse(data): تنسيق البيانات",
        ],
    },
    {
        "name": "src/lib/whatsapp.ts",
        "lines": 130,
        "desc": "تكامل WhatsApp",
        "features": [
            "sendWhatsApp(phone, message): إرسال رسالة واتساب",
            "sendWhatsAppToAdmins(message): إرسال للمديرين",
            "sendWhatsAppToUser(userId, message): إرسال لمستخدم محدد",
            "buildCarMessage(car): بناء رسالة سيارة",
            "buildBookingMessage(booking): بناء رسالة حجز",
            "تنسيق الرسائل بالعربية",
        ],
    },
    {
        "name": "src/ai/nvidia-client.ts",
        "lines": 85,
        "desc": "عميل NVIDIA AI API",
        "features": [
            "chatCompletion(model, messages, options): إكمال المحادثة",
            "chatCompletionJSON(model, messages): إكمال مع إخراج JSON",
            "streamChatCompletion(model, messages): بث مباشر",
            "النماذج المدعومة: gpt-oss, glm, minimax, mistral",
            "الأولوية الافتراضية: gpt-oss (openai/gpt-oss-120b)",
            "timeout configurable (الافتراضي: 30 ثانية)",
            "إعادة المحاولة: 3 مرات مع exponential backoff",
        ],
    },
    {
        "name": "src/ai/site-knowledge.ts",
        "lines": 150,
        "desc": "قاعدة معرفة الموقع للمساعد الذكي",
        "features": [
            "SITE_KNOWLEDGE: معلومات المنصة الكاملة",
            "INTENT_PATTERNS: أنماط كشف النوايا بالعربية",
            "14 نية: car_search, workshop, parts, price_analysis, car_listing, navigation, etc.",
            "أنماط car_listing: 25+ نمط قصير بالعربية المختصرة",
            "normalizeArabic(): تطبيع النص العربي للكشف الأفضل",
        ],
    },
    {
        "name": "src/ai/price-analysis.ts",
        "lines": 200,
        "desc": "نظام تحليل الأسعار بالذكاء الاصطناعي",
        "features": [
            "analyzeCarPrice(carData): تحليل شامل للسعر",
            "calculateFairPrice(attrs): حساب السعر العادل",
            "priceEstimator.process(): تقدير السعر بالذكاء الاصطناعي",
            "market_factors: عوامل السوق (العرض والطلب، العمر، المسافة)",
            "comparison with similar listings",
        ],
    },
    {
        "name": "src/ai/review-generator.ts",
        "lines": 120,
        "desc": "مولّد التقييمات بالذكاء الاصطناعي",
        "features": [
            "generateReview(text, language): إنشاء تقييم من نص المستخدم",
            "تحليل المشاعر (إيجابي/سلبي/محايد)",
            "استخراج النقاط الرئيسية",
            "إعادة صياغة احترافية",
        ],
    },
    {
        "name": "src/ai/description-generator.ts",
        "lines": 110,
        "desc": "مولّد الأوصاف للسيارات",
        "features": [
            "process(carData): توليد وصف احترافي",
            "دمج المواصفات الفنية مع لغة تسويقية",
            "إنشاء عناوين جذابة",
            "وصف شامل يغطي الحالة والمميزات",
        ],
    },
    {
        "name": "src/ai/smart-search.ts",
        "lines": 90,
        "desc": "نظام البحث الذكي باللغة الطبيعية",
        "features": [
            "process(query): تحليل الاستعلام",
            "استخراج: bodyType, fuelType, transmission, priceMax, isNew",
            "تحويل النص إلى فلاتر قاعدة بيانات",
        ],
    },
]


# ===================== القسم 18: Hooks و إدارة الحالة =====================
HOOKS_TITLE = "تفصيل Hooks وإدارة الحالة"
HOOKS_DESC = (
    "تتضمن المنصة hooks مخصصة لإدارة الحالة والمصادقة والتخزين المحلي."
)

HOOK_DETAILS = [
    {
        "name": "useAuth.ts",
        "file": "src/hooks/useAuth.ts",
        "desc": "Hook رئيسي لإدارة حالة المصادقة",
        "features": [
            "Zustand store مع persist middleware",
            "التخزين في localStorage تحت مفتاح 'jo-cars-auth'",
            "state: user, token, isAuthenticated, isLoading, _hydrated",
            "actions: login(), logout(), updateUser(), setToken()",
            "onRehydrateStorage callback مع _hydrated flag",
            "login() يخزن token في localStorage + HttpOnly cookie",
            "logout() يحذف token من المتصفح والـ cookie",
            "supports WhatsApp notifications toggle",
        ],
    },
    {
        "name": "useAutoLogout.ts",
        "file": "src/hooks/useAutoLogout.ts",
        "desc": "Auto logout عند انتهاء الصلاحية",
        "features": [
            "يحلل JWT token لاستخراج تاريخ الانتهاء",
            "يضبط timer للخروج قبل الانتهاء بـ 5 دقائق",
            "يتنقل تلقائياً لصفحة تسجيل الدخول",
            "ينظف localStorage و cookies",
        ],
    },
    {
        "name": "carFlowStore (stateless fallback)",
        "file": "src/app/api/ai/chat/stream/route.ts",
        "desc": "إدارة حالة تدفق إنشاء السيارة",
        "features": [
            "carFlowStore: Map في الذاكرة (server-side)",
            "key: sessionId, value: { step, data, userName, token }",
            "TTL: 30 دقيقة مع تنظيف تلقائي كل 5 دقائق",
            "Fallback عميل: carFlowStep + carFlowData في request body",
            "إعادة بناء الحالة من بيانات العميل عند عدم وجود session",
            "7 خطوات: brand → model → year/km → fuel/transmission → color/drivetrain → condition/price → city/description → phone → images → confirmation",
        ],
    },
    {
        "name": "useNavigation (AI Chat)",
        "file": "src/app/ai/page.tsx",
        "desc": "نظام التنقل من المساعد الذكي",
        "features": [
            "كشف تنبيهات navigate من استجابة AI chat",
            "تحويل Routes objects إلى URLs",
            "استخدام next/navigation router.push()",
            "إنشاء عناصر DOM ضئيلة للنقر",
            "manuallyTriggerClick() كخيار بديل",
        ],
    },
]


# ===================== القسم 19: Middleware والأمان =====================
MIDDLEWARE_TITLE = "تفصيل Middleware وطبقة الأمان"
MIDDLEWARE_DESC = (
    "يلتقط middleware.ts كل الطلبات الواردة ويطبق حماية متعددة الطبقات "
    "قبل وصولها إلى نقاط نهاية API."
)

MIDDLEWARE_DETAILS = [
    {
        "name": "Path Traversal Prevention",
        "desc": "منع تسلل مسارات الملفات",
        "details": [
            "كشف أنماط: ../, ..\\, %2e%2e, %252e%252e, ..%2f, ..%5c",
            "كشف كلمات مفتاحية خطرة: /etc/passwd, /proc/self, cmd.exe, /bin/sh",
            "كشف أسماء ملفات حساسة: .env, .git, web.config",
            "كشف وسوم HTML خبيثة: <script, javascript:, onerror=",
            "كشف SQL Injection: union select, drop table, --, ;",
            "كشف OS Command Injection: |, &&, ;, \\",],
    },
    {
        "name": "Geo Restriction",
        "desc": "تقييد الوصول جغرافياً",
        "details": [
            "إذن النطاقات: Railway, Vercel, localhost, ngrok",
            "يسمح بجميع الطلبات في وضع التطوير (NODE_ENV=development)",
            "يرسل 403 مع رسالة خطأ واضحة للطلبات المحظورة",
        ],
    },
    {
        "name": "Security Headers",
        "desc": "رؤوس الأمان الإضافية",
        "details": [
            "X-Powered-By: Removed",
            "X-Content-Type-Options: nosniff",
            "X-Frame-Options: DENY",
            "X-XSS-Protection: 1; mode=block",
            "Referrer-Policy: strict-origin-when-cross-origin",
            "Permissions-Policy: camera=(), microphone=(), geolocation=()",
        ],
    },
    {
        "name": "Authentication Flow",
        "desc": "تدفق المصادقة الكامل",
        "details": [
            "1. المستخدم يرسل credentials (email + password)",
            "2. server يتحقق من Rate Limit + IP Block + Account Lock",
            "3. Prisma يستعلم عن المستخدم عبر البريد الإلكتروني",
            "4. bcrypt يقارن كلمة المرور المشفرة",
            "5. إذا نجح: JWT token يُنشأ عبر signToken()",
            "6. HttpOnly cookie يُعين عبر setAuthCookie()",
            "7. المستخدم يُعاد مع token في response body",
            "8. المتصفح يخزن token في localStorage (Zustand persist)",
            "9. الطلبات اللاحقة ترسل Authorization: Bearer {token}",
            "10. authenticateRequest() يستخرج المستخدم من الطلب",
        ],
    },
    {
        "name": "Rate Limiting Details",
        "desc": "تفاصيل تحديد المعدل",
        "details": [
            "التسجيل الدخول: 5 محاولات / 15 دقيقة",
            "إنشاء حساب: 3 محاولات / 15 دقيقة",
            "المساعد الذكي: 30 طلب / دقيقة",
            "منتدى: 5 طلبات / دقيقة",
            "التقييمات: 10 طلبات / ساعة",
            "التذاكر: 3 طلبات / ساعة",
            "التخزين: Map في الذاكرة مع TTL",
            "التصعيد: تتبع النشاط المشبوه → حظر IP تلقائي",
        ],
    },
    {
        "name": "SQL Injection Protection",
        "desc": "حماية SQL Injection",
        "details": [
            "Prisma ORM: جميع الاستعلامات مُعاملة (parameterized)",
            "Middleware: كشف أنماط SQL Injection في URLs",
            "Zod Validation: التحقق من صحة جميع المدخلات",
            "DOMPurify: تنقية محتوى HTML",
        ],
    },
    {
        "name": "XSS Protection",
        "desc": "حماية Cross-Site Scripting",
        "details": [
            "DOMPurify: تنقية جميع محتوى HTML المُنشأ من المستخدمين",
            "CSP Headers: تقييد مصادر المحتوى",
            "HttpOnly Cookies: حماية JWT من XSS",
            "Input Validation: Zod schemas لكل endpoint",
            "Output Encoding: React يشفّر المخرجات تلقائياً",
        ],
    },
]


# ===================== القسم 20: تفصيل ملفات الإعدادات =====================
CONFIG_TITLE = "تفصيل ملفات الإعدادات والبنية التحتية"
CONFIG_DESC = (
    "تحتوي المنصة على عدة ملفات إعدادات تحدد سلوك النظام والنشر."
)

CONFIG_DETAILS = [
    {
        "name": "package.json",
        "lines": 89,
        "desc": "إعدادات المشروع والاعتمادات",
        "details": [
            "الاسم: jordan-cars-jobs",
            "الإطار: Next.js 15.3.4 مع App Router",
            "React 19.1.0",
            "Prisma 6.13.0",
            "TypeScript 5+",
            "Tailwind CSS 4.1.12",
            "Zustand 5.0.5",
            "bcryptjs 3.0.2",
            "jsonwebtoken 9.0.2",
            "zod 4.1.4",
            "recharts 3.1.0",
            "socket.io 4.8.1",
            "dompurify 3.2.6",
            "اركبت scripts: dev, build, start, lint, db:push, db:seed",
        ],
    },
    {
        "name": "Dockerfile",
        "lines": 50,
        "desc": "إعدادات بناء Docker للنشر على Railway",
        "details": [
            "المرحلة 1: node:20-bullseye-slim",
            "npm ci --ignore-scripts --legacy-peer-deps",
            "npx prisma generate",
            "npm run build",
            "المرحلة 2: node:20-bullseye-slim (إطار عمل خفيف)",
            "COPY node_modules, prisma, .next, public",
            "EXPOSE 3000",
            "CMD: node server.js",
        ],
    },
    {
        "name": "server.js",
        "lines": 241,
        "desc": "خادم Express مع Socket.IO",
        "details": [
            "إنشاء خادم Express مخصص",
            "إعداد Next.js handler",
            "Socket.IO لـ real-time messaging",
            "تشغيل prisma db push عند بدء التشغيل",
            "الاستماع على PORT (الافتراضي: 3000)",
            "إعداد CORS للمطور المحلي",
            "معالجة أخطاء غير متوقعة",
        ],
    },
    {
        "name": "tailwind.config.ts",
        "lines": 200,
        "desc": "إعدادات Tailwind CSS مع نظام Velocity Elite",
        "details": [
            "الخطوط: IBM Plex Sans, Be Vietnam Pro, IBM Plex Sans Arabic",
            "الألوان المخصصة: surface, gold, blue",
            "الظلال: soft, medium, heavy",
            "الحدود الزجاجية",
            "التأثيرات المخصصة: glass, gold-glow",
        ],
    },
    {
        "name": "next.config.js",
        "lines": 80,
        "desc": "إعدادات Next.js",
        "details": [
            "output: 'standalone' للنشر على Railway",
            "images.remotePatterns: images.unsplash.com",
            "webpack config لـ Prisma",
            "PowerShell: true لـ npm scripts",
            "TypeScript: ignoreBuildErrors true (للتطوير)",
            "ESLint: ignoreDuringBuilds true",
        ],
    },
    {
        "name": ".env",
        "lines": 25,
        "desc": "متغيرات البيئة",
        "details": [
            "DATABASE_URL: PostgreSQL (Neon Serverless)",
            "JWT_SECRET: [REDACTED - set via environment, never commit]",
            "NEXTAUTH_SECRET",
            "NVIDIA_API_KEY",
            "CLOUDINARY_URL",
            "NODE_ENV: production",
            "PORT: 3000",
        ],
    },
]


# ===================== القسم 21: دقة كشف النية بالعربية =====================
INTENT_TITLE = "نظام كشف النوايا باللغة العربية"
INTENT_DESC = (
    "نظام ذكي يكشف نوايا المستخدم من النص العربي المكتوب. "
    "يدعم اللهجة الأردنية والفصحى مع نظام تطبيع للنصوص."
)

INTENT_TABLE = [
    ("car_search", "car_search", "car", "بحث عن سيارات", "أبي سيارة / عايز باجة / دور على كامري"),
    ("workshop", "workshop", "wrench", "ورش عمل", "ورشة / صيانة / فحص / ميكانيكي"),
    ("parts", "parts", "cog", "قطع غيار", "قطعة / باب / محرّك / جير / فلتر"),
    ("price_analysis", "price_analysis", "dollar", "تحليل الأسعر", "كم سعرها / سعره / غالي / رخيص"),
    ("car_listing", "car_listing", "plus-circle", "إنشاء إعلان", "نبعل سيارة / حط إعلان / أبيع"),
    ("engine_sound", "engine_sound", "volume", "صوت المحرك", "صوت / طقعة / مشكلة صوت"),
    ("navigation", "navigation", "compass", "تنقل", "وديني على / روح / افتح"),
    ("selling", "selling", "tag", "نصائح البيع", "كيف أبيع / نصيحة بيع"),
    ("workshop_add", "workshop_add", "plus", "تسجيل ورشة", "سجّل ورشتي / حط ورشة"),
    ("negotiation", "negotiation", "handshake", "مساعد التفاوض", "فاوض / عرض / خصم"),
    ("ticket", "ticket", "ticket-alt", "تذكرة دعم", "مشكلة / دعم / شكاوى"),
    ("site_info", "site_info", "info", "معلومات الموقع", "شنو هالموقع / وين أنا"),
    ("ref_code", "ref_code", "barcode", "كود مرجعي", "S44-XBY / الكود"),
    ("general", "general", "comment", "محادثة عامة", "مرحبا / شكرا / أيشي"),
]

INTENT_PATTERNS_TABLE = [
    ("car_search", "أبي سيارة", "أبغى سيارة", "عايز عربية", "دور على", "بدي سيارة", "عندك سيارات", "في سيارات"),
    ("workshop", "ورشة", "ورشه", "صيانة", "فحص", "ميكانيكي", "كهربائي", "بدي ورشة"),
    ("parts", "قطعة", "قطع غيار", "باب", "محرّك", "جير", "فلتر", "كفرات"),
    ("price_analysis", "كم سعرها", "سعره", "غالي", "رخيص", "السعر", "تقدير"),
    ("car_listing", "نبعل", "حط إعلان", "أبيع", "نبيع", "حطيت", "إعلان بيع"),
    ("engine_sound", "صوت", "طقعة", "صوت محرّك", "صوت غريب", "طق"),
    ("navigation", "وديني", "روح", "افتح", "خذني", "ودينا"),
    ("ref_code", "الكود", "S44", "kod", "code", "مرجعي"),
]


# ===================== القسم 22: نظام التدفق Stateless =====================
STATELESS_TITLE = "نظام التدفق Stateless لإنشاء السيارة"
STATELESS_DESC = (
    "في الإصدار الأخير، تم تحويل تدفق إنشاء السيارة من الحالة المخزنة في الذاكرة "
    "إلى نمط Stateless يعتمد على بيانات العميل. هذا يحل مشكلة عدم استمرارية الحالة "
    "عبر مثيلات Railway المتعددة."
)

STATELESS_FLOW = [
    {
        "step": "الخطوة 1: كشف النية",
        "client": "المستخدم يكتب 'نبعل سيارة'",
        "server": "detectIntent() يكشف car_listing",
        "response": "meta event مع instructions: ابدأ بسؤال الماركة",
    },
    {
        "step": "الخطوة 2: جمع البيانات",
        "client": "يرد 'Toyota'",
        "server": "يتحقق من carFlowStep + carFlowData في request body",
        "response": "meta event: الماركة Toyota، السؤال التالي: الطراز",
    },
    {
        "step": "الخطوة 3-7: باقي الخطوات",
        "client": "يرد بالإجابات مع إرسال token + carFlowStep + carFlowData",
        "server": "يجمع البيانات في carFlowData ويرسل ملخصاً",
        "response": "meta event: ملخص كامل مع طلب التأكيد",
    },
    {
        "step": "الخطوة 8: التأكيد والنشر",
        "client": "يرد 'نعم' مع صور",
        "server": "يستخدم clientToken للمصادقة، ينشئ السيارة عبر POST /api/cars",
        "response": "meta event: تم النشر بنجاح + refCode + رابط",
    },
]

STATELESS_AUTH_FLOW = [
    "1. العميل يرسل token في request body كـ clientToken",
    "2. الخادم يتحقق من JWT عبر verifyToken(clientToken)",
    "3. إذا نجح التحقق: يستخدم المستخدم المستخرج",
    "4. إذا فشل: يتحقق من Bearer token في Headers",
    "5. إذا فشل: يتحقق من HttpOnly cookie",
    "6. إذا فشل: يطلب تسجيل الدخول",
]


# ===================== القسم 23: تدفق الصور =====================
IMAGE_TITLE = "نظام رفع الصور وسير العمل"
IMAGE_DESC = (
    "يتعامل النظام مع الصور عبر خطوتين: الرفع على الخادم ثم التخزين "
    "في Cloudinary أو كـ base64 data URI كبديل."
)

IMAGE_FLOW = [
    {
        "step": "1. رفع الصور من العميل",
        "desc": "FormData مع files[] (حتى 20 صورة)",
    },
    {
        "step": "2. التحقق من الأنواع",
        "desc": "MIME types مدعومة: JPEG, PNG, WebP, GIF | الحد الأقصى: 5 ميجا",
    },
    {
        "step": "3. محاولة Cloudinary",
        "desc": "uploader.upload() مع folder 'jo-cars/cars' + optimization",
    },
    {
        "step": "4. fallback إلى base64",
        "desc": "إذا فشل Cloudinary: تحويل إلى data URI وتخزين في DB",
    },
    {
        "step": "5. ترتيب الصور",
        "desc": "الصورة الأولى = cover image، ترتيب يدوياً via sortOrder",
    },
    {
        "step": "6. Lazy Loading",
        "desc": "GET /api/cars/[id]/images?offset=6&limit=30 للصور الإضافية",
    },
]


# ===================== القسم 24: نظام التنبيهات =====================
NOTIFICATION_TITLE = "نظام الإشعارات والتنبيهات"
NOTIFICATION_DESC = (
    "يدير النظام عدة أنواع من الإشعارات عبر قنوات متعددة."
)

NOTIFICATION_TYPES = [
    ("NEW_MESSAGE", "رسالة جديدة في محادثة", "محادثات", "واتساب + داخلي"),
    ("NEW_BOOKING", "حجز جديد على سيارة", "حجوزات", "واتساب + داخلي"),
    ("BID_OUTBID", "تم تجاوز عرضك في المزاد", "مزادات", "داخلي"),
    ("NEW_REVIEW", "تقييم جديد لسيارتك", "تقييمات", "داخلي"),
    ("NEW_TRADER", "تسجيل تاجر جديد", "إدارة", "واتساب للمدير"),
    ("NEW_USER", "تسجيل مستخدم جديد", "إدارة", "واتساب للمدير"),
    ("TICKET_REPLY", "رد على تذكرة الدعم", "تذاكر", "واتساب"),
    ("APPOINTMENT", "موعد جديد في الورشة", "ورش", "واتساب"),
    ("PRICE_ALERT", "تنبيه سعر محقق", "تنبيهات", "داخلي"),
    ("ADMIN_REPLY", "رد المدير على التذكرة", "تذاكر", "واتساب"),
]


# ===================== القسم 25: تدفق المصادقة الكامل =====================
AUTH_FLOW_TITLE = "تدفق المصادقة الكامل خطوة بخطوة"
AUTH_FLOW_STEPS = [
    ("تسجيل الدخول", [
        "1. المستخدم يدخل البريد الإلكتروني وكلمة المرور",
        "2. الخادم يتحقق من Rate Limit (5 محاولات/15 دقيقة)",
        "3. الخادم يتحقق من IP Blocked",
        "4. الخادم يتحقق من Account Lock (بعد 5 محاولات فاشلة)",
        "5. Prisma يستعلم عن المستخدم عبر email",
        "6. bcrypt يقارن كلمة المرور (10 جولات)",
        "7. signToken() ينشئ JWT token (صلاحية 30 يوم)",
        "8. setAuthCookie() يعين HttpOnly cookie",
        "9. المستخدم يُعاد مع token + بيانات الحساب",
        "10. المتصفح يخزن token في localStorage (Zustand)",
    ]),
    ("إنشاء حساب", [
        "1. المستخدم يملأ النموذج (الاسم، البريد، كلمة المرور)",
        "2. الخادم يتحقق من Honeypot (حقل website)",
        "3. Rate Limiting: 3 محاولات/15 دقيقة",
        "4. فحص تكرار البريد الإلكتروني",
        "5. hashPassword() يشفّر كلمة المرور",
        "6. prisma.$transaction ينشئ المستخدم ذرياً",
        "7. notifyAdmins() يرسل إشعار (NEW_USER أو NEW_TRADER)",
        "8. signToken() + setAuthCookie()",
        "9. المستخدم يُعاد مع token + بيانات الحساب",
    ]),
    ("التحقق من OTP", [
        "1. المستخدم يطلب إرسال OTP (send-otp)",
        "2. التحقق من صحة رقم الهاتف الأردني",
        "3. توليد 6 أرقام عشوائية + انتهاء 5 دقائق",
        "4. إرسال عبر WhatsApp",
        "5. المستخدم يدخل OTP (verify-otp)",
        "6. التحقق من الرمز والصلاحية",
        "7. تحديث phone + phoneVerified=true",
        "8. حذف OTP من الذاكرة المؤقتة",
    ]),
    ("الخروج", [
        "1. logout() يحذف token من localStorage",
        "2. يحذف HttpOnly cookie",
        "3. يحذف جميع بيانات Zustand",
        "4. المستخدم يُعاد لصفحة تسجيل الدخول",
    ]),
]


# ===================== القسم 26: بنية Chat Stream =====================
STREAM_TITLE = "بنية نظام المحادثة البث المباشر (SSE)"
STREAM_DESC = (
    "أكبر ملف في قاعدة الكود (1148 سطر) - يدير المحادثة الذكية "
    "مع البث المباشر للإجابات."
)

STREAM_EVENTS = [
    ("meta", "بيانات التخطيط", "intent, suggestions, navigate, searchUrl, data"),
    ("token", "كلمة واحدة", "يتم إرسال كلمة واحدة في كل مرة للتأثير الفوري"),
    ("done", "انتهاء المحادثة", "يحتوي على finalMessage الكامل"),
]

STREAM_ARCHITECTURE = [
    "1. العميل يرسل POST مع messages[] + userName + model",
    "2. detectIntent() يكشف النية من آخر رسالة",
    "3. extractRefCode() يبحث عن أنماط أكواد مرجعية",
    "4. normalizeDialect() يحول اللهجة إلى الفصحى",
    "5. بناء context: بيانات السيارة أو الورشة أو القطع",
    "6. buildSystemPrompt() يبني system prompt مخصص",
    "7. streamChatCompletion() يبدأ البث المباشر",
    "8. for await (const chunk of stream): إرسال token بـ SSE",
    "9. streamComplete() يرسل finalMessage",
]

STREAM_CAR_FLOW = [
    "1. كشف car_listing → حفظ في carFlowStore",
    "2. الخطوة 1: السؤال عن الماركة → meta event مع brands",
    "3. الخطوة 2: السؤال عن الطراز → meta event مع models",
    "4. الخطوة 3: السؤال عن السنة والمسافة → parser year_km",
    "5. الخطوة 4: الوقود وناقل الحركة",
    "6. الخطوة 5: اللون والدفع",
    "7. الخطوة 6: الحالة والسعر",
    "8. الخطوة 7: المدينة والوصف والهاتف",
    "9. الخطوة 8: ملخص كامل → طلب تأكيد",
    "10. التأكيد: POST /api/cars → إنشاء الإعلان",
]


# ===================== القسم 27: تحليل الكود =====================
CODE_ANALYSIS_TITLE = "تحليل جودة الكود والۂراعة البرمجية"
CODE_ANALYSIS = [
    {
        "name": "نقاط القوة في الكود",
        "items": [
            "استخدام TypeScript بالكامل مع أنواع بيانات واضحة",
            "Prisma ORM يمنع SQL Injection تلقائياً",
            "نظام مصادقة JWT مع HttpOnly cookies + Bearer tokens",
            "Rate Limiting ذكي مع تصعيد تلقائي",
            "تنقية مدخلات عبر Zod + DOMPurify",
            "سجل مراجعة شامل لكل الإجراءات الإدارية",
            "نظام بلاغات متعدد (سيارات، تعليقات، ورش، منتدى)",
            "معالجة أخطاء موحدة عبر errorResponse()",
            "معاينات Prisma للتحقق من سلامة البيانات",
            "استخدام Transactions للعمليات المعقدة",
        ],
    },
    {
        "name": "مجالات التحسين",
        "items": [
            "Rate Limiting في الذاكرة فقط (غير موزع عبر المثيلات)",
            "بعض الـ API endpoints لا تتطلب مصادقة (مثل POST /api/cars/brands)",
            "لا يوجد WebSocket للمزادات الحية (الـ SSE كافي للمحادثة)",
            "لا يوجد اختبارات وحدة (unit tests)",
            "بعض ملفات الكود كبيرة جداً (stream route: 1148 سطر)",
            "لا يوجد TypeScript strict mode مفعّل بالكامل",
            "بعض الأخطاء الصامتة (try/catch فارغة)",
        ],
    },
    {
        "name": "أنماط التسمية",
        "items": [
            "مسارات API: lowercase with dashes (/api/cars/[id]/reviews)",
            "مكونات React: PascalCase (CarCard, HeroSection)",
            "نماذج Prisma: PascalCase (Car, User, Workshop)",
            "أنواع TypeScript: PascalCase (CarStatus, UserRole)",
            "ملفات المكتبة: camelCase (auth.ts, prisma.ts)",
            "ملفات الألوان: UPPER_CASE (GOLD, DARK, BLUE)",
        ],
    },
]


# ===================== القسم 28: التكاملات الخارجية =====================
INTEGRATIONS_TITLE = "التكاملات الخارجية والخدمات"
INTEGRATIONS = [
    {
        "name": "NVIDIA AI API",
        "desc": "خدمة الذكاء الاصطناعي الرئيسية",
        "details": [
            "العنوان: https://integrate.api.nvidia.com/v1",
            "النماذج: openai/gpt-oss-120b, z-ai/glm-5.2, minimaxai/minimax-m3, mistralai/mistral-medium-3.5-128b",
            "الاستخدام: المحادثة الذكية، تحليل الأسعار، توليد الأوصاف، مراجعات السيارات",
            "إعادة المحاولة: 3 مرات مع exponential backoff",
            "Timeout: 30 ثانية افتراضياً",
        ],
    },
    {
        "name": "Cloudinary",
        "desc": "خدمة إدارة الصور",
        "details": [
            "رفع الصور مع تحسين تلقائي",
            "تحويل الصيغ (JPEG, PNG, WebP)",
            "تحسين الأبعاد والجودة",
            "حذف الصور غير المرغوبة",
            "Fallback إلى base64 إذا فشل",
        ],
    },
    {
        "name": "WhatsApp API",
        "desc": "إرسال الإشعارات عبر WhatsApp",
        "details": [
            "إرسال لمستخدم محدد",
            "إرسال للمديرين",
            "رسائل السيارات (buildCarMessage)",
            "رسائل الحجوزات (buildBookingMessage)",
            "تكامل مع notifications",
        ],
    },
    {
        "name": "OpenSooq Scraper",
        "desc": "جمع بيانات السوق من OpenSooq",
        "details": [
            " scraping للأسعار الحالية",
            "مقارنة أسعار السيارات المشابهة",
            "بيانات السوق الحية",
            "استخراج معلومات البائعين",
        ],
    },
    {
        "name": "Railway",
        "desc": "الاستضافة السحابية",
        "details": [
            "استضافة كاملة (Docker)",
            "قاعدة بيانات PostgreSQL مدمجة",
            "SSL مجاني",
            "CI/CD من GitHub",
            "استعادة تلقائية",
        ],
    },
    {
        "name": "GitHub",
        "desc": "إدارة الكود المصدري",
        "details": [
            "مستودع: daradadkehhood/JO-Cars1",
            "فروع: main + master",
            "CI/CD عبر Railway",
            "إدارة الإصدارات",
        ],
    },
]


# ===================== القسم 29: خارطة الطريق التفصيلية =====================
ROADMAP_DETAIL_TITLE = "خارطة الطريق المستقبلية - تفصيل تنفيذي"

ROADMAP_DETAIL = [
    {
        "phase": "المرحلة 1 - الربع الثالث 2026",
        "timeline": "يوليو - سبتمبر 2026",
        "priority": "عالي",
        "items": [
            {
                "name": "WebSocket للمزادات الحية",
                "desc": "تحويل المزادات من polling إلى WebSocket للتحديث اللحظي",
                "implementation": [
                    "إضافة Socket.IO events خاصة بالمزادات",
                    "تحديث currentPrice تلقائياً للمستخدمين المتصلين",
                    "إشعارات فورية عند تجاوز العروض",
                    "مراقبة حالة الاتصال",
                ],
                "estimated_time": "2-3 أسابيع",
            },
            {
                "name": "PWA للعمل دون اتصال",
                "desc": "تحويل المنصة إلى Progressive Web App",
                "implementation": [
                    "إنشاء manifest.json",
                    "تسجيل Service Worker",
                    "تخزين مؤقت للصفحات الأساسية",
                    "إشعارات الدفع",
                    "وضع عدم الاتصال",
                ],
                "estimated_time": "2 أسابيع",
            },
            {
                "name": "تطبيق موبايل أصلي (React Native)",
                "desc": "تطبيق iOS و Android",
                "implementation": [
                    "React Native مع Expo",
                    "مشاركة المنطق التجاري مع Next.js",
                    "تكامل مع كاميرا الموبايل للصور",
                    "إشعارات الدفع",
                ],
                "estimated_time": "8-12 أسبوع",
            },
            {
                "name": "بوابة الدفع",
                "desc": "إضافة بوابات الدفع الرقمي",
                "implementation": [
                    "Zain Cash API",
                    "Fawry API",
                    "Apple Pay / Google Pay",
                    "نظام الفواتير",
                ],
                "estimated_time": "4-6 أسابيع",
            },
            {
                "name": "تحسين محرك البحث",
                "desc": "تحسين سرعة ودقة البحث",
                "implementation": [
                    "إضافة فهرس全文 إلى PostgreSQL",
                    "تحسين استعلامات البحث",
                    "إضافة autocomplete",
                    "بحث ذكي بالعربية",
                ],
                "estimated_time": "2-3 أسابيع",
            },
        ],
    },
    {
        "phase": "المرحلة 2 - الربع الرابع 2026",
        "timeline": "أكتوبر - ديسمبر 2026",
        "priority": "متوسط",
        "items": [
            {
                "name": "تكامل شركات التأمين",
                "desc": "عرض أسعار التأمين مباشرة",
                "implementation": [
                    "API تأمين السيارات الأردنية",
                    "حساب تلقائي لتكلفة التأمين",
                    "مقارنة عروض شركات متعددة",
                ],
                "estimated_time": "6-8 أسابيع",
            },
            {
                "name": "فك تشفير VIN",
                "desc": "قراءة تاريخ السيارة من رقم VIN",
                "implementation": [
                    "تكامل مع قاعدة بيانات VIN",
                    "استخراج المعلومات الفنية",
                    "عرض تاريخ الصيانة",
                ],
                "estimated_time": "4 أسابيع",
            },
            {
                "name": "عرض AR للسيارات",
                "desc": "عرض ثلاثي الأبعاد للسيارات",
                "implementation": [
                    "WebXR API",
                    "تصاميم 3D للسيارات",
                    "تجربة عرض واقعية",
                ],
                "estimated_time": "8-12 أسبوع",
            },
            {
                "name": "دعم متعدد اللغات",
                "desc": "ترجمة المنصة إلى الإنجليزية والتركية",
                "implementation": [
                    "next-intl أو similar library",
                    "ترجمة جميع الصفحات",
                    "RTL/LTR toggle",
                ],
                "estimated_time": "4-6 أسابيع",
            },
        ],
    },
    {
        "phase": "المرحلة 3 - الربع الأول 2027",
        "timeline": "يناير - مارس 2027",
        "priority": "متوسط",
        "items": [
            {
                "name": "أدوات إدارة الأسطول",
                "desc": "نظام لإدارة أسطول سيارات الشركات",
                "implementation": [
                    "لوحة تحكم متقدمة للشركات",
                    "تتبع صيانة الأسطول",
                    "تقارير التكاليف",
                ],
                "estimated_time": "8-10 أسابيع",
            },
            {
                "name": "منصة فرانشايز الورش",
                "desc": "نظام لإدارة فروع ورش العمل",
                "implementation": [
                    "إدارة متعددة الفروع",
                    "توحيد الأسعار والخدمات",
                    "تقارير الأداء",
                ],
                "estimated_time": "10-12 أسبوع",
            },
            {
                "name": "سجل سيارة على Blockchain",
                "desc": "توثيق تاريخ السيارة على سلسلة الكتل",
                "implementation": [
                    "إنشاء سجل不可 للتغييرات",
                    "توثيق الصيانة والملكية",
                    "验证 عبر QR code",
                ],
                "estimated_time": "12-16 أسبوع",
            },
            {
                "name": "صيانة تنبؤية بالذكاء الاصطناعي",
                "desc": "تنبؤ بالمشاكل قبل حدوثها",
                "implementation": [
                    "تحليل أنماط الصيانة",
                    "تنبيهات مبكرة للمالكين",
                    "توصيات ورش العمل",
                ],
                "estimated_time": "8-10 أسابيع",
            },
            {
                "name": "توسع إقليمي",
                "desc": "التوسع إلى لبنان والعراق وفلسطين",
                "implementation": [
                    "ترجمة وتعريب",
                    "تكييف مع القوانين المحلية",
                    "شراكات محلية",
                ],
                "estimated_time": "مستمر",
            },
        ],
    },
]


# ===================== القسم 30: تحليل الأداء =====================
PERFORMANCE_TITLE = "تحليل الأداء والتحسينات"
PERFORMANCE_SECTIONS = [
    {
        "name": "أداء قاعدة البيانات",
        "items": [
            "50 فهرس في الـ schema لتحسين الاستعلامات",
            "Connection pooling عبر Neon Serverless",
            "Prisma previewFeatures: multiSchema, clientExtensions",
            "استعلامات select مخصصة (عدم جلب كل الحقول)",
            "Pagination في جميع القوائم",
            "Index على الحقول المفلترة (brandId, modelId, cityId, status)",
            "Unique constraints لمنع التكرار (carId_userId, email, phone)",
        ],
    },
    {
        "name": "أداء الشبكة",
        "items": [
            "Lazy loading للصور (6 صور افتراضياً، تحميل الباقي عند الطلب)",
            "Image optimization عبر Next.js Image component",
            "Compression: Gzip/Brotli عبر Railway",
            "CDN: Railway edge caching",
            "Static generation للصفحات العامة",
            "ISR (Incremental Static Regeneration) للقوائم",
            "Bundle splitting تلقائي مع Next.js App Router",
        ],
    },
    {
        "name": "أداء الخادم",
        "items": [
            "Prisma singleton pattern (عدم إنشاء اتصالات متعددة)",
            "In-memory caching مع TTL لكل نوع بيانات",
            "Fire-and-forget للعمليات غير المتزامنة",
            "Promise.all للعمليات المستقلة",
            "Timeout wrapper للطلبات البطيئة (10 ثوانٍ)",
            "Stream watchdog: 30 ثانية timeout",
        ],
    },
    {
        "name": "أداء الواجهة",
        "items": [
            "React.memo للمكونات الثابتة",
            "Lazy loading للمكونات الثقيلة (dynamic imports)",
            "Optimistic updates للمفضلة والتفاعلات",
            "Debounced search inputs",
            "Infinite scroll بدلاً من pagination",
            "Virtual scrolling للقوائم الكبيرة",
        ],
    },
]


# ===================== القسم 31: أرقام وإحصائيات =====================
STATS_TITLE = "إحصائيات تفصيلية للمنصة"
STATS_SUMMARY = {
    "إجمالي أسطر الكود": "51,667",
    "عدد ملفات TypeScript": "200+",
    "عدد مكونات React": "46",
    "عدد مسارات API": "168",
    "عدد نماذج قاعدة البيانات": "50+",
    "عدد العلاقات": "120+",
    "عدد الفهارس": "50+",
    "عدد صفحات الواجهة": "95",
    "عدد أدوات الذكاء الاصطناعي": "13",
    "عدد أقسام المنتدى": "12",
    "عدد المحافظات": "12",
    "عدد الماركات": "61",
    "عدد خطط الاشتراك": "4",
    "عدد أنواع الإشعارات": "10",
    "عدد نوايا كشف النية": "14",
    "عدد أنماط car_listing": "25+",
    "عدد قواعد System Prompt": "17",
    "إجمالي ملفات الإعدادات": "8",
    "عدد أنواع الأدوار": "3 (USER, ADMIN, TRADER)",
    "عدد حالات السيارة": "6 (PENDING, APPROVED, REJECTED, SOLD, ARCHIVED, DELETED)",
    "عدد حالات الحجز": "6 (PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW, EXPIRED)",
    "عدد حالات المزاد": "4 (ACTIVE, ENDED, CANCELLED, SOLD)",
    "عدد حالات المحادثة": "4 (ACTIVE, ARCHIVED, BLOCKED, DELETED)",
    "عدد حالات التذكرة": "5 (OPEN, IN_PROGRESS, WAITING, RESOLVED, CLOSED)",
    "عدد حالات التقييم": "6 (ACTIVE, HIDDEN, PENDING, FLAGGED, REMOVED, APPEALED)",
}
