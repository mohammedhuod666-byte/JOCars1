"""
JO Cars — Comprehensive Arabic Documentation PDF Builder
Generates the full user manual from markdown chapter files.
"""
import os
import re
import glob
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable, ListFlowable, ListItem,
    Preformatted, Image as RLImage
)
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.units import cm, mm
from reportlab.lib.enums import TA_RIGHT, TA_LEFT, TA_CENTER
import arabic_reshaper
from bidi.algorithm import get_display

# ── Fonts ──────────────────────────────────────────────────────────────────
FONT_PATH = "C:/Windows/Fonts/arial.ttf"
FONT_BOLD_PATH = "C:/Windows/Fonts/arialbd.ttf"
FONT_MONO_PATH = "C:/Windows/Fonts/consola.ttf"

pdfmetrics.registerFont(TTFont('Arabic', FONT_PATH))
pdfmetrics.registerFont(TTFont('Arabic-Bold', FONT_BOLD_PATH))
pdfmetrics.registerFont(TTFont('Arabic-Mono', FONT_MONO_PATH))

# ── Arabic text reshaping ──────────────────────────────────────────────────
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

def ar_clean(text):
    """Arabic text without newlines (for table cells)."""
    return ar(text).replace("\n", " ")

def ar_html(text):
    """Apply Arabic reshaping to text content only, preserving HTML tags."""
    # Split by HTML tags, only reshape non-tag parts
    parts = re.split(r'(<[^>]+>)', text)
    result = []
    for part in parts:
        if part.startswith('<') and part.endswith('>'):
            result.append(part)
        else:
            result.append(ar(part))
    return ''.join(result)

# ── Colors ─────────────────────────────────────────────────────────────────
EMERALD = colors.HexColor("#059669")
DARK_EMERALD = colors.HexColor("#047857")
ACCENT_BLUE = colors.HexColor("#0284c7")
DARK_BLUE = colors.HexColor("#0369a1")
TEXT_DARK = colors.HexColor("#0f172a")
TEXT_MED = colors.HexColor("#334155")
TEXT_LIGHT = colors.HexColor("#64748b")
BG_LIGHT = colors.HexColor("#f8fafc")
BG_TABLE_HEADER = colors.HexColor("#e2e8f0")
BG_TABLE_ALT = colors.HexColor("#f1f5f9")
BORDER_LIGHT = colors.HexColor("#cbd5e1")
CODE_BG = colors.HexColor("#1e293b")
CODE_TEXT = colors.HexColor("#e2e8f0")
WARN_BG = colors.HexColor("#fef3c7")
WARN_BORDER = colors.HexColor("#f59e0b")

# ── Styles ─────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

sCoverTitle = ParagraphStyle('CoverTitle', parent=styles['Normal'],
    fontName='Arabic-Bold', fontSize=28, leading=40, alignment=TA_CENTER,
    textColor=DARK_EMERALD)
sCoverSub = ParagraphStyle('CoverSub', parent=styles['Normal'],
    fontName='Arabic', fontSize=14, leading=22, alignment=TA_CENTER,
    textColor=TEXT_MED)
sH1 = ParagraphStyle('H1', parent=styles['Normal'],
    fontName='Arabic-Bold', fontSize=20, leading=30, alignment=TA_RIGHT,
    textColor=DARK_EMERALD, spaceAfter=12, spaceBefore=6)
sH2 = ParagraphStyle('H2', parent=styles['Normal'],
    fontName='Arabic-Bold', fontSize=15, leading=24, alignment=TA_RIGHT,
    textColor=DARK_BLUE, spaceAfter=8, spaceBefore=10)
sH3 = ParagraphStyle('H3', parent=styles['Normal'],
    fontName='Arabic-Bold', fontSize=12, leading=20, alignment=TA_RIGHT,
    textColor=TEXT_DARK, spaceAfter=6, spaceBefore=8)
