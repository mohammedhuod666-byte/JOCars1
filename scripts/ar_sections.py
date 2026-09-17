"""Arabic Report Section Builders - Complete 31 Sections"""
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable, KeepTogether,
)
from ar_config import (
    PAGE_W, M, GOLD, BLUE, LIGHT, GRAY, WHITE, BLACK, BG_LIGHT, ar,
    register_fonts,
)


def hr(story, color=GOLD, w=2, space=8):
    story.append(HRFlowable(width="100%", thickness=w, color=color, spaceAfter=space))

def h1(story, s, text):
    story.append(Spacer(1, 6))
    hr(story)
    story.append(Paragraph(ar(text), s['h1']))

def h2(story, s, text):
    story.append(Paragraph(ar(text), s['h2']))

def h3(story, s, text):
    story.append(Paragraph(ar(text), s['h3']))

def body(story, s, text):
    story.append(Paragraph(ar(text), s['body']))

def bullet(story, s, text):
    story.append(Paragraph(f"  {ar(text)}", s['bullet']))

def bullet_en(story, s, text):
    story.append(Paragraph(f"  {text}", s['bullet']))

def make_table(story, s, headers, rows, widths):
    data = [[Paragraph(ar(h), s['th']) for h in headers]]
    for row in rows:
        data.append([Paragraph(ar(str(c)), s['td']) for c in row])
    t = Table(data, colWidths=widths)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), GOLD),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, BG_LIGHT]),
    ]))
    story.append(t)
    story.append(Spacer(1, 6))


# ===================== Cover & TOC =====================

def build_cover(story, s):
    story.append(Spacer(1, 60))
    story.append(HRFlowable(width="60%", thickness=3, color=GOLD, spaceAfter=12))
    story.append(Paragraph("JO Cars", s['cover_title']))
    story.append(Spacer(1, 8))
    story.append(Paragraph("تقرير فني وتجاري شامل", s['cover_sub']))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Comprehensive Technical & Business Report", s['cover_sub']))
    story.append(Spacer(1, 20))
    story.append(Paragraph("أغسطس 2026  |  الإصدار 2.0", s['cover_sub']))
    story.append(Spacer(1, 30))
    hr(story, GOLD, 1, 12)

    stats = [("95", "صفحة"), ("166", "API"), ("66", "نموذج"), ("51K+", "سطر كود")]
    box_data = [[Paragraph(f'<font size="20" color="#D4A843"><b>{n}</b></font><br/>'
                           f'<font size="9" color="#8B949E">{l}</font>', s['body_center'])
                 for n, l in stats]]
    t = Table(box_data, colWidths=[100]*4)
    t.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOX', (0, 0), (0, 0), 1, colors.HexColor("#333333")),
        ('BOX', (1, 0), (1, 0), 1, colors.HexColor("#333333")),
        ('BOX', (2, 0), (2, 0), 1, colors.HexColor("#333333")),
        ('BOX', (3, 0), (3, 0), 1, colors.HexColor("#333333")),
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(t)

    story.append(Spacer(1, 40))
    hr(story, GOLD, 1, 8)
    story.append(Paragraph("منصة JO Cars  |  سوق السيارات الأردني", s['small']))
    story.append(Paragraph("مدعوم بالذكاء الاصطناعي NVIDIA  |  مستضاف على Railway", s['small']))
    story.append(PageBreak())


