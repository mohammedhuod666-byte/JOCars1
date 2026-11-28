export interface TourStep {
  selector: string;
  badge: string;
  title: string;
  description: string;
}

export interface PageTask {
  id: string;
  title: string;
  matchText?: string[];
  matchEvent?: 'scroll_mid' | 'input' | 'visit';
}

export interface PageGuideConfig {
  id: string;
  title: string;
  welcomeTitle: string;
  welcomeDesc: string;
  pageTip: string;
  tourSteps: TourStep[];
  tasks: PageTask[];
}

export const HOME_GUIDE: PageGuideConfig = {
  id: 'home',
  title: 'الصفحة الرئيسية',
  welcomeTitle: 'أهلاً بك في JO Cars',
  welcomeDesc: 'دعنا نعرّفك على الصفحة الرئيسية في 30 ثانية أو اختر وجهتك مباشرة.',
  pageTip: 'ابدأ بالبحث في الأعلى أو اختر الخدمة التي تحتاجها من مركز الخدمات.',
  tourSteps: [
    {
      selector: '[data-tour="hero"]',
      badge: '1 / 6',
      title: 'البحث الذكي الموحد',
      description: 'ابحث مباشرة عن أي سيارة أو ورشة صيانة أو قطعة غيار من مربع واحد، أو اختر من الاقتراحات السريعة.',
    },
    {
      selector: '[data-tour="stories"]',
      badge: '2 / 6',
      title: 'قصص المعارض والعروض',
      description: 'تصفح أحدث السيارات والعروض الحصرية اليومية من المعارض والتجار الموثقين في الأردن.',
    },
    {
      selector: '[data-tour="services"]',
      badge: '3 / 6',
      title: 'مركز خدمات JO Cars',
      description: 'بوابتك السريعة لكل أقسام الموقع: سوق السيارات، الورش، قطع الغيار، المنتدى، المزادات، وحاسبة الجمرك.',
    },
    {
      selector: '[data-tour="emergency"]',
      badge: '4 / 6',
      title: 'طوارئ الطريق والونش 24/7',
      description: 'تعطلت سيارتك فجأة؟ اضغط هنا للوصول الفوري إلى أقرب ونش سحب أو ورشة صيانة متنقلة لموقعك.',
    },
    {
      selector: '[data-tour="featured"]',
      badge: '5 / 6',
      title: 'السيارات المميزة والتقييم العادل',
      description: 'كل إعلان يعرض السعر ومؤشر عدالة السعر وحالة الفحص لتقارن وتختار بثقة.',
    },
    {
      selector: '[data-tour="priceranges"]',
      badge: '6 / 6',
      title: 'اختر حسب ميزانيتك',
      description: 'حدد الفئة السعرية المناسبة لميزانيتك ليعرض لك الموقع السيارات المطابقة فوراً.',
    },
  ],
  tasks: [
    { id: 'home_visit', title: 'استكشاف الصفحة الرئيسية', matchEvent: 'visit' },
    { id: 'home_scroll', title: 'تصفح الأقسام والعروض المميزة', matchEvent: 'scroll_mid' },
    { id: 'home_search', title: 'جرّب البحث أو افتح أي خدمة', matchText: ['بحث', 'تصفح', 'استكشف'] },
  ],
};

