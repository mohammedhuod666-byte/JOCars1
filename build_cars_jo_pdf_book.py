import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import arabic_reshaper
from bidi.algorithm import get_display

# Register Arial Unicode Fonts for crystal-clear Arabic rendering
FONT_PATH = "C:/Windows/Fonts/arial.ttf"
FONT_BOLD_PATH = "C:/Windows/Fonts/arialbd.ttf"

pdfmetrics.registerFont(TTFont('Arabic', FONT_PATH))
pdfmetrics.registerFont(TTFont('Arabic-Bold', FONT_BOLD_PATH))

def ar(text):
    if not text:
        return ""
    lines = text.split("\n")
    reshaped_lines = []
    for line in lines:
        if any("\u0600" <= c <= "\u06FF" for c in line):
            reshaped = arabic_reshaper.reshape(line)
            bidi_text = get_display(reshaped)
            reshaped_lines.append(bidi_text)
        else:
            reshaped_lines.append(line)
    return "\n".join(reshaped_lines)

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return  # Skip cover page

        self.saveState()
        self.setFont("Arabic", 8.5)
        self.setFillColor(colors.HexColor("#64748b"))

        # Top Header Bar
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(40, 800, 555, 800)

        header_text = ar("موسوعة التوثيق المعماري البرمجي لمنصة كارس جو JO Cars 2026")
        self.drawRightString(555, 808, header_text)

        # Bottom Footer Bar
        self.line(40, 45, 555, 45)
        footer_text = ar(f"صفحة {self._pageNumber} من {page_count}")
        self.drawString(40, 30, footer_text)
        right_footer = ar("المملكة الأردنية الهاشمية 🇯🇴 — جميع الحقوق البرمجية محفوظة")
        self.drawRightString(555, 30, right_footer)

        self.restoreState()

