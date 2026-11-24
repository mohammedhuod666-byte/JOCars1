# -*- coding: utf-8 -*-
"""
Script to generate the JO Cars Investor Pitch & Comprehensive Technical Report PDF.
"""
import os
import sys
import textwrap
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
import arabic_reshaper
from bidi.algorithm import get_display

# ── Fonts Registration ──
FONT_REGULAR = 'C:/Windows/Fonts/arial.ttf'
FONT_BOLD = 'C:/Windows/Fonts/arialbd.ttf'

pdfmetrics.registerFont(TTFont('ArRegular', FONT_REGULAR))
pdfmetrics.registerFont(TTFont('ArBold', FONT_BOLD))

# ── Helper for Arabic Text Reshaping and Bidi ──
def ar(text):
    if not text:
        return ''
    reshaped = arabic_reshaper.reshape(str(text))
    return get_display(reshaped)

def ar_para(text, width=80):
    if not text:
        return ''
    paragraphs = str(text).split('\n')
    formatted_lines = []
    for p in paragraphs:
        p = p.strip()
        if not p:
            formatted_lines.append('')
            continue
        lines = textwrap.wrap(p, width=width)
        for l in lines:
            formatted_lines.append(get_display(arabic_reshaper.reshape(l)))
    return '<br/>'.join(formatted_lines)

# ── Numbered Canvas for Two-Pass Page Numbering ──
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            # Skip decorations on the cover page
            return

        self.saveState()
        self.setFont('ArRegular', 9)
        self.setFillColor(colors.HexColor('#64748B'))

        # Header
        header_text = ar('منصة كارس جو (JO Cars) — ملف الاستثمار والتقرير الفني الشامل 2026')
        self.drawRightString(A4[0] - 40, A4[1] - 30, header_text)
        self.setStrokeColor(colors.HexColor('#E2E8F0'))
        self.setLineWidth(0.75)
        self.line(40, A4[1] - 35, A4[0] - 40, A4[1] - 35)

        # Footer
        footer_left = 'JO CARS PLATFORM — CONFIDENTIAL & PROPRIETARY'
        footer_right = ar(f'صفحة {self._pageNumber} من {page_count}')
        self.drawString(40, 25, footer_left)
        self.drawRightString(A4[0] - 40, 25, footer_right)
        self.line(40, 35, A4[0] - 40, 35)

        self.restoreState()