def build_toc(story, s):
    h1(story, s, "فهرس المحتويات")
    story.append(Spacer(1, 8))
    toc = [
        "1. الملخص التنفيذي",
        "2. البنية التحتية التقنية",
        "3. بنية قاعدة البيانات",
        "4. نقاط نهاية API",
        "5. الصفحات والمسارات",
        "6. بنية الأمان",
        "7. قدرات الذكاء الاصطناعي",
        "8. تصميم واجهة المستخدم",
        "9. تحليل السوق الأردني",
        "10. التأثير الاجتماعي",
        "11. تحليل SWOT",
        "12. الأداء والتحسين",
        "13. خارطة الطريق المستقبلية",
        "14. تفصيل تطبيقات واجهة البرمجة API",
        "15. تفصيل نماذج قاعدة البيانات",
        "16. تفصيل المكونات React",
        "17. تفصيل ملفات المكتبة والأدوات",
        "18. تفصيل Hooks وإدارة الحالة",
        "19. تفصيل Middleware وطبقة الأمان",
        "20. تفصيل ملفات الإعدادات",
        "21. نظام كشف النوايا بالعربية",
        "22. نظام التدفق Stateless",
        "23. نظام رفع الصور",
        "24. نظام الإشعارات والتنبيهات",
        "25. تدفق المصادقة الكامل",
        "26. بنية نظام البث المباشر",
        "27. تحليل جودة الكود",
        "28. التكاملات الخارجية",
        "29. خارطة الطريق التفصيلية",
        "30. تحليل الأداء والتحسينات",
        "31. إحصائيات تفصيلية للمنصة",
    ]
    for item in toc:
        story.append(Paragraph(ar(item), s['toc_item']))
    story.append(PageBreak())


# ===================== Section 1: Executive Summary =====================

def build_section1(story, s):
    from ar_data1 import EXECUTIVE, STATS
    h1(story, s, "1. الملخص التنفيذي")

    h2(story, s, "نظرة عامة")
    body(story, s, EXECUTIVE["intro"])

    h2(story, s, "الرؤية")
    body(story, s, EXECUTIVE["vision"])

    h2(story, s, "المهمة")
    body(story, s, EXECUTIVE["mission"])

    h2(story, s, "إحصائيات المنصة")
    make_table(story, s,
        ["المقياس", "القيمة", "الوصف"],
        [
            ["الصفحات", str(STATS['pages']), "مكونات صفحات Next.js"],
            ["نقاط API", str(STATS['apis']), "نهايات RESTful API"],
            ["نماذج قاعدة البيانات", str(STATS['models']), "نماذج Prisma ORM"],
            ["المكونات", str(STATS['components']), "مكونات React قابلة لإعادة الاستخدام"],
            ["أسطر الكود", f"{STATS['loc']:,}", "كود TypeScript"],
            ["العلاقات", str(STATS['rels']), "علاقات قاعدة البيانات"],
        ],
        [120, 80, 260]
    )

    h2(story, s, "الميزات الرئيسية")
    features = [
        "سوق سيارات شامل مع فلاتر بحث متقدمة",
        "نظام مزادات حية للسيارات",
        "سوق للقطع المستعملة واللوحات المخصصة",
        "دليل ورش العمل مع نظام مواعيد",
        "منتدى تفاعلي لمشاركة المعرفة",
        "10 أدوات ذكاء اصطناعي متقدمة",
        "نظام تذاكر دعم فني",
        "لوحة تحكم إدارية شاملة (33 صفحة)",
        "نظام إشعارات ومحادثات فورية",
        "دعم كامل للعربية مع RTL",
    ]
    for f in features:
        bullet(story, s, f)
    story.append(PageBreak())


# ===================== Section 2: Tech Infrastructure =====================

def build_section2(story, s):
    from ar_data1 import TECH_STACK, ARCHITECTURE
    h1(story, s, "2. البنية التحتية التقنية")

    h2(story, s, "المكونات التقنية")
    make_table(story, s,
        ["المكون", "التفاصيل"],
        [[name, desc] for name, desc in TECH_STACK],
        [120, 340]
    )

    h2(story, s, "طبقات النظام")
    for layer, desc in ARCHITECTURE["layers"]:
        h3(story, s, layer)
        body(story, s, desc)

    h2(story, s, "النمط المعماري")
    for p in ARCHITECTURE["patterns"]:
        bullet(story, s, p)
    story.append(PageBreak())


# ===================== Section 3: Database =====================

def build_section3(story, s):
    from ar_data1 import DB_TITLE, DB_DESC, DB_MODELS, RELATIONSHIPS
    h1(story, s, "3. بنية قاعدة البيانات")
    body(story, s, DB_DESC)

    for category, models in DB_MODELS.items():
        h2(story, s, category)
        rows = [[name, desc] for name, desc in models]
        make_table(story, s,
            ["النموذج", "الوصف"],
            rows,
            [130, 330]
        )

    h2(story, s, "العلاقات الرئيسية")
    for rel, desc in RELATIONSHIPS:
        bullet(story, s, f"{rel} - {desc}")
    story.append(PageBreak())