export const PAGE_GUIDES: Record<string, PageGuideConfig> = {
  cars: {
    id: 'cars',
    title: 'سوق السيارات',
    welcomeTitle: 'مرحباً بك في سوق السيارات',
    welcomeDesc: 'هنا يمكنك البحث والفلترة والمقارنة بين آلاف السيارات في الأردن مع تقييم السعر العادل.',
    pageTip: 'استخدم شريط البحث والفلاتر لتضييق النتائج حسب الموديل والسعر والمدينة، واضغط على أي سيارة لرؤية التقييم الكامل.',
    tourSteps: [
      {
        selector: 'main h1',
        badge: '1 / 3',
        title: 'سوق السيارات الأردني',
        description: 'تصفح جميع السيارات المعروضة للبيع في الأردن من أفراد ومعارض موثقة.',
      },
      {
        selector: 'main input',
        badge: '2 / 3',
        title: 'البحث والفلاتر الذكية',
        description: 'ابحث بالماركة أو الموديل، وحدد السنة والسعر ونوع الوقود والمحافظة لتصل لسيارتك بدقة.',
      },
      {
        selector: 'main a[href^="/cars/"]',
        badge: '3 / 3',
        title: 'بطاقة السيارة والمقارنة',
        description: 'كل بطاقة تعرض السعر وحالة الفحص والمسافة. اضغط على أي سيارة لفتح تفاصيلها أو حفظها في المفضلة.',
      },
    ],
    tasks: [
      { id: 'cars_visit', title: 'فتح سوق السيارات', matchEvent: 'visit' },
      { id: 'cars_filter', title: 'استخدام البحث أو الفلاتر', matchEvent: 'input' },
      { id: 'cars_scroll', title: 'تصفح قائمة السيارات المعروضة', matchEvent: 'scroll_mid' },
    ],
  },
  car_detail: {
    id: 'car_detail',
    title: 'تفاصيل السيارة',
    welcomeTitle: 'دليل صفحة إعلان السيارة',
    welcomeDesc: 'هذه الصفحة تمنحك كل ما تحتاجه لتقييم السيارة والتواصل مع البائع بأمان.',
    pageTip: 'استخدم أزرار التنقل السريع للوصول إلى التقييم العادل، تقرير الفحص، وحاسبة الجمرك، أو تفاوض مع البائع مباشرة.',
    tourSteps: [
      {
        selector: 'main h1',
        badge: '1 / 5',
        title: 'ملخص السيارة والسعر',
        description: 'شاهد الصور، السعر المطلوب، مؤشر عدالة السعر، وأبرز 5 مواصفات رئيسية في لمحة واحدة.',
      },
      {
        selector: '#section-valuation',
        badge: '2 / 5',
        title: 'تقييم السعر العادل بالذكاء الاصطناعي',
        description: 'يعطيك السعر العادل الحقيقي للسيارة في السوق الأردني حتى لا تدفع أكثر من قيمتها.',
      },
      {
        selector: '#section-specs',
        badge: '3 / 5',
        title: 'المواصفات الفنية الكاملة',
        description: 'جميع تفاصيل المحرك، الوقود، الجير، اللون، وسعة المحرك مرتبة بوضوح.',
      },
      {
        selector: '#section-inspection',
        badge: '4 / 5',
        title: 'تقرير الفحص والوثائق',
        description: 'راجع حالة الفحص الأردني (مثل 7 جيد أو 4 جيد) وحالة توثيق الرخصة والوثائق.',
      },
      {
        selector: '#section-customs',
        badge: '5 / 5',
        title: 'حاسبة الجمرك والتفاوض',
        description: 'احسب رسوم الجمرك مباشرة وتواصل مع البائع بالاتصال أو الواتساب أو التفاوض داخل الموقع.',
      },
    ],
    tasks: [
      { id: 'detail_visit', title: 'فتح تفاصيل السيارة', matchEvent: 'visit' },
      { id: 'detail_scroll', title: 'مراجعة التقييم العادل والمواصفات', matchEvent: 'scroll_mid' },
      { id: 'detail_action', title: 'حفظ في المفضلة أو مقارنة أو تفاوض', matchText: ['حفظ', 'مقارنة', 'تفاوض', 'رسالة', 'اتصال'] },
    ],
  },
  car_add: {
    id: 'car_add',
    title: 'إضافة إعلان سيارة',
    welcomeTitle: 'انشر إعلان سيارتك باحترافية',
    welcomeDesc: 'أضف صور سيارتك ومواصفاتها وسيساعدك النظام في صياغة وصف جذاب وتقدير السعر.',
    pageTip: 'احرص على رفع صور واضحة واختيار حالة الفحص بدقة لزيادة ثقة المشترين وسرعة البيع.',
    tourSteps: [
      {
        selector: 'main h1',
        badge: '1 / 3',
        title: 'نموذج نشر الإعلان',
        description: 'ابدأ باختيار الماركة والموديل وسنة الصنع والمواصفات الأساسية للسيارة.',
      },
      {
        selector: 'main form',
        badge: '2 / 3',
        title: 'الصور والفحص والسعر',
        description: 'أضف الصور واضبط السعر المطلوب وحالة القابلية للتفاوض ورقم التواصل.',
      },
      {
        selector: 'main button[type="submit"]',
        badge: '3 / 3',
        title: 'نشر الإعلان فوراً',
        description: 'بعد مراجعة البيانات اضغط نشر ليظهر إعلانك لآلاف الباحثين عن سيارات في الأردن.',
      },
    ],
    tasks: [
      { id: 'add_visit', title: 'فتح صفحة إضافة إعلان', matchEvent: 'visit' },
      { id: 'add_input', title: 'البدء بتعبئة بيانات السيارة', matchEvent: 'input' },
    ],
  },
  workshops: {
    id: 'workshops',
    title: 'دليل الورش والصيانة',
    welcomeTitle: 'مرحباً بك في دليل الورش',
    welcomeDesc: 'ابحث عن أقرب ورشة معتمدة، قدّر تكلفة الصيانة قبل الذهاب، أو اطلب ونش طوارئ 24/7.',
    pageTip: 'اضغط على "حاسبة التكاليف" لمعرفة متوسط أسعار الصيانة في الأردن، أو اختر التخصص من الشريط العلوي.',
    tourSteps: [
      {
        selector: 'main h1',
        badge: '1 / 4',
        title: 'دليل الورش المعتمد',
        description: 'من هنا تبحث عن ورش الهايبرد، الكهرباء، فحص الكمبيوتر، والميكانيك في كافة المحافظات.',
      },
      {
        selector: 'main button',
        badge: '2 / 4',
        title: 'حاسبة تكاليف الصيانة وونش الطوارئ',
        description: 'احسب التكلفة التقريبية للإصلاح قبل زيارة الورشة، أو فعّل فلتر الونش في حالات الطوارئ.',
      },
      {
        selector: 'main input',
        badge: '3 / 4',
        title: 'البحث والتصفية المتقدمة',
        description: 'ابحث باسم الورشة أو المنطقة، وفلتر حسب المحافظة والكفالة والصيانة المتنقلة.',
      },
      {
        selector: 'main a[href^="/workshops/"]',
        badge: '4 / 4',
        title: 'الحجز والتواصل المباشر',
        description: 'اضغط "حجز موعد" أو تواصل مباشرة عبر الهاتف والواتساب مع الورشة.',
      },
    ],
    tasks: [
      { id: 'ws_visit', title: 'زيارة دليل الورش', matchEvent: 'visit' },
      { id: 'ws_calc', title: 'فتح حاسبة التكاليف أو التصفية', matchText: ['حاسبة التكاليف', 'الفلاتر', 'ونش', 'هايبرد'] },
      { id: 'ws_scroll', title: 'استعراض بطاقات الورش', matchEvent: 'scroll_mid' },
    ],
  },
  parts: {
    id: 'parts',
    title: 'سوق قطع الغيار',
    welcomeTitle: 'مرحباً بك في سوق قطع الغيار',
    welcomeDesc: 'ابحث عن القطع الأصلية والمستعملة حسب نوع السيارة ورقم القطعة وتواصل مع التاجر مباشرة.',
    pageTip: 'أدخل اسم القطعة أو رقمها الأصلي (OEM) في مربع البحث للوصول السريع.',
    tourSteps: [
      {
        selector: 'main h1',
        badge: '1 / 3',
        title: 'سوق قطع الغيار الأردني',
        description: 'تصفح المحركات، الجيرات، البطاريات، وقطع البودي الجديدة والمستعملة.',
      },
      {
        selector: 'main input',
        badge: '2 / 3',
        title: 'البحث عن القطعة',
        description: 'ابحث باسم القطعة أو الماركة أو الحالة (جديد / مستعمل).',
      },
      {
        selector: 'main a[href^="/parts/"]',
        badge: '3 / 3',
        title: 'تفاصيل القطعة والتاجر',
        description: 'اضغط على أي قطعة لمعرفة السعر ومكان التوفر وطلبها مباشرة.',
      },
    ],
    tasks: [
      { id: 'parts_visit', title: 'تصفح سوق قطع الغيار', matchEvent: 'visit' },
      { id: 'parts_search', title: 'البحث أو التصفية عن قطعة', matchEvent: 'input' },
    ],
  },
  customs: {
    id: 'customs',
    title: 'حاسبة الجمرك',
    welcomeTitle: 'دليل حاسبة الجمرك الأردنية',
    welcomeDesc: 'احسب الرسوم الجمركية والضرائب التقديرية لأي سيارة قبل شرائها أو استيرادها.',
    pageTip: 'اختر سنة الصنع وسعة المحرك ونوع الوقود (بنزين، هايبرد، كهرباء) للحصول على أدق تقدير.',
    tourSteps: [
      {
        selector: 'main h1',
        badge: '1 / 2',
        title: 'حاسبة الجمرك التقديرية',
        description: 'تساعدك على معرفة التكلفة الجمركية المتوقعة بناءً على فئة السيارة وسنة الصنع.',
      },
      {
        selector: 'main form, main input, main select',
        badge: '2 / 2',
        title: 'إدخال بيانات المركبة',
        description: 'أدخل سعة المحرك والقيمة ونوع الوقود ليتم احتساب الرسوم تلقائياً.',
      },
    ],
    tasks: [
      { id: 'customs_visit', title: 'فتح حاسبة الجمرك', matchEvent: 'visit' },
      { id: 'customs_calc', title: 'تعديل القيم وحساب الجمرك', matchEvent: 'input' },
    ],
  },
  ai: {
    id: 'ai',
    title: 'المساعد الذكي',
    welcomeTitle: 'مرحباً بك في أدوات الذكاء الاصطناعي',
    welcomeDesc: 'استشر المساعد الذكي لاختيار سيارة تناسب ميزانيتك، أو تقييم سعر، أو تحليل فحص.',
    pageTip: 'اكتب سؤالك باللغة العربية العامية أو الفصحى وسيقترح لك المساعد أفضل الخيارات.',
    tourSteps: [
      {
        selector: 'main h1',
        badge: '1 / 2',
        title: 'مستشار السيارات الذكي',
        description: 'اطرح أي سؤال عن السيارات في الأردن، استهلاك الوقود، الصيانة، أو أفضل سيارة لميزانيتك.',
      },
      {
        selector: 'main textarea, main input',
        badge: '2 / 2',
        title: 'ابدأ المحادثة الذكية',
        description: 'اكتب طلبك أو اختر من الأسئلة الجاهزة لتحصل على إجابة فورية ومخصصة.',
      },
    ],
    tasks: [
      { id: 'ai_visit', title: 'دخول صفحة المساعد الذكي', matchEvent: 'visit' },
      { id: 'ai_ask', title: 'كتابة سؤال أو اختيار أداة ذكية', matchEvent: 'input' },
    ],
  },
  tickets: {
    id: 'tickets',
    title: 'الدعم والتذاكر',
    welcomeTitle: 'مركز الدعم والتذاكر المباشر',
    welcomeDesc: 'تواصل مباشرة مع فريق إدارة JO Cars لأي استفسار، اقتراح، أو بلاغ تقني.',
    pageTip: 'اضغط "فتح تذكرة جديدة" وسيرد عليك فريق الدعم داخل محادثة تفاعلية مباشرة.',
    tourSteps: [
      {
        selector: 'main h1',
        badge: '1 / 2',
        title: 'متابعة تذاكر الدعم',
        description: 'شاهد حالة تذاكرك (مفتوحة، قيد المعالجة، تم الحل) والردود المباشرة من الإدارة.',
      },
      {
        selector: 'main a[href="/tickets/new"], main button',
        badge: '2 / 2',
        title: 'إنشاء تذكرة جديدة',
        description: 'اشرح طلبك وأرفق التفاصيل ليتم حله بأسرع وقت ممكن.',
      },
    ],
    tasks: [
      { id: 'tickets_visit', title: 'زيارة مركز الدعم والتذاكر', matchEvent: 'visit' },
      { id: 'tickets_new', title: 'استعراض التذاكر أو فتح تذكرة', matchText: ['تذكرة جديدة', 'فتح تذكرة'] },
    ],
  },
  forum: {
    id: 'forum',
    title: 'منتدى كارس جو',
    welcomeTitle: 'مرحباً بك في مجتمع ومنتدى السيارات',
    welcomeDesc: 'شارك تجاربك، اسأل عن الأعطال، واستفد من خبرة أصحاب السيارات والفنيين في الأردن.',
    pageTip: 'تصفح الأقسام أو افتح موضوعاً جديداً لطرح استفسارك على المجتمع.',
    tourSteps: [
      {
        selector: 'main h1',
        badge: '1 / 2',
        title: 'مواضيع وتجارب الأعضاء',
        description: 'تصفح النقاشات حول صيانة الهايبرد، قطع الغيار، وتجارب الشراء.',
      },
      {
        selector: 'main a[href="/forum/new"], main input',
        badge: '2 / 2',
        title: 'شارك بسؤال أو موضوع جديد',
        description: 'ابحث في المواضيع السابقة أو أنشئ موضوعك الخاص.',
      },
    ],
    tasks: [
      { id: 'forum_visit', title: 'دخول منتدى كارس جو', matchEvent: 'visit' },
      { id: 'forum_scroll', title: 'تصفح المواضيع والأقسام', matchEvent: 'scroll_mid' },
    ],
  },
  news: {
    id: 'news',
    title: 'أخبار السيارات',
    welcomeTitle: 'مركز أخبار السيارات',
    welcomeDesc: 'تابع أحدث أخبار السيارات، أسعار السوق، والتحديثات الرسمية في الأردن والعالم.',
    pageTip: 'اضغط على أي خبر لقراءة التفاصيل الكاملة مع إبراز أهم النقاط.',
    tourSteps: [
      {
        selector: 'main h1',
        badge: '1 / 2',
        title: 'آخر أخبار السيارات',
        description: 'مقالات يومية وتقارير عن السيارات الكهربائية والهايبرد والأنظمة المرورية.',
      },
      {
        selector: 'main a[href^="/news/"]',
        badge: '2 / 2',
        title: 'قراءة الخبر الكامل',
        description: 'افتح أي مقال للاطلاع على التفاصيل الكاملة والمصادر.',
      },
    ],
    tasks: [
      { id: 'news_visit', title: 'تصفح أخبار السيارات', matchEvent: 'visit' },
      { id: 'news_scroll', title: 'قراءة العناوين والمقالات', matchEvent: 'scroll_mid' },
    ],
  },
  compare: {
    id: 'compare',
    title: 'مقارنة السيارات',
    welcomeTitle: 'مقارنة السيارات جنباً إلى جنب',
    welcomeDesc: 'قارن المواصفات والأسعار واستهلاك الوقود بين عدة سيارات لتختار الأنسب لك.',
    pageTip: 'أضف السيارات من زر "مقارنة" داخل أي إعلان لتظهر هنا بجدول مقارنة واضح.',
    tourSteps: [
      {
        selector: 'main h1',
        badge: '1 / 1',
        title: 'جدول المقارنة الشامل',
        description: 'قارن الفروقات في السعر، المسافة، المحرك، والمزايا بين السيارات المختارة.',
      },
    ],
    tasks: [
      { id: 'compare_visit', title: 'فتح صفحة مقارنة السيارات', matchEvent: 'visit' },
    ],
  },
  dealers: {
    id: 'dealers',
    title: 'المعارض والتجار',
    welcomeTitle: 'دليل المعارض والتجار الموثقين',
    welcomeDesc: 'تصفح معارض السيارات المعتمدة في الأردن وشاهد مخزون كل معرض وتقييمات العملاء.',
    pageTip: 'اضغط على أي معرض لمشاهدة جميع سياراته وتقييمه وموقعه.',
    tourSteps: [
      {
        selector: 'main h1',
        badge: '1 / 2',
        title: 'المعارض المعتمدة',
        description: 'قائمة بالمعارض والتجار الموثقين في مختلف محافظات المملكة.',
      },
      {
        selector: 'main a',
        badge: '2 / 2',
        title: 'تصفح مخزون المعرض',
        description: 'افتح صفحة المعرض للاطلاع على سياراته المتوفرة وطرق التواصل.',
      },
    ],
    tasks: [
      { id: 'dealers_visit', title: 'استكشاف دليل المعارض', matchEvent: 'visit' },
      { id: 'dealers_scroll', title: 'تصفح المعارض المتاحة', matchEvent: 'scroll_mid' },
    ],
  },
};