sH4 = ParagraphStyle('H4', parent=styles['Normal'],
    fontName='Arabic-Bold', fontSize=10.5, leading=18, alignment=TA_RIGHT,
    textColor=TEXT_MED, spaceAfter=4, spaceBefore=6)
sBody = ParagraphStyle('Body', parent=styles['Normal'],
    fontName='Arabic', fontSize=9.5, leading=16, alignment=TA_RIGHT,
    textColor=TEXT_DARK, spaceAfter=4)
sBodyBold = ParagraphStyle('BodyBold', parent=sBody, fontName='Arabic-Bold')
sBullet = ParagraphStyle('Bullet', parent=sBody,
    leftIndent=0, rightIndent=18, bulletIndent=0, spaceAfter=2)
sBullet2 = ParagraphStyle('Bullet2', parent=sBody,
    leftIndent=0, rightIndent=36, bulletIndent=0, spaceAfter=1)
sCode = ParagraphStyle('Code', parent=styles['Normal'],
    fontName='Arabic-Mono', fontSize=7.5, leading=11, alignment=TA_LEFT,
    textColor=CODE_TEXT, spaceAfter=0, spaceBefore=0)
sWarn = ParagraphStyle('Warn', parent=sBody,
    fontName='Arabic', fontSize=9, leading=15, alignment=TA_RIGHT,
    textColor=colors.HexColor("#92400e"), backColor=WARN_BG,
    borderColor=WARN_BORDER, borderWidth=0.5, borderPadding=6,
    spaceAfter=6, spaceBefore=4)
sTableCell = ParagraphStyle('TableCell', parent=styles['Normal'],
    fontName='Arabic', fontSize=8, leading=12, alignment=TA_RIGHT,
    textColor=TEXT_DARK)
sTableHeader = ParagraphStyle('TableHeader', parent=sTableCell,
    fontName='Arabic-Bold', textColor=colors.white)
sTOCTitle = ParagraphStyle('TOCTitle', parent=styles['Normal'],
    fontName='Arabic-Bold', fontSize=16, leading=26, alignment=TA_CENTER,
    textColor=DARK_EMERALD, spaceAfter=16)
sTOCItem = ParagraphStyle('TOCItem', parent=styles['Normal'],
    fontName='Arabic', fontSize=10, leading=18, alignment=TA_RIGHT,
    textColor=TEXT_DARK, spaceAfter=2)
sTOCSub = ParagraphStyle('TOCSub', parent=sTOCItem,
    fontSize=9, textColor=TEXT_LIGHT, rightIndent=14)

# ── Numbered canvas with header/footer ─────────────────────────────────────
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved = []

    def showPage(self):
        self._saved.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total = len(self._saved)
        for state in self._saved:
            self.__dict__.update(state)
            self._decorate(total)
            super().showPage()
        super().save()

    def _decorate(self, total):
        if self._pageNumber == 1:
            return
        self.saveState()
        # Header
        self.setFont("Arabic", 8)
        self.setFillColor(TEXT_LIGHT)
        self.setStrokeColor(BORDER_LIGHT)
        self.setLineWidth(0.5)
        self.line(40, A4[1] - 35, A4[0] - 40, A4[1] - 35)
        hdr = ar("دليل الاستخدام الشامل — منصة JO Cars")
        self.drawRightString(A4[0] - 40, A4[1] - 28, hdr)
        # Footer
        self.line(40, 40, A4[0] - 40, 40)
        ftr = ar(f"صفحة {self._pageNumber} من {total}")
        self.drawString(40, 28, ftr)
        self.drawRightString(A4[0] - 40, 28, ar("JO Cars — جميع الحقوق محفوظة 2026"))
        self.restoreState()

# ── Markdown parser ────────────────────────────────────────────────────────
def parse_md_table(lines, start_idx):
    """Parse a GitHub-style markdown table starting at start_idx.
    Returns (headers, rows, end_idx)."""
    headers = [c.strip() for c in lines[start_idx].strip('|').split('|')]
    end = start_idx + 2  # skip separator
    rows = []
    while end < len(lines) and lines[end].strip().startswith('|'):
        cells = [c.strip() for c in lines[end].strip('|').split('|')]
        rows.append(cells)
        end += 1
    return headers, rows, end