# ===================== Section 4: API =====================

def build_section4(story, s):
    from ar_data2 import API_TITLE, API_DESC, API_MODULES
    h1(story, s, "4. نقاط نهاية API")
    body(story, s, API_DESC)

    for module, data in API_MODULES.items():
        h2(story, s, module)
        body(story, s, data["desc"])
        for route in data["routes"]:
            bullet(story, s, route)
        story.append(Spacer(1, 4))
    story.append(PageBreak())


# ===================== Section 5: Pages =====================

def build_section5(story, s):
    from ar_data2 import PAGES_TITLE, PAGES_DESC, PAGE_CATEGORIES
    h1(story, s, "5. الصفحات والمسارات")
    body(story, s, PAGES_DESC)

    for category, pages in PAGE_CATEGORIES.items():
        h2(story, s, category)
        for page in pages:
            bullet(story, s, page)
    story.append(PageBreak())


# ===================== Section 6: Security =====================

def build_section6(story, s):
    from ar_data2 import SECURITY_TITLE, SECURITY_DESC, SECURITY_LAYERS
    h1(story, s, "6. بنية الأمان")
    body(story, s, SECURITY_DESC)

    for layer_name, items in SECURITY_LAYERS:
        h2(story, s, layer_name)
        for item in items:
            bullet(story, s, item)

    story.append(Spacer(1, 8))
    h2(story, s, "ملاحظات أمنية مهمة")
    notes = [
        "JWT tokens مخزنة في HttpOnly cookies (آمن) و localStorage (للمقارنة)",
        "Rate Limiting في الذاكرة فقط (غير موزع عبر المثيلات)",
        "DOMPurify ينظف جميع محتوى HTML المُنشأ من المستخدمين",
        "Prisma ORM يمنع SQL Injection عبر الاستعلامات المُعاملة",
        "مسارات الإدارة تتطلب دور USER + middleware إضافي",
        "كلمات المرور مشفرة بـ bcrypt مع 10 جولات",
    ]
    for n in notes:
        bullet(story, s, n)
    story.append(PageBreak())


# ===================== Section 7: AI =====================

def build_section7(story, s):
    from ar_data2 import AI_TITLE, AI_DESC, AI_FEATURES, AI_MODELS
    h1(story, s, "7. قدرات الذكاء الاصطناعي")
    body(story, s, AI_DESC)

    h2(story, s, "الميزات")
    make_table(story, s,
        ["الميزة", "الوصف"],
        [[feat, desc] for feat, desc in AI_FEATURES],
        [140, 320]
    )

    h2(story, s, "النماذج المدعومة")
    make_table(story, s,
        ["النموذج", "الوصف", "المعرّف"],
        [[name, desc, mid] for name, desc, mid in AI_MODELS],
        [130, 200, 130]
    )
    story.append(PageBreak())


# ===================== Section 8: UI =====================

def build_section8(story, s):
    from ar_data2 import UI_TITLE, UI_DESC, DESIGN_SYSTEM
    h1(story, s, "8. تصميم واجهة المستخدم")
    body(story, s, UI_DESC)

    for category, items in DESIGN_SYSTEM:
        h2(story, s, category)
        for item in items:
            bullet(story, s, item)
    story.append(PageBreak())


# ===================== Section 9: Market =====================

def build_section9(story, s):
    from ar_data2 import MARKET_TITLE, MARKET_DESC, MARKET_INSIGHTS, COMPETITORS
    h1(story, s, "9. تحليل السوق الأردني")
    body(story, s, MARKET_DESC)

    h2(story, s, "نظرة عامة على السوق")
    for insight in MARKET_INSIGHTS:
        bullet(story, s, insight)

    h2(story, s, "المنافسون")
    make_table(story, s,
        ["المنافس", "الوصف", "الحضور"],
        [[name, desc, pres] for name, desc, pres in COMPETITORS],
        [100, 250, 80]
    )

    h2(story, s, "تمييز JO Cars")
    diffs = [
        "أدوات ذكاء اصطناعي لا يوفرها المنافسون",
        "سوق ورش العمل مع نظام مواعيد",
        "منتدى تفاعلي لمشاركة المعرفة",
        "تصميم عربي أولاً مع تجربة مستخدم عصرية",
        "نظام مزادات حية للسيارات",
        "حاسبة جمارك أردنية متكاملة",
    ]
    for d in diffs:
        bullet(story, s, d)
    story.append(PageBreak())


