"""Arabic Report Generator - Complete 31 Sections"""
from reportlab.platypus import SimpleDocTemplate, Spacer
from ar_config import PAGE_W, M, BG_LIGHT, register_fonts, make_styles, ar
from ar_sections import (
    build_cover, build_toc,
    build_section1, build_section2, build_section3, build_section4,
    build_section5, build_section6, build_section7, build_section8,
    build_section9, build_section10, build_section11, build_section12,
    build_section13, build_section14, build_section15, build_section16,
    build_section17, build_section18, build_section19, build_section20,
    build_section21, build_section22, build_section23, build_section24,
    build_section25, build_section26, build_section27, build_section28,
    build_section29, build_section30, build_section31,
)

OUTPUT = "JO_Cars_Consulting_Report_AR.pdf"


def build():
    ar_f, arb_f = register_fonts()
    s = make_styles(ar_f, arb_f)

    doc = SimpleDocTemplate(OUTPUT, pagesize=(PAGE_W, 842),
        leftMargin=M, rightMargin=M, topMargin=M, bottomMargin=M)

    story = []
    story.append(Spacer(1, 1))

    # Cover & TOC
    build_cover(story, s)
    build_toc(story, s)

    # Sections 1-13 (main report)
    build_section1(story, s)
    build_section2(story, s)
    build_section3(story, s)
    build_section4(story, s)
    build_section5(story, s)
    build_section6(story, s)
    build_section7(story, s)
    build_section8(story, s)
    build_section9(story, s)
    build_section10(story, s)
    build_section11(story, s)
    build_section12(story, s)
    build_section13(story, s)

    # Sections 14-31 (deep-dive)
    build_section14(story, s)
    build_section15(story, s)
    build_section16(story, s)
    build_section17(story, s)
    build_section18(story, s)
    build_section19(story, s)
    build_section20(story, s)
    build_section21(story, s)
    build_section22(story, s)
    build_section23(story, s)
    build_section24(story, s)
    build_section25(story, s)
    build_section26(story, s)
    build_section27(story, s)
    build_section28(story, s)
    build_section29(story, s)
    build_section30(story, s)
    build_section31(story, s)

    doc.build(story)
    print(f"Generated: {OUTPUT}")


if __name__ == "__main__":
    build()