def make_table_flowable(headers, rows):
    """Create a reportlab Table from parsed markdown table data."""
    ncols = len(headers)
    col_width = (A4[0] - 80) / ncols

    data = [[Paragraph(ar_clean(h), sTableHeader) for h in headers]]
    for row in rows:
        # Pad or truncate to match header count
        while len(row) < ncols:
            row.append("")
        data.append([Paragraph(ar_clean(c), sTableCell) for c in row[:ncols]])

    t = Table(data, colWidths=[col_width]*ncols, repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), DARK_BLUE),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Arabic-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 1), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 3),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style_cmds.append(('BACKGROUND', (0, i), (-1, i), BG_TABLE_ALT))
    t.setStyle(TableStyle(style_cmds))
    return t

def parse_md_to_flowables(md_text):
    """Convert markdown text to a list of reportlab flowables."""
    flowables = []
    lines = md_text.split('\n')
    i = 0
    in_code = False
    code_buf = []
    code_lang = ""

    while i < len(lines):
        line = lines[i]

        # Code fence
        if line.strip().startswith('```'):
            if not in_code:
                in_code = True
                code_lang = line.strip()[3:].strip()
                code_buf = []
                i += 1
                continue
            else:
                in_code = False
                code_text = '\n'.join(code_buf)
                # Truncate long code blocks
                code_lines = code_text.split('\n')
                if len(code_lines) > 24:
                    code_lines = code_lines[:24] + ['...']
                code_text = '\n'.join(code_lines)
                # Escape XML special chars for reportlab
                code_text = code_text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                # Arabic reshape for code comments
                code_text = ar(code_text)
                pf = Preformatted(code_text, sCode)
                # Wrap in a table-like container for background
                t = Table([[pf]], colWidths=[A4[0] - 80])
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, -1), CODE_BG),
                    ('LEFTPADDING', (0, 0), (-1, -1), 8),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                    ('TOPPADDING', (0, 0), (-1, -1), 6),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ]))
                flowables.append(Spacer(1, 4))
                flowables.append(t)
                flowables.append(Spacer(1, 6))
                i += 1
                continue

        if in_code:
            code_buf.append(line)
            i += 1
            continue

        # Page break marker
        if line.strip() == '[[PAGEBREAK]]':
            flowables.append(PageBreak())
            i += 1
            continue

        # Horizontal rule
        if line.strip() == '---':
            flowables.append(Spacer(1, 4))
            flowables.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_LIGHT))
            flowables.append(Spacer(1, 4))
            i += 1
            continue

        # Headings
        if line.startswith('#### '):
            flowables.append(Paragraph(ar(line[5:].strip()), sH4))
            i += 1
            continue
        if line.startswith('### '):
            flowables.append(Paragraph(ar(line[4:].strip()), sH3))
            i += 1
            continue
        if line.startswith('## '):
            flowables.append(Paragraph(ar(line[3:].strip()), sH2))
            i += 1
            continue
        if line.startswith('# '):
            flowables.append(Paragraph(ar(line[2:].strip()), sH1))
            i += 1
            continue

        # Blockquote / warning
        if line.startswith('> '):
            warn_text = ar(line[2:].strip())
            flowables.append(Paragraph(warn_text, sWarn))
            i += 1
            continue

        # Table
        if line.strip().startswith('|') and i + 1 < len(lines) and '---' in lines[i + 1]:
            headers, rows, end_idx = parse_md_table(lines, i)
            flowables.append(Spacer(1, 4))
            flowables.append(make_table_flowable(headers, rows))
            flowables.append(Spacer(1, 6))
            i = end_idx
            continue

        # Numbered list
        m = re.match(r'^(\d+)\.\s+(.+)', line)
        if m:
            num = m.group(1)
            text = m.group(2)
            # Handle bold prefix
            text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
            text = re.sub(r'`(.+?)`', r'<font face="Arabic-Mono" size="8">\1</font>', text)
            text = ar_html(text)
            flowables.append(Paragraph(f"{num}. {text}", sBullet))
            i += 1
            continue

        # Bullet list
        m = re.match(r'^\s*-\s+(.+)', line)
        if m:
            text = m.group(1)
            indent = len(line) - len(line.lstrip())
            text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
            text = re.sub(r'`(.+?)`', r'<font face="Arabic-Mono" size="8">\1</font>', text)
            text = ar_html(text)
            if indent >= 2:
                flowables.append(Paragraph(text, sBullet2, bulletText='◦'))
            else:
                flowables.append(Paragraph(text, sBullet, bulletText='•'))
            i += 1
            continue

        # Empty line
        if not line.strip():
            flowables.append(Spacer(1, 3))
            i += 1
            continue

        # Regular paragraph
        text = line.strip()
        text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
        text = re.sub(r'`(.+?)`', r'<font face="Arabic-Mono" size="8">\1</font>', text)
        text = ar_html(text)
        flowables.append(Paragraph(text, sBody))
        i += 1

    return flowables