# ===================== Section 10: Social Impact =====================

def build_section10(story, s):
    from ar_data2 import SOCIAL_TITLE, SOCIAL_IMPACT
    h1(story, s, "10. التأثير الاجتماعي")

    h2(story, s, "التأثيرات الإيجابية")
    for impact in SOCIAL_IMPACT:
        bullet(story, s, impact)

    h2(story, s, "التأثير الاقتصادي")
    econ = [
        "سوق رقمي يقلل الاعتماد على المعارض الفعلية",
        "رقمنة الورش تزيد من إمكانية الوصول للخدمات",
        "الشفافية في الأسعار تقلل عدم التوازن في المعلومات",
        "أدوات الذكاء الاصطناعي تعمم الخبرة automotive",
    ]
    for e in econ:
        bullet(story, s, e)
    story.append(PageBreak())


# ===================== Section 11: SWOT =====================

def build_section11(story, s):
    from ar_data2 import SWOT_TITLE, SWOT
    h1(story, s, "11. تحليل SWOT")

    for category, items in SWOT.items():
        h2(story, s, category)
        for item in items:
            bullet(story, s, item)
    story.append(PageBreak())


# ===================== Section 12: Performance =====================

def build_section12(story, s):
    from ar_data2 import PERF_TITLE, PERFORMANCE
    h1(story, s, "12. الأداء والتحسين")

    make_table(story, s,
        ["المقياس", "التفاصيل"],
        [[metric, detail] for metric, detail in PERFORMANCE],
        [130, 330]
    )
    story.append(PageBreak())


# ===================== Section 13: Roadmap =====================

def build_section13(story, s):
    from ar_data2 import ROADMAP_TITLE, ROADMAP
    h1(story, s, "13. خارطة الطريق المستقبلية")

    for phase, items in ROADMAP:
        h2(story, s, phase)
        for item in items:
            bullet(story, s, item)


# ===================== Section 14: API Detail =====================

def build_section14(story, s):
    from ar_data3 import API_DETAIL_TITLE, API_DETAIL_SECTIONS
    h1(story, s, "14. تفصيل تطبيقات واجهة البرمجة API")

    for section_name, section_data in API_DETAIL_SECTIONS.items():
        h2(story, s, section_name)
        body(story, s, section_data["intro"])

        for route in section_data["routes"]:
            h3(story, s, route["name"])
            body(story, s, route["description"])

            if "lines" in route:
                bullet(story, s, f"عدد الأسطر: {route['lines']}")
            if "auth" in route:
                bullet(story, s, f"المصادقة: {route['auth']}")

            if "details" in route:
                for detail in route["details"]:
                    if isinstance(detail, str):
                        bullet(story, s, detail)

            if "error_handling" in route:
                bullet(story, s, f"معالجة الأخطاء: {route['error_handling']}")

        story.append(Spacer(1, 6))

    story.append(PageBreak())


# ===================== Section 15: DB Detail =====================