export function getPageGuideConfig(pathname: string): PageGuideConfig | null {
  if (pathname === '/') return HOME_GUIDE;
  if (pathname === '/cars') return PAGE_GUIDES.cars;
  if (pathname === '/cars/add') return PAGE_GUIDES.car_add;
  if (pathname === '/cars/compare') return PAGE_GUIDES.compare;
  if (pathname.startsWith('/cars/') && !pathname.endsWith('/edit') && !pathname.endsWith('/report')) {
    return PAGE_GUIDES.car_detail;
  }
  if (pathname === '/workshops' || pathname.startsWith('/workshops/')) return PAGE_GUIDES.workshops;
  if (pathname === '/parts' || pathname.startsWith('/parts/')) return PAGE_GUIDES.parts;
  if (pathname.startsWith('/customs-calculator') || pathname.startsWith('/free-zone-calculator')) return PAGE_GUIDES.customs;
  if (pathname === '/ai' || pathname.startsWith('/ai/')) return PAGE_GUIDES.ai;
  if (pathname === '/tickets' || pathname.startsWith('/tickets/')) return PAGE_GUIDES.tickets;
  if (pathname === '/forum' || pathname.startsWith('/forum/')) return PAGE_GUIDES.forum;
  if (pathname === '/news' || pathname.startsWith('/news/')) return PAGE_GUIDES.news;
  if (pathname === '/dealers' || pathname.startsWith('/dealers/')) return PAGE_GUIDES.dealers;
  return null;
}

export const TOTAL_DISCOVERABLE_PAGES = 1 + Object.keys(PAGE_GUIDES).length;