# ── TOC generator ──────────────────────────────────────────────────────────
def generate_toc(md_files):
    """Generate table of contents from all markdown files."""
    toc_entries = []
    for fpath in md_files:
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        # Get chapter title (first # heading)
        for line in content.split('\n'):
            if line.startswith('# '):
                title = line[2:].strip()
                toc_entries.append(title)
                break
    return toc_entries

# ── Main builder ───────────────────────────────────────────────────────────
def build_pdf():
    docs_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scratch", "docs")
    md_files = sorted(glob.glob(os.path.join(docs_dir, "part_*.md")))

    if not md_files:
        print("ERROR: No markdown files found in scratch/docs/")
        return

    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                               "JO_Cars_User_Manual_AR.pdf")

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=40, rightMargin=40,
        topMargin=50, bottomMargin=50
    )

    story = []

    # ── Cover page ──────────────────────────────────────────────────────
    story.append(Spacer(1, 80))
    story.append(Paragraph(ar("منصة JO Cars"), sCoverTitle))
    story.append(Spacer(1, 12))
    story.append(Paragraph(ar("دليل الاستخدام الشامل"), ParagraphStyle(
        'CoverTitle2', parent=sCoverTitle, fontSize=22, leading=32,
        textColor=DARK_BLUE)))
    story.append(Spacer(1, 30))
    story.append(HRFlowable(width="60%", thickness=1.5, color=EMERALD,
                            hAlign='CENTER'))
    story.append(Spacer(1, 30))
    story.append(Paragraph(ar("تغطية شاملة: الصفحات • المميزات • لوحة المدير • لوحة التاجر • واجهات API • التقييم العادل"), sCoverSub))
    story.append(Spacer(1, 16))
    story.append(Paragraph(ar("الإصدار 1.0 — 2026"), sCoverSub))
    story.append(Spacer(1, 60))
    story.append(Paragraph(ar("https://jo-cars-marketplace.vercel.app/"), sCoverSub))
    story.append(PageBreak())

    # ── TOC page ────────────────────────────────────────────────────────
    story.append(Paragraph(ar("فهرس المحتويات"), sTOCTitle))
    story.append(Spacer(1, 10))
    toc_entries = generate_toc(md_files)
    for idx, title in enumerate(toc_entries, 1):
        story.append(Paragraph(ar(f"{idx}. {title}"), sTOCItem))
    story.append(PageBreak())

    # ── Chapters ────────────────────────────────────────────────────────
    for fpath in md_files:
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        flowables = parse_md_to_flowables(content)
        story.extend(flowables)
        story.append(PageBreak())

    # ── Build ───────────────────────────────────────────────────────────
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF generated: {output_path}")
    print(f"Total pages: {doc.page}")

if __name__ == "__main__":
    build_pdf()