def build_section15(story, s):
    from ar_data3 import DB_DETAIL_TITLE, DB_DETAIL_DESC, DB_MODEL_DETAILS
    h1(story, s, "15. تفصيل نماذج قاعدة البيانات")
    body(story, s, DB_DETAIL_DESC)

    for model_name, model_data in DB_MODEL_DETAILS.items():
        h2(story, s, model_name)
        body(story, s, model_data["desc"])

        # Fields table
        if "fields" in model_data:
            make_table(story, s,
                ["الحقل", "النوع", "السمات", "الوصف"],
                [[f, t, a, d] for f, t, a, d in model_data["fields"]],
                [80, 60, 120, 160]
            )

        if "fields_auction" in model_data:
            h3(story, s, "نموذج المزاد")
            make_table(story, s,
                ["الحقل", "النوع", "السمات", "الوصف"],
                [[f, t, a, d] for f, t, a, d in model_data["fields_auction"]],
                [80, 60, 120, 160]
            )

        if "fields_bid" in model_data:
            h3(story, s, "نموذج العرض")
            make_table(story, s,
                ["الحقل", "النوع", "السمات", "الوصف"],
                [[f, t, a, d] for f, t, a, d in model_data["fields_bid"]],
                [80, 60, 120, 160]
            )

        if "fields_topic" in model_data:
            h3(story, s, "نموذج الموضوع")
            make_table(story, s,
                ["الحقل", "النوع", "السمات", "الوصف"],
                [[f, t, a, d] for f, t, a, d in model_data["fields_topic"]],
                [80, 60, 120, 160]
            )

        if "fields_post" in model_data:
            h3(story, s, "نموذج المنشور")
            make_table(story, s,
                ["الحقل", "النوع", "السمات", "الوصف"],
                [[f, t, a, d] for f, t, a, d in model_data["fields_post"]],
                [80, 60, 120, 160]
            )

        if "fields_recording" in model_data:
            h3(story, s, "نموذج التسجيل الصوتي")
            make_table(story, s,
                ["الحقل", "النوع", "السمات", "الوصف"],
                [[f, t, a, d] for f, t, a, d in model_data["fields_recording"]],
                [80, 60, 120, 160]
            )

        if "fields_analysis" in model_data:
            h3(story, s, "نموذج التحليل")
            make_table(story, s,
                ["الحقل", "النوع", "السمات", "الوصف"],
                [[f, t, a, d] for f, t, a, d in model_data["fields_analysis"]],
                [80, 60, 120, 160]
            )

        if "relations" in model_data:
            h3(story, s, "العلاقات")
            for rel in model_data["relations"]:
                bullet(story, s, rel)

        story.append(Spacer(1, 4))

    story.append(PageBreak())


# ===================== Section 16: React Components =====================

def build_section16(story, s):
    from ar_data3 import COMPONENTS_TITLE, COMPONENTS_DESC, COMPONENT_DETAILS
    h1(story, s, "16. تفصيل المكونات React")
    body(story, s, COMPONENTS_DESC)

    for comp in COMPONENT_DETAILS:
        h2(story, s, comp["name"])
        bullet(story, s, f"الملف: {comp['file']}")
        bullet(story, s, comp["desc"])
        for feat in comp["features"]:
            bullet(story, s, feat)
        story.append(Spacer(1, 4))

    story.append(PageBreak())


# ===================== Section 17: Library Files =====================

def build_section17(story, s):
    from ar_data3 import LIB_TITLE, LIB_DESC, LIB_DETAILS
    h1(story, s, "17. تفصيل ملفات المكتبة والأدوات المساعدة")
    body(story, s, LIB_DESC)

    for lib in LIB_DETAILS:
        h2(story, s, lib["name"])
        bullet(story, s, f"عدد الأسطر: {lib['lines']}")
        bullet(story, s, lib["desc"])
        for feat in lib["features"]:
            bullet(story, s, feat)
        story.append(Spacer(1, 4))

    story.append(PageBreak())


# ===================== Section 18: Hooks =====================

def build_section18(story, s):
    from ar_data3 import HOOKS_TITLE, HOOKS_DESC, HOOK_DETAILS
    h1(story, s, "18. تفصيل Hooks وإدارة الحالة")
    body(story, s, HOOKS_DESC)

    for hook in HOOK_DETAILS:
        h2(story, s, hook["name"])
        bullet(story, s, f"الملف: {hook['file']}")
        bullet(story, s, hook["desc"])
        for feat in hook["features"]:
            bullet(story, s, feat)
        story.append(Spacer(1, 4))

    story.append(PageBreak())


# ===================== Section 19: Middleware =====================