def generate_cars_jo_pdf():
    pdf_filename = "Cars_JO_Master_Documentation_Book.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=50,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()

    emerald_color = colors.HexColor("#059669")
    accent_blue = colors.HexColor("#0284c7")
    text_dark = colors.HexColor("#0f172a")

    cover_title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Arabic-Bold',
        fontSize=24,
        leading=32,
        textColor=emerald_color,
        alignment=1,
        spaceAfter=15
    )

    cover_subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Arabic',
        fontSize=12,
        leading=18,
        textColor=colors.HexColor("#475569"),
        alignment=1,
        spaceAfter=25
    )

    h1_style = ParagraphStyle(
        'Header1',
        parent=styles['Normal'],
        fontName='Arabic-Bold',
        fontSize=15,
        leading=21,
        textColor=emerald_color,
        alignment=2,
        spaceBefore=18,
        spaceAfter=10
    )

    h2_style = ParagraphStyle(
        'Header2',
        parent=styles['Normal'],
        fontName='Arabic-Bold',
        fontSize=11.5,
        leading=16,
        textColor=accent_blue,
        alignment=2,
        spaceBefore=12,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyArabic',
        parent=styles['Normal'],
        fontName='Arabic',
        fontSize=9.5,
        leading=15.5,
        textColor=text_dark,
        alignment=2,
        spaceAfter=8
    )

    code_style = ParagraphStyle(
        'CodeSnippet',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11.5,
        textColor=colors.HexColor("#38bdf8"),
        backColor=colors.HexColor("#0f172a"),
        borderColor=colors.HexColor("#1e293b"),
        borderWidth=1,
        borderPadding=6,
        spaceBefore=6,
        spaceAfter=8,
        alignment=0
    )

    story = []

    # ── COVER PAGE ──
    story.append(Spacer(1, 60))
    story.append(Paragraph(ar("🚗 موسوعة ومستند التوثيق الفني والبرمجي الشامل لمنصة كارس جو"), cover_title_style))
    story.append(Paragraph(ar("Cars JO — Exhaustive Master Architectural, Engineering & Security Book 2026"), cover_subtitle_style))
    story.append(HRFlowable(width="85%", thickness=2, color=emerald_color, spaceAfter=30))

    meta_table_data = [
        [ar("منصة كارس جو لتكنولوجيا السيارات الرقمية بالأردن"), ar("اسم المشـروع:")],
        [ar("Next.js 16 (App Router), TypeScript 5, React 19, Tailwind CSS"), ar("حزمة البرمجيات:")],
        [ar("Prisma ORM 5.x & Neon PostgreSQL Remote DB (Cloud Distributed)"), ar("قاعدة البيانات:")],
        [ar("NVIDIA API NIM (ChatGPT OSS 120B) & SSE Streaming"), ar("الذكاء الاصطناعي:")],
        [ar("JWT Authentication, HttpOnly Cookies, Rate Limiting Guard"), ar("نظـام الأمان:")],
        [ar("أغسطس 2026 — الإصدار الموحد 5.0"), ar("تاريخ الإصدار:")],
        [ar("فريق تطوير وتصميم البرمجيات المعماري"), ar("إعداد المجلد:")],
    ]
    meta_table = Table(meta_table_data, colWidths=[330, 150])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor("#0f172a")),
        ('FONTNAME', (0,0), (-1,-1), 'Arabic-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
        ('PADDING', (0,0), (-1,-1), 7),
    ]))
    story.append(meta_table)
    story.append(PageBreak())

    # ── TABLE OF CONTENTS ──
    story.append(Paragraph(ar("📑 فهرس الأبواب والمحاور الفنية الشاملة"), h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=emerald_color, spaceAfter=15))

    toc_items = [
        "1. الباب الأول: الرؤية العامة ونظرة عامة على المنصة وفلسفة التصميم",
        "2. الباب الثاني: البنية الفنية والتقنيات المستعملة والأدوات البرمجية",
        "3. الباب الثالث: البنية المعمارية لقواعد البيانات ومخطط Prisma ORM (25+ نموذج)",
        "4. الباب الرابع: نظام الأمان والتشفير وصلاحيات الوصول والـ HTTP Security",
        "5. الباب الخامس: حماية الـ APIs وتحديد معدل الطلبات Rate Limiting & Input Guard",
        "6. الباب السادس: تشريح كافة الصفحات والفرونت إند صفحة بصفحة (Page-by-Page Deep Dive)",
        "7. الباب السابع: محرك الذكاء الاصطناعي ونموذج ChatGPT OSS 120B والبث اللحظي أول بأول",
        "8. الباب الثامن: رحلات وسيناريوهات المستخدم التفصيلية (Step-by-Step User Workflows)",
        "9. الباب التاسع: دليل أداء السيرفر، الـ SEO، وتجاوب الأجهزة الذكية للهواتف",
        "10. الباب العاشر: خريطة الطريق والأفكار الثورية والمستقبلية الـ 8 لتطوير المنصة",
    ]
    for item in toc_items:
        story.append(Paragraph(ar(item), body_style))
        story.append(Spacer(1, 4))
    story.append(PageBreak())

    # ── CHAPTER 1 ──
    story.append(Paragraph(ar("الباب الأول: الرؤية العامة وفلسفة مشروع كارس جو (Cars JO)"), h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=emerald_color, spaceAfter=12))

    ch1_text = (
        "منصة كارس جو (Cars JO) هي المنصة الرقمية الأحدث والأشمل في المملكة الأردنية الهاشمية لتكنولوجيا السيارات، "
        "والتي تجمع بين بيع وشراء السيارات المستعملة والجديدة، مزادات السيارات المباشرة، سوق قطع الغيار الأصلية والمستعملة، "
        "دليل ورش الصيانة والخدمات الفنية، المنتدى النقاشي الأردني للسيارات، ورادار محطات شحن السيارات الكهربائية (EV Charging Radar).\n\n"
        "تم تصميم المنصة لتلبية الاحتياجات الخاصة بالسوق الأردني، مثل احتساب تعرفة الجمارك والترخيص لعام 2026، "
        "التأكد من حالة الجمرك (مجمركة بالكامل / منطقة حرة / إعفاء ذوي الاحتياجات / تكسي مميز)، "
        "متابعة صحة بطاريات السيارات الكهربائية والهايبرد (SOH % و Range KM)، واختبار حالة الشاسي الأردنية (7 جيد / 4 جيد / دقة شاسي)."
    )
    story.append(Paragraph(ar(ch1_text), body_style))
    story.append(Spacer(1, 10))

    # ── CHAPTER 2 ──
    story.append(Paragraph(ar("الباب الثاني: البنية الفنية وحزمة التقنيات (Technology Stack)"), h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=emerald_color, spaceAfter=12))

    tech_stack = [
        [ar("Next.js 16 (App Router & React Server Components)"), ar("إطار العمل (Framework):")],
        [ar("React 19, TypeScript 5, Framer Motion, Lucide React"), ar("الواجهة الأمامية (Frontend):")],
        [ar("Vanilla CSS3 & Modern CSS Design System + Tailwind CSS"), ar("التصميم والتنسيق:")],
        [ar("Prisma ORM 5.x & Neon PostgreSQL Remote DB (Cloud)"), ar("قاعدة البيانات (Database):")],
        [ar("NVIDIA API NIM (ChatGPT OSS 120B Model) & SSE Streaming"), ar("الذكاء الاصطناعي (AI Engine):")],
        [ar("JWT Authentication, HTTP-only Cookies, Bcrypt Password Hashing"), ar("الأمان والمصادقة:")],
        [ar("Node.js Native HTTP Daemon Server & Proxy Routing"), ar("السيرفر والاستضافة:")],
    ]
    t_stack = Table(tech_stack, colWidths=[330, 150])
    t_stack.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f1f5f9")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('FONTNAME', (0,0), (-1,-1), 'Arabic'),
        ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_stack)
    story.append(Spacer(1, 15))

    # ── CHAPTER 3 ──
    story.append(Paragraph(ar("الباب الثالث: البنية المعمارية لقواعد البيانات ومخطط Prisma ORM"), h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=emerald_color, spaceAfter=12))

    ch3_text = (
        "تعتمد المنصة على قاعدة بيانات علاقاتية قوية موزعة سحابياً بواسطة Neon PostgreSQL مع Prisma ORM. "
        "تضم أكثر من 25 جدولا رئيسيا تشمل كافة الجوانب من سيارات، مزادات، محادثات، ورش، وقطع غيار."
    )
    story.append(Paragraph(ar(ch3_text), body_style))

    models_info = [
        [ar("User"), ar("المستخدمون والمدراء والتجار مع حفظ الجلسة والموقع ورقم الواتساب ورتبة التاجر المعتمد.")],
        [ar("Car"), ar("إعلانات السيارات وتفاصيل الشاسي والجمارك الأردنية وبطارية الهايبرد والرمز المرجعي refCode.")],
        [ar("CarImage"), ar("صور السيارات المتعددة وترتيب العرض والمحيط الفني للسيارة.")],
        [ar("Conversation"), ar("المحادثات المباشرة بين المشتري والبائع المرتبطة بسيارة معينة أو حجز.")],
        [ar("Message"), ar("الرسائل النصية الفورية، حالة القراءة، والروابط التفاعلية.")],
        [ar("CarBooking"), ar("طلبات معاينة السيارات وحجوزات فحص المواعيد.")],
        [ar("Workshop"), ar("ورش الصيانة المعتمدة، الخدمات، الماركات المتخصصة، والتقييمات.")],
        [ar("Part"), ar("إعلانات قطع الغيار للبيع والحالة والمدينة ورقم القطعة.")],
        [ar("Auction & Bid"), ar("مزادات السيارات والزايدات والمزايدات الفورية والوقت المتبقي.")],
        [ar("ForumTopic & Post"), ar("نقاشات منتدى السيارات الأردني والردود والمنشن وإرفاق الصور.")],
        [ar("Notification"), ar("نظام الإشعارات الفوري للرسائل، التحديثات، والمزادات.")],
    ]
    t_models = Table(models_info, colWidths=[110, 370])
    t_models.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('FONTNAME', (0,0), (0,-1), 'Arabic-Bold'),
        ('FONTNAME', (1,0), (1,-1), 'Arabic'),
        ('TEXTCOLOR', (0,0), (0,-1), accent_blue),
        ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_models)
    story.append(PageBreak())

    # ── CHAPTER 4 & 5 ──
    story.append(Paragraph(ar("الباب الرابع والخامس: نظام الأمان وتحديد معدل الطلبات (Security & Rate Limits)"), h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=emerald_color, spaceAfter=12))

    ch4_text = (
        "1. **تشفير Bcrypt:** كلمات المرور مشفرة بدقة عالية مع Salt ديناميكي.\n"
        "2. **مصادقة JWT و HttpOnly Cookies:** حماية التوكنز ضد هجمات XSS.\n"
        "3. **Rate Limiting Guard:** تفعيل ذاكرة الحظر المؤقت لتحديد أقصى عدد طلبات لكل IP لمنع هجمات الـ DDoS والـ Brute Force."
    )
    story.append(Paragraph(ar(ch4_text), body_style))

    security_code = """export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: Math.ceil(config.windowMs / 1000) };
  }
  if (record.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetIn: Math.ceil((record.resetTime - now) / 1000) };
  }
  record.count++;
  return { allowed: true, remaining: config.maxRequests - record.count, resetIn: Math.ceil((record.resetTime - now) / 1000) };
}"""
    story.append(Paragraph(security_code, code_style))
    story.append(Spacer(1, 15))

    # ── CHAPTER 6 ──
    story.append(Paragraph(ar("الباب السادس: تشريح كافة الصفحات والمكونات (Page-by-Page Deep Dive)"), h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=emerald_color, spaceAfter=12))

    pages_detail = [
        ("الصفحة الرئيسية (/) ", "تحتوي على الهيرو الفاخر بتصميم Glassmorphic، محرك البحث المتعدد (سيارات، ورش، قطع غيار، منتدى)، شبكة الخدمات الأربعة الرئيسية، وبانر سحب ونقل السيارات للطوارئ 24/7."),
        ("صفحة الإعلان التفصيلية (/cars/[id])", "تعرض معرض صور اللمس الكلي Touch Lightbox، مصفوفة المواصفات الفنية الكاملة، تقرير الفحص الأردني (7 جيد)، مؤشر السعر العادل، وبطاقة البائع مع أزرار إرسال الرسالة عبر الموقع وطلب اختبار القيادة 🚗."),
        ("صفحة إضافة سيارة جديدة (/cars/add)", "معالج ذكي بـ 4 خطوات مع اختيار حالة الجمرك الأردني، تفاصيل بطارية الهايبرد/الكهرباء SOH %، فك شفرة رقم الشاسي VIN، والمولد الآلي بالذكاء الاصطناعي."),
        ("رادار شواحن الكهرباء (/ev-charging-jordan)", "خريطة تفاعلية ومحطات الشحن الفائق السريع (GB/T, CCS2, Type 2) في عمان وإربد والزرقاء والعقبة مع حاسبة الوفر السنوي للبنزين بالدينار الأردني."),
        ("صفحة المنتدى النقاشي (/forum & /forum/t/[slug])", "مجتمع نقاشات السيارات الأردني مع إمكانية الرد على المشاركات بالمنشن، إرفاق الصور، الإيموجي، وتقييم الردود المفيدة."),
        ("لوحة تحكم الإدارة الشاملة (/admin)", "إدارة كاملة للمستخدمين، الإعلانات، تقارير المنتدى والورش، إحصائيات النشاط، والنسخ الاحتياطي التلقائي للبيانات."),
      ]
    for p_title, p_desc in pages_detail:
        story.append(Paragraph(ar(f"🔹 {p_title}:"), h2_style))
        story.append(Paragraph(ar(p_desc), body_style))
        story.append(Spacer(1, 3))

    story.append(PageBreak())

    # ── CHAPTER 7 & 8 ──
    story.append(Paragraph(ar("الباب السابع والثامن: الذكاء الاصطناعي وسيناريوهات المستخدم (AI & Workflows)"), h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=emerald_color, spaceAfter=12))

    ch7_text = (
        "**المساعد الذكي (ChatGPT OSS 120B):**\n"
        "- مجهز بنموذج `openai/gpt-oss-120b` عبر NVIDIA API NIM.\n"
        "- يدعم بث الكلمات مباشر كلمة بكلمة (Word-by-Word SSE Stream) في 12ms.\n"
        "- مدرب على فهم سوق السيارات الأردني، الجمارك، وأسعار التمويل.\n\n"
        "**سيناريوهات التواصل الشائعة:**\n"
        "1. **مراسلة البائع:** النقر على 'إرسال رسالة عبر الموقع' يفتح محادثة خاصة فورية (/messages?conversationId=...).\n"
        "2. **طلب اختبار القيادة:** إرسال طلب معاينة وتجربة محدد للمالك تلقائياً."
    )
    story.append(Paragraph(ar(ch7_text), body_style))
    story.append(Spacer(1, 15))

    # ── CHAPTER 9 & 10 ──
    story.append(Paragraph(ar("الباب التاسع والعاشر: الأداء والخريطة الثورية المستقبلية 🚀"), h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=emerald_color, spaceAfter=12))

    ch9_text = (
        "**الأفكار الـ 8 الثورية المستقبلية المخطط لتنفيذها في المنصة:**\n\n"
        "1. 🔊 **محلل صوت المحرك بالذكاء الاصطناعي:** تسجيل صوت المحرك لـ 10 ثوانٍ وتحليل الترددات الصوتيّة لاكتشاف التكتكة والأعطال.\n"
        "2. 📱 **معاينة السيارات بالواقع المعزز (AR):** إسقاط السيارة 3D بحجمها الطبيعي في كراج المشتري عبر الموبايل.\n"
        "3. 🤖 **مفاوض الأسعار الآلي:** بوت تفاوض آلي محمي بين البائع والمشتري للوصول لسعر عادل دون حرج.\n"
        "4. 📜 **جواز السفر الرقمي للسيارة الأردنية (Digital Passport):** سجل موثق برقم الشاسي VIN لغيار الزيت والبطارية يرفع سعر السيارة 20%.\n"
        "5. ⏱️ **مزادات الـ 60 ثانية السريعة:** مزاد مباشر لسيارات اللقطة بالمنطقة الحرة."
    )
    story.append(Paragraph(ar(ch9_text), body_style))

    story.append(Spacer(1, 25))
    story.append(HRFlowable(width="100%", thickness=2, color=emerald_color, spaceAfter=15))
    story.append(Paragraph(ar("تم بحمد الله وتوفيقه إصدار وتوليد موسوعة التوثيق الفني الكامل لمنصة Cars JO 🇯🇴"), ParagraphStyle('EndNote', parent=body_style, alignment=1, fontName='Arabic-Bold', textColor=emerald_color)))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Exhaustive PDF Generated Successfully: {pdf_filename}")

if __name__ == "__main__":
    generate_cars_jo_pdf()