def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=48,
        bottomMargin=48
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='ArBold',
        fontSize=24,
        leading=34,
        alignment=1, # Center
        textColor=colors.HexColor('#0F172A')
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='ArRegular',
        fontSize=13,
        leading=20,
        alignment=1,
        textColor=colors.HexColor('#D97706')
    )

    h1_style = ParagraphStyle(
        'Heading1_Ar',
        parent=styles['Normal'],
        fontName='ArBold',
        fontSize=16,
        leading=24,
        alignment=2, # Right
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=8,
        spaceBefore=14
    )

    h2_style = ParagraphStyle(
        'Heading2_Ar',
        parent=styles['Normal'],
        fontName='ArBold',
        fontSize=12,
        leading=18,
        alignment=2,
        textColor=colors.HexColor('#B45309'),
        spaceAfter=6,
        spaceBefore=10
    )

    body_style = ParagraphStyle(
        'Body_Ar',
        parent=styles['Normal'],
        fontName='ArRegular',
        fontSize=10,
        leading=16,
        alignment=2,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=6
    )

    body_bold = ParagraphStyle(
        'BodyBold_Ar',
        parent=styles['Normal'],
        fontName='ArBold',
        fontSize=10,
        leading=16,
        alignment=2,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Ar',
        parent=styles['Normal'],
        fontName='ArRegular',
        fontSize=9.5,
        leading=15,
        alignment=2,
        textColor=colors.HexColor('#334155'),
        spaceAfter=4
    )

    callout_style = ParagraphStyle(
        'Callout_Ar',
        parent=styles['Normal'],
        fontName='ArRegular',
        fontSize=9.5,
        leading=15,
        alignment=2,
        textColor=colors.HexColor('#0F172A')
    )

    story = []

    # ════════════════════════════════════════════════════════════════
    # PAGE 1: COVER PAGE
    # ════════════════════════════════════════════════════════════════
    story.append(Spacer(1, 40))

    # Top Brand Pill
    pill_data = [[
        Paragraph(f"<b>{ar('المملكة الأردنية الهاشمية • الجيل القادم لتجارة السيارات الذكية')}</b>", ParagraphStyle(
            'PillText', parent=styles['Normal'], fontName='ArBold', fontSize=10, leading=14, alignment=1, textColor=colors.HexColor('#92400E')
        ))
    ]]
    pill_table = Table(pill_data, colWidths=[515])
    pill_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FEF3C7')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#F59E0B')),
        ('ROUNDEDCORNERS', [8, 8, 8, 8]),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    story.append(pill_table)
    story.append(Spacer(1, 25))

    # Main Titles
    story.append(Paragraph(ar_para("منظومة كارس جو الرقمية — JO CARS"), title_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph(ar_para("ملف الاستثمار والعرض التعريفي الشامل والتقرير التقني المتقدم"), subtitle_style))
    story.append(Spacer(1, 8))
    story.append(Paragraph(ar_para("المنصة الأردنية الذكية المتكاملة لتجارة السيارات، قطع الغيار، وخدمات الصيانة المدعومة بالذكاء الاصطناعي"), ParagraphStyle(
        'CoverDesc', parent=styles['Normal'], fontName='ArRegular', fontSize=10.5, leading=16, alignment=1, textColor=colors.HexColor('#475569')
    )))
    story.append(Spacer(1, 30))

    # KPI Highlight Grid (4 Cards in a Table)
    kpi_data = [
        [
            Paragraph(f"<font size=14><b>120</b></font><br/><font size=8.5>{ar('صفحة وشاشة برمجية')}</font>", ParagraphStyle('KPI1', alignment=1, fontName='ArBold', textColor=colors.HexColor('#0F172A'))),
            Paragraph(f"<font size=14><b>212</b></font><br/><font size=8.5>{ar('واجهة API متخصصة')}</font>", ParagraphStyle('KPI2', alignment=1, fontName='ArBold', textColor=colors.HexColor('#0F172A'))),
            Paragraph(f"<font size=14><b>250</b></font><br/><font size=8.5>{ar('مسار تصفح مجمّع')}</font>", ParagraphStyle('KPI3', alignment=1, fontName='ArBold', textColor=colors.HexColor('#0F172A'))),
            Paragraph(f"<font size=14><b>10</b></font><br/><font size=8.5>{ar('أدوات ذكاء وحسابية')}</font>", ParagraphStyle('KPI4', alignment=1, fontName='ArBold', textColor=colors.HexColor('#0F172A'))),
        ]
    ]
    kpi_table = Table(kpi_data, colWidths=[125, 125, 125, 125])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#F1F5F9')),
        ('BACKGROUND', (1, 0), (1, 0), colors.HexColor('#F1F5F9')),
        ('BACKGROUND', (2, 0), (2, 0), colors.HexColor('#F1F5F9')),
        ('BACKGROUND', (3, 0), (3, 0), colors.HexColor('#F1F5F9')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 35))

    # Executive Box Summary
    exec_box = [
        [Paragraph(f"<b>{ar('نبذة موجزة للمستثمرين وأصحاب القرار:')}</b><br/>" +
                   ar_para("تم تصميم وتطوير منصة JO Cars لتكون الحل الجذري الأكبر لسوق السيارات الأردني الذي عانى طويلاً من العشوائية في التسعير، عمليات التلاعب بفحص المركبات، وغياب الثقة. المنصة تجمع بين محرك تسعير عادل بالذكاء الاصطناعي (Fair Market Value Engine)، ونظام مزادات علنية موثوق، وسوق قطع غيار برقم الـ OEM الأصلي، مع درع أمني آلي فائق القوة (Sentinel Shield) يحمي كافة التعاملات من الاحتيال والاختراق."),
                   callout_style)]
    ]
    exec_table = Table(exec_box, colWidths=[515])
    exec_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor('#0F172A')),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('LEFTPADDING', (0, 0), (-1, -1), 16),
        ('RIGHTPADDING', (0, 0), (-1, -1), 16),
    ]))
    story.append(exec_table)

    story.append(Spacer(1, 45))

    # Footer Metadata on Cover
    meta_data = [
        [
            Paragraph(f"<font color='#64748B'>{ar('تاريخ التقرير:')}</font> <b>{ar('نوفمبر 2026')}</b>", ParagraphStyle('M1', alignment=2, fontName='ArRegular', fontSize=9)),
            Paragraph(f"<font color='#64748B'>{ar('الإصدار الفني:')}</font> <b>v1.0 Production Release</b>", ParagraphStyle('M2', alignment=1, fontName='ArRegular', fontSize=9)),
            Paragraph(f"<font color='#64748B'>{ar('البيئة التشغيلية:')}</font> <b>Next.js 16 + Neon PostgreSQL</b>", ParagraphStyle('M3', alignment=0, fontName='ArRegular', fontSize=9)),
        ]
    ]
    meta_table = Table(meta_data, colWidths=[170, 175, 170])
    meta_table.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, -1), 0.75, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)

    story.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # PAGE 2: EXECUTIVE OVERVIEW & INVESTOR VALUE PROPOSITION
    # ════════════════════════════════════════════════════════════════
    story.append(Paragraph(ar("1. التعريف العام بالمنصة والرؤية الاستثمارية (Executive Pitch)"), h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#D97706'), spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(ar_para(
        "منصة كارس جو (JO Cars) هي أول بيئة تجارية ورقمية ذكية متكاملة لقطاع السيارات في الأردن، تهدف إلى إعادة هيكلة سوق المركبات وقطع الغيار عبر تحويله من نموذج الوساطة التقليدية العشوائية إلى منظومة اقتصادية رقمية قائمة على البيانات الموثوقة والذكاء الاصطناعي."
    ), body_style))

    story.append(Paragraph(ar("الفرصة السوقية والمشكلات الجوهرية التي نحلها (Market Gap & Pain Points):"), h2_style))
    
    problems = [
        ("فوضى وتخبط التسعير:", "يعاني المشتري والبائع من فجوات تسعيرية هائلة لنفس السيارة بسبب مبالغات البائعين وتضارب تقديرات السماسرة غير الموثقة."),
        ("عمليات الغش والتلاعب بالفحص:", "انتشار بيع السيارات المتعرضة لحوادث غرق أو شواصي مقصوصة تحت مسميات غير دقيقة لغياب الربط مع تاريخ الفحص الحقيقي."),
        ("فوضى سوق قطع الغيار:", "صعوبة مطابقة رقم القطعة المصنعي OEM، وانتشار القطع المقلدة والمستعملة التالفة وغياب سياسات واضحة لضمان الاسترجاع."),
        ("غياب منصة وطنية موحدة:", "تشتت المستخدم بين عدة مواقع إعلانات عامة تفتقر إلى التخصص، الأمان الرقمي، وأدوات الحسابات المالية والجمركية.")
    ]

    for p_title, p_desc in problems:
        story.append(Paragraph(f"• <b>{ar(p_title)}</b> {ar_para(p_desc, width=75)}", bullet_style))

    story.append(Spacer(1, 10))
    story.append(Paragraph(ar("نموذج الأعمال وتحقيق الإيرادات للمستثمرين (Monetization & Revenue Streams):"), h2_style))

    revenue_table_data = [
        [ar("العائد السنوي المتوقع"), ar("الجمهور المستهدف"), ar("طبيعة التدفق المالي"), ar("قناة الإيراد")],
        [ar("تدفق مستقر ومتكرر"), ar("معارض الحراج والوكلاء"), ar("باقات SaaS شهرية وسنوية"), ar("1. اشتراكات التجار والمعارض")],
        [ar("عائد فوري مرتفع"), ar("البائعين الأفراد والتجار"), ar("رسوم دفع عند الطلب (Per-Ad)"), ar("2. تمييز الإعلانات والترويج VIP")],
        [ar("نسبة من حجم التداول"), ar("المزايدين والمشترين"), ar("عمولة نجاح الصفقة (1-2.5%)"), ar("3. مزادات السيارات والأرقام")],
        [ar("اشتراكات ورسوم فئات"), ar("مستوردي وتجار القطع"), ar("باقة تاجر قطع + عمولة شراء"), ar("4. شبكة سوق قطع الغيار")],
        [ar("عائد متكرر مرتفع الهامش"), ar("المشترين والمستثمرين"), ar("رسوم تقرير تفصيلي بالـ AI"), ar("5. تقارير الفحص والتقييم العادل")],
    ]

    r_table = Table([[Paragraph(c, ParagraphStyle('RTC', fontName='ArBold' if r == 0 else 'ArRegular', fontSize=8.5, alignment=1, textColor=colors.HexColor('#FFFFFF' if r == 0 else '#0F172A'))) for c in row] for r, row in enumerate(revenue_table_data)], colWidths=[120, 130, 135, 130])
    r_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    story.append(r_table)

    story.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # PAGE 3: PLATFORM SCALE & ARCHITECTURE (PAGES BREAKDOWN)
    # ════════════════════════════════════════════════════════════════
    story.append(Paragraph(ar("2. حجم وهيكل المنصة الرقمية وتوزيع الصفحات (Scale & System Architecture)"), h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#D97706'), spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(ar_para(
        "تم تشييد المنصة وفق أحدث المعايير البرمجية العالمية بالاعتماد على بنية Next.js 16 (Turbopack) وقواعد بيانات Neon PostgreSQL السحابية، مما منحها سرعة استجابة فورية وقدرة على التوسع لخدمة ملايين الزيارات شهرياً."
    ), body_style))

    story.append(Paragraph(ar("إجمالي الصفحات والمسارات التشغيلية:"), h2_style))

    # Pages breakdown Table
    pages_data = [
        [ar("الوظيفة التشغيلية"), ar("العدد الفعلي"), ar("النطاق البرمجي والقطاع")],
        [ar("سوق السيارات، المزادات، قطع الغيار، المنتدى، غرف الدردشة المشفرة، الملف الشخصي، المعارض، الفيديوهات القصيرة (Reels)، لوحات الأرقام، فحص الـ VIN، وحاسبات التبديل."), "66", ar("واجهات المستخدم العامة (Public & User Marketplace)")],
        [ar("إدارة الإعلانات، الموافقة على التجار، إدارة أسعار السوق، تتبع شكاوى النصب، التحكم بدرع الحماية Sentinel، النسخ الاحتياطي، وإدارة شارات التوثيق."), "36", ar("لوحة القيادة العليا للإدارة (Admin Master Control)")],
        [ar("لوحة تحكم معارض السيارات، إدارة أسطول المركبات، لوحة إدارة الورش، سجل الصيانة والتكاليف، حجز المواعيد الفنية، ومراجعات الزبائن الموثقة."), "13", ar("بوابة المعارض والورش المعتمدة (Dealers & Workshops)")],
        [ar("حاسبة التقييم العادل FMV، حاسبة فرق البدل، حاسبة الجمارك الأردنية، حاسبة التمويل البنكي، حاسبة تكلفة الامتلاك السنوية، ومحلل تقارير الفحص الفني."), "10", ar("أدوات الذكاء الاصطناعي والحاسبات (AI & Financial Tools)")],
        [ar("العدد الإجمالي لملفات الشاشات البرمجية المسجلة في المشروع."), "120", ar("إجمالي الصفحات البرمجية (page.tsx)")],
        [ar("واجهات ربط البيانات وإجراء المعاملات السريعة والمحمية."), "212", ar("واجهات الـ API الخلفية (route.ts)")],
        [ar("المسارات الثابتة والديناميكية المجمعة أثناء بناء الإنتاج الفعلي."), "250", ar("مسارات التصفح المجهزة (Static & Dynamic Routes)")]
    ]

    p_table = Table([[Paragraph(c, ParagraphStyle('PTC', fontName='ArBold' if r in [0, 5, 6, 7] else 'ArRegular', fontSize=8, alignment=1 if r == 0 or c.isdigit() else 2, textColor=colors.HexColor('#FFFFFF' if r == 0 else ('#B45309' if r in [5, 6, 7] else '#0F172A')))) for c in row] for r, row in enumerate(pages_data)], colWidths=[240, 65, 210])
    p_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('BACKGROUND', (0, 1), (-1, 4), colors.HexColor('#FFFFFF')),
        ('BACKGROUND', (0, 5), (-1, 7), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 4.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4.5),
        ('ALIGN', (1, 1), (1, -1), 'CENTER'),
    ]))
    story.append(p_table)

    story.append(Spacer(1, 10))
    story.append(Paragraph(ar("أبرز واجهات تجربة المستخدم التفاعلية:"), h2_style))
    features_ux = [
        ("غرف الدردشة الفورية ثنائية الاتجاه:", "مراسلة مباشرة بين البائع والمشتري مع تحديث لحظي، دعم التنبيهات، خيارات التفاوض على السعر وحجز المعاينة بنقرة واحدة."),
        ("منتدى نقاشات السيارات المتطور:", "مجتمع متكامل يضم خبراء الصيانة وملاك السيارات، مدعوم بخاصية تثبيت الردود الإدارية، إجابات معتمدة، واقتباسات ذكية."),
        ("سوق قطع الغيار الأردني الشامل:", "أكثر من 10 تصنيفات رئيسية، فلترة دقيقة لموديل وسنة الصنع، وكتابة اسم القطعة يدوياً في حال عدم توفرها بالقائمة.")
    ]
    for f_title, f_desc in features_ux:
        story.append(Paragraph(f"• <b>{ar(f_title)}</b> {ar_para(f_desc, width=75)}", bullet_style))

    story.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # PAGE 4: DETAILED EXPLANATION OF AI FAIR PRICE VALUATION TOOL
    # ════════════════════════════════════════════════════════════════
    story.append(Paragraph(ar("3. أداة تقرير التقييم العادل وتحليل السوق بالذكاء الاصطناعي (AI FMV Engine)"), h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#D97706'), spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(ar_para(
        "تعد أداة 'التقييم العادل وتحليل السوق' (Fair Market Value Engine) الجوهرة التقنية لمنصة كارس جو وأقوى ميزة تنافسية تميزها عن أي منصة إعلانات مبوبة أخرى في الشرق الأوسط. الأداة لا تعتمد على أرقام تخمينية، بل ترتكز على محرك رياضيات دقيق وذكاء اصطناعي تحليلي يراعي واقع السوق الأردني."
    ), body_style))

    story.append(Paragraph(ar("الركائز الهندسية للخوارزمية (Engine Principles):"), h2_style))

    principles = [
        ("مبدأ 'الأدلة الواقعية أولاً' (Evidence First):", "الخوارزمية ترفض وضع أي سعر عشوائي؛ إذا لم تتوفر بيانات حقيقية كافية في السوق لسيارة معينة، يظهر النظام تنبيهاً صريحاً بأن التقييم يحتاج شواهد إضافية لضمان الأمانة المطلقة."),
        ("عزل سعر العرض (Asking Price Isolation):", "لا تتأثر الخوارزمية إطلاقاً بالسعر الذي يطلبه البائع في إعلانه، وذلك لمنع التلاعب بالتسعير أو رفع القيمة السوقية بناءً على مبالغات البائعين."),
        ("مصفوفة المقارنة المباشرة الفائقة (Direct Comps Matrix):", "تتم مقارنة المركبة مع صفقات حقيقية وسيارات مطابقة لها بنسبة 100% من حيث: سنة الصنع، فئة التجهيز (Trim)، الممشى الفعلي، ونوع المحرك (بنزين/هايبرد/كهرباء)."),
        ("معامل الفحص الفني الأردني (Inspection Coefficient):", "تأثير دراماتيكي لواقع الفحص المحلي (فحص 7 جيد، 4 جيد، دقة مضروب ومصلح، قصعة، غيار واجهة، شواصي مقصوصة) وتعديل السعر ديناميكياً بناءً على ذلك."),
        ("استبعاد القيم الشاذة (Leave-One-Out Consensus):", "تطبيق خوارزمية إحصائية متقدمة تستبعد تلقائياً الإعلانات الوهمية أو الأسعار الرخيصة بداعي النصب، مما ينتج نطاق سعري نقي ودقيق (Consensus Band).")
    ]

    for p_title, p_desc in principles:
        story.append(Paragraph(f"• <b>{ar(p_title)}</b> {ar_para(p_desc, width=75)}", bullet_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph(ar("كيف يظهر التقرير في صفحة إعلان السيارة؟"), h2_style))

    box_ai = [
        [Paragraph(f"<b>{ar('مخرجات تقرير الذكاء الاصطناعي للمشتري والبائع:')}</b><br/>" +
                   ar_para("1. تصنيف الإعلان الفوري: يوضح للمشتري مباشرة هل السيارة (أقل من سعر السوق - صفقة رابحة)، أو (سعر عادل ومنطقي)، أو (سعر أعلى من متوسط السوق).\n" +
                           "2. القيمة السوقية العادلة (FMV): رقم دقيق بالدينار الأردني يمثل السعر الحقيقي الواجب دفعه للمركبة بناءً على حالتها الفنية.\n" +
                           "3. النطاق السعري التوافقي: يعرض الحد الأدنى والأعلى للسعر في السوق الأردني (مثلاً من 16,300 إلى 17,200 د.أ).\n" +
                           "4. الشفافية والموثوقية: يعرض التقرير عدد الإعلانات المشابهة التي تم الاستناد إليها، مع تفريغ كامل لخصومات الفحص والكيلومتراج."),
                   callout_style)]
    ]
    t_box_ai = Table(box_ai, colWidths=[515])
    t_box_ai.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FEFCE8')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#FACC15')),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 14),
        ('RIGHTPADDING', (0, 0), (-1, -1), 14),
    ]))
    story.append(t_box_ai)

    story.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # PAGE 5: CYBERSECURITY & SENTINEL SHIELD
    # ════════════════════════════════════════════════════════════════
    story.append(Paragraph(ar("4. منظومة الحماية والأمان السيبراني الشامل (Cyber Defense & Sentinel Shield)"), h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#D97706'), spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(ar_para(
        "تم تزويد منصة كارس جو بحزام أمان سيبراني استباقي متعدد الطبقات، يقوده الحارس الأمني الآلي (Sentinel) المصمم خصيصاً لرصد ومكافحة أي محاولات اختراق أو مسح أمني أو تلاعب بالبيانات بصورة فورية."
    ), body_style))

    story.append(Paragraph(ar("طبقات الدفاع والحماية المطبقة في المنصة:"), h2_style))

    security_layers = [
        [ar("آلية الحماية والتصدي الفوري"), ar("الوزن والتصرف"), ar("طبقة التهديد الأمني")],
        [ar("استخدام استعلامات برمجية مؤمنة كلياً عبر Prisma ORM تمنع حقن أي كود SQL خبيث في قواعد البيانات بنسبة 100%."), ar("حظر فوري دائم"), ar("1. حقن قواعد البيانات (SQL Injection)")],
        [ar("فخاخ ذكية للمسارات المخترقة مثل /.env و /wp-admin و /.git تسحب المخترق لكشفه وتجميد عنوان الـ IP الخاص به."), ar("كشف وفخاخ آلية"), ar("2. مصائد المخترقين (Honeypot Traps)")],
        [ar("تحديد معدل الطلبات (Rate Limiting) على مسارات الدخول واسترجاع كلمات المرور، وقفل الحساب مؤقتاً عند تكرار الفشل."), ar("قفل + تدقيق OTP"), ar("3. هجمات التخمين (Brute Force)")],
        [ar("فصل الجلسات عبر JWT مرتبط ببصمة كلمة المرور (Password Version)؛ أي تغيير لكلمة المرور يلغي فوراً كافة الجلسات."), ar("إلغاء فوري للجلسات"), ar("4. أمان التوكن والجلسات (JWT Security)")],
        [ar("التعقيم الصارم لكافة المدخلات والتنفيذ داخل React Virtual DOM لمنع تشغيل أي أكواد Script أو اختراق ملفات تعريف الارتباط."), ar("تعقيم كامل للبيانات"), ar("5. هجمات حقن النصوص (XSS & CSRF)")],
        [ar("حظر فوري تلقائي لأي مستخدم عادي يحاول الوصول لمسارات /admin، مع إرسال إشعار فوري عبر WhatsApp للمشرفين."), ar("حظر آلي 7 أيام"), ar("6. استكشاف لوحة المدير (Admin Probe)")],
        [ar("تسجيل كامل لكل العمليات الحساسة (إنشاء إعلانات، تعديل أسعار، حظر مستخدمين) في سجل مشفر يحتوي IP والوقت والمنفذ."), ar("سجل أدلة جنائية"), ar("7. سجل التدقيق الشامل (Audit Logging)")]
    ]

    sec_table = Table([[Paragraph(c, ParagraphStyle('STC', fontName='ArBold' if r == 0 else 'ArRegular', fontSize=8, alignment=1 if r == 0 or r == 1 else 2, textColor=colors.HexColor('#FFFFFF' if r == 0 else '#0F172A'))) for c in row] for r, row in enumerate(security_layers)], colWidths=[240, 110, 165])
    sec_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 4.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4.5),
        ('ALIGN', (1, 1), (1, -1), 'CENTER'),
    ]))
    story.append(sec_table)

    story.append(Spacer(1, 12))
    story.append(Paragraph(ar("نظام التهديد التراكمي في Sentinel (Threat Scoring System):"), h2_style))
    story.append(Paragraph(ar_para(
        "يعمل محرك Sentinel بنظام النقاط الذكي خلال نافذة زمنية مدتها 24 ساعة؛ أي سلوك مريب (مثل محاولة نشر إعلانات مكررة بوتيرة سريعة، مراسلة عشوائية، أو مسح للمسارات) يرفع نقاط التهديد للمستخدم. عند وصول النقاط إلى 30 يتم تطبيق حظر مؤقت لـ 24 ساعة، وإذا بلغت 60 نقطة يتحول الحظر إلى دائم وتُرفع أدلته الجنائية للوحة المدير فوراً."
    ), body_style))

    story.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # PAGE 6: CONCLUSION & INVESTOR ROADMAP
    # ════════════════════════════════════════════════════════════════
    story.append(Paragraph(ar("5. الخلاصة الاستثمارية وموقع الملف في النظام (Conclusion & File Location)"), h1_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#D97706'), spaceBefore=2, spaceAfter=10))

    story.append(Paragraph(ar_para(
        "تعتبر منصة كارس جو مشروعاً تكنولوجياً متكاملاً جاهزاً للنمو السريع والاستحواذ على الحصة الأكبر من سوق المركبات في الأردن. بفضل الدمج بين قوة المعالجة الخلفية، دقة خوارزميات التسعير، الحماية السيبرانية المطلقة، والشمولية التشغيلية التي تخدم المشتري، البائع، المعرض، وورشة الصيانة في بيئة واحدة."
    ), body_style))

    story.append(Spacer(1, 8))

    # Location Information Box
    loc_box = [
        [Paragraph(f"<b>{ar('بيانات ومسار حفظ ملف التقرير الفني (PDF File Delivery):')}</b><br/><br/>" +
                   f"<b>{ar('اسم الملف:')}</b> <font face='ArBold'>JO_Cars_Investor_Pitch_and_Technical_Report.pdf</font><br/>" +
                   f"<b>{ar('المسار الرئيسي في المشروع:')}</b><br/>" +
                   f"<font size=8.5 face='Courier'>c:\\Users\\zi-jo.com\\OneDrive\\Desktop\\مراحل العمل jocars\\مراحل العمل jocars\\Cars_JO\\JO_Cars_Investor_Pitch_and_Technical_Report.pdf</font><br/><br/>" +
                   f"<b>{ar('مسار النسخة المعتمدة في الأرشيف (Artifacts Directory):')}</b><br/>" +
                   f"<font size=8.5 face='Courier'>C:\\Users\\zi-jo.com\\.gemini\\antigravity\\brain\\d6a45671-84a8-43d9-85fd-1218f78d8557\\JO_Cars_Investor_Pitch_and_Technical_Report.pdf</font><br/><br/>" +
                   f"<b>{ar('حالة الوثيقة:')}</b> {ar('وثيقة رسمية معتمدة ومجهزة للعرض المباشر على المستثمرين ورواد الأعمال.')}",
                   callout_style)]
    ]
    t_loc = Table(loc_box, colWidths=[515])
    t_loc.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#EFF6FF')),
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor('#2563EB')),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('LEFTPADDING', (0, 0), (-1, -1), 14),
        ('RIGHTPADDING', (0, 0), (-1, -1), 14),
    ]))
    story.append(t_loc)

    story.append(Spacer(1, 20))

    # Summary bullet points
    summary_pts = [
        ("الجاهزية التشغيلية:", "النظام في وضع الإنتاج الكامل (Production Mode) وتم اختباره مع قواعد بيانات حية ومسارات API نشطة ومحمية."),
        ("الأمان والامتثال:", "حماية تامة من محاولات التلاعب المالي، شهادات فحص مؤمنة، ونظام شكاوى واسترجاع منظم."),
        ("قابلية التوسع الإقليمي:", "بنية الكود قابلة للتوسع والتطبيق في أسواق دول الخليج والشرق الأوسط بكل سلاسة ومرونة.")
    ]
    for s_title, s_desc in summary_pts:
        story.append(Paragraph(f"✔ <b>{ar(s_title)}</b> {ar_para(s_desc, width=75)}", bullet_style))

    story.append(Spacer(1, 30))

    # Sign-off box
    sign_data = [
        [
            Paragraph(f"<b>JO CARS MANAGEMENT TEAM</b><br/><font color='#64748B'>{ar('إدارة المنصة وفريق التطوير الهندسي')}</font>", ParagraphStyle('SG1', alignment=2, fontName='ArBold', fontSize=9)),
            Paragraph(f"<b>AMMAN - JORDAN</b><br/><font color='#64748B'>{ar('المملكة الأردنية الهاشمية')}</font>", ParagraphStyle('SG2', alignment=0, fontName='ArBold', fontSize=9)),
        ]
    ]
    sign_table = Table(sign_data, colWidths=[260, 255])
    sign_table.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, -1), 1, colors.HexColor('#0F172A')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(sign_table)

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully built: {filename} (Size: {os.path.getsize(filename)} bytes)")

if __name__ == '__main__':
    output_filename = 'JO_Cars_Investor_Pitch_and_Technical_Report.pdf'
    build_pdf(output_filename)