def build_section19(story, s):
    from ar_data3 import MIDDLEWARE_TITLE, MIDDLEWARE_DESC, MIDDLEWARE_DETAILS
    h1(story, s, "19. تفصيل Middleware وطبقة الأمان")
    body(story, s, MIDDLEWARE_DESC)

    for mw in MIDDLEWARE_DETAILS:
        h2(story, s, mw["name"])
        body(story, s, mw["desc"])
        for detail in mw["details"]:
            bullet(story, s, detail)
        story.append(Spacer(1, 4))

    story.append(PageBreak())


# ===================== Section 20: Config Files =====================

def build_section20(story, s):
    from ar_data3 import CONFIG_TITLE, CONFIG_DESC, CONFIG_DETAILS
    h1(story, s, "20. تفصيل ملفات الإعدادات والبنية التحتية")
    body(story, s, CONFIG_DESC)

    for cfg in CONFIG_DETAILS:
        h2(story, s, cfg["name"])
        bullet(story, s, f"عدد الأسطر: {cfg['lines']}")
        bullet(story, s, cfg["desc"])
        for detail in cfg["details"]:
            bullet(story, s, detail)
        story.append(Spacer(1, 4))

    story.append(PageBreak())


# ===================== Section 21: Intent Detection =====================

def build_section21(story, s):
    from ar_data3 import INTENT_TITLE, INTENT_DESC, INTENT_TABLE, INTENT_PATTERNS_TABLE
    h1(story, s, "21. نظام كشف النوايا باللغة العربية")
    body(story, s, INTENT_DESC)

    h2(story, s, "النوايا المدعومة")
    make_table(story, s,
        ["النية", "المعرّف", "الأيقونة", "الوصف", "أمثلة"],
        [list(row) for row in INTENT_TABLE],
        [65, 65, 50, 80, 180]
    )

    h2(story, s, "أنماط كشف النية")
    make_table(story, s,
        ["النية", "النمط 1", "النمط 2", "النمط 3", "النمط 4", "النمط 5", "النمط 6", "النمط 7"],
        [list(row) for row in INTENT_PATTERNS_TABLE],
        [60, 50, 50, 50, 50, 50, 50, 50]
    )

    story.append(PageBreak())


# ===================== Section 22: Stateless Flow =====================

def build_section22(story, s):
    from ar_data3 import STATELESS_TITLE, STATELESS_DESC, STATELESS_FLOW, STATELESS_AUTH_FLOW
    h1(story, s, "22. نظام التدفق Stateless لإنشاء السيارة")
    body(story, s, STATELESS_DESC)

    h2(story, s, "تدفق إنشاء السيارة")
    for step in STATELESS_FLOW:
        h3(story, s, step["step"])
        bullet(story, s, f"العميل: {step['client']}")
        bullet(story, s, f"الخادم: {step['server']}")
        bullet(story, s, f"الاستجابة: {step['response']}")
        story.append(Spacer(1, 4))

    h2(story, s, "تدفق المصادقة المتسلسل")
    for step in STATELESS_AUTH_FLOW:
        bullet(story, s, step)

    story.append(PageBreak())


# ===================== Section 23: Image Upload =====================

def build_section23(story, s):
    from ar_data3 import IMAGE_TITLE, IMAGE_DESC, IMAGE_FLOW
    h1(story, s, "23. نظام رفع الصور وسير العمل")
    body(story, s, IMAGE_DESC)

    h2(story, s, "خطوات رفع الصور")
    for step in IMAGE_FLOW:
        h3(story, s, step["step"])
        body(story, s, step["desc"])
        story.append(Spacer(1, 4))

    story.append(PageBreak())


# ===================== Section 24: Notifications =====================

def build_section24(story, s):
    from ar_data3 import NOTIFICATION_TITLE, NOTIFICATION_DESC, NOTIFICATION_TYPES
    h1(story, s, "24. نظام الإشعارات والتنبيهات")
    body(story, s, NOTIFICATION_DESC)

    h2(story, s, "أنواع الإشعارات")
    make_table(story, s,
        ["النوع", "الوصف", "الوحدة", "القناة"],
        [list(row) for row in NOTIFICATION_TYPES],
        [80, 140, 80, 120]
    )

    story.append(PageBreak())


# ===================== Section 25: Auth Flow =====================

def build_section25(story, s):
    from ar_data3 import AUTH_FLOW_TITLE, AUTH_FLOW_STEPS
    h1(story, s, "25. تدفق المصادقة الكامل خطوة بخطوة")

    for flow_name, steps in AUTH_FLOW_STEPS:
        h2(story, s, flow_name)
        for step in steps:
            bullet(story, s, step)
        story.append(Spacer(1, 4))

    story.append(PageBreak())


# ===================== Section 26: Stream Architecture =====================

def build_section26(story, s):
    from ar_data3 import STREAM_TITLE, STREAM_DESC, STREAM_EVENTS, STREAM_ARCHITECTURE, STREAM_CAR_FLOW
    h1(story, s, "26. بنية نظام المحادثة البث المباشر (SSE)")
    body(story, s, STREAM_DESC)

    h2(story, s, "أحداث البث")
    make_table(story, s,
        ["الحدث", "النوع", "الوصف"],
        [[e, t, d] for e, t, d in STREAM_EVENTS],
        [80, 120, 260]
    )

    h2(story, s, "بنية النظام")
    for step in STREAM_ARCHITECTURE:
        bullet(story, s, step)

    h2(story, s, "تدفق إنشاء السيارة عبر Chat")
    for step in STREAM_CAR_FLOW:
        bullet(story, s, step)

    story.append(PageBreak())


# ===================== Section 27: Code Quality =====================

def build_section27(story, s):
    from ar_data3 import CODE_ANALYSIS_TITLE, CODE_ANALYSIS
    h1(story, s, "27. تحليل جودة الكود والۂراعة البرمجية")

    for section in CODE_ANALYSIS:
        h2(story, s, section["name"])
        for item in section["items"]:
            bullet(story, s, item)
        story.append(Spacer(1, 4))

    story.append(PageBreak())


# ===================== Section 28: External Integrations =====================

def build_section28(story, s):
    from ar_data3 import INTEGRATIONS_TITLE, INTEGRATIONS
    h1(story, s, "28. التكاملات الخارجية والخدمات")

    for integration in INTEGRATIONS:
        h2(story, s, integration["name"])
        body(story, s, integration["desc"])
        for detail in integration["details"]:
            bullet(story, s, detail)
        story.append(Spacer(1, 4))

    story.append(PageBreak())


# ===================== Section 29: Roadmap Detail =====================

def build_section29(story, s):
    from ar_data3 import ROADMAP_DETAIL_TITLE, ROADMAP_DETAIL
    h1(story, s, "29. خارطة الطريق المستقبلية - تفصيل تنفيذي")

    for phase in ROADMAP_DETAIL:
        h2(story, s, phase["phase"])
        bullet(story, s, f"الجدول الزمني: {phase['timeline']}")
        bullet(story, s, f"الأولوية: {phase['priority']}")

        for item in phase["items"]:
            h3(story, s, item["name"])
            body(story, s, item["desc"])
            bullet(story, s, f"الوقت المقدر: {item['estimated_time']}")
            for impl in item["implementation"]:
                bullet(story, s, impl)
            story.append(Spacer(1, 4))

    story.append(PageBreak())


# ===================== Section 30: Performance Detail =====================

def build_section30(story, s):
    from ar_data3 import PERFORMANCE_TITLE, PERFORMANCE_SECTIONS
    h1(story, s, "30. تحليل الأداء والتحسينات")

    for section in PERFORMANCE_SECTIONS:
        h2(story, s, section["name"])
        for item in section["items"]:
            bullet(story, s, item)
        story.append(Spacer(1, 4))

    story.append(PageBreak())


# ===================== Section 31: Stats =====================

def build_section31(story, s):
    from ar_data3 import STATS_TITLE, STATS_SUMMARY
    h1(story, s, "31. إحصائيات تفصيلية للمنصة")

    h2(story, s, "ملخص الإحصائيات")
    make_table(story, s,
        ["المقياس", "القيمة"],
        [[k, v] for k, v in STATS_SUMMARY.items()],
        [200, 200]
    )
