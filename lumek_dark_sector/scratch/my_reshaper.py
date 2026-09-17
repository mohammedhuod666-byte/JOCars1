import re

arabic_map = {
    'ا': ['\uFE8D', '\uFE8D', '\uFE8E', '\uFE8E'],
    'أ': ['\uFE83', '\uFE83', '\uFE84', '\uFE84'],
    'إ': ['\uFE87', '\uFE87', '\uFE88', '\uFE88'],
    'آ': ['\uFE81', '\uFE81', '\uFE82', '\uFE82'],
    'ب': ['\uFE8F', '\uFE91', '\uFE92', '\uFE90'],
    'ت': ['\uFE95', '\uFE97', '\uFE98', '\uFE96'],
    'ث': ['\uFE99', '\uFE9B', '\uFE9C', '\uFE9A'],
    'ج': ['\uFE9D', '\uFE9F', '\uFEA0', '\uFE9E'],
    'ح': ['\uFEA1', '\uFEA3', '\uFEA4', '\uFEA2'],
    'خ': ['\uFEA5', '\uFEA7', '\uFEA8', '\uFEA6'],
    'د': ['\uFEA9', '\uFEA9', '\uFEAA', '\uFEAA'],
    'ذ': ['\uFEAB', '\uFEAB', '\uFEAC', '\uFEAC'],
    'ر': ['\uFEAD', '\uFEAD', '\uFEAE', '\uFEAE'],
    'ز': ['\uFEAF', '\uFEAF', '\uFEB0', '\uFEB0'],
    'س': ['\uFEB1', '\uFEB3', '\uFEB4', '\uFEB2'],
    'ش': ['\uFEB5', '\uFEB7', '\uFEB8', '\uFEB6'],
    'ص': ['\uFEB9', '\uFEBB', '\uFEBC', '\uFEBA'],
    'ض': ['\uFEBD', '\uFEBF', '\uFEC0', '\uFEBE'],
    'ط': ['\uFEC1', '\uFEC3', '\uFEC4', '\uFEC2'],
    'ظ': ['\uFEC5', '\uFEC7', '\uFEC8', '\uFEC6'],
    'ع': ['\uFEC9', '\uFECB', '\uFECC', '\uFECA'],
    'غ': ['\uFECD', '\uFECF', '\uFED0', '\uFECE'],
    'ف': ['\uFED1', '\uFED3', '\uFED4', '\uFED2'],
    'ق': ['\uFED5', '\uFED7', '\uFED8', '\uFED6'],
    'ك': ['\uFED9', '\uFEDB', '\uFEDC', '\uFEDA'],
    'ل': ['\uFEDD', '\uFEDF', '\uFEE0', '\uFEDE'],
    'م': ['\uFEE1', '\uFEE3', '\uFEE4', '\uFEE2'],
    'ن': ['\uFEE5', '\uFEE7', '\uFEE8', '\uFEE6'],
    'ه': ['\uFEE9', '\uFEEB', '\uFEEC', '\uFEEA'],
    'و': ['\uFEED', '\uFEED', '\uFEEE', '\uFEEE'],
    'ي': ['\uFEF1', '\uFEF3', '\uFEF4', '\uFEF2'],
    'ى': ['\uFEEF', '\uFEEF', '\uFEF0', '\uFEF0'],
    'ة': ['\uFE93', '\uFE93', '\uFE94', '\uFE94'],
    'ؤ': ['\uFE85', '\uFE85', '\uFE86', '\uFE86'],
    'ئ': ['\uFE89', '\uFE8B', '\uFE8C', '\uFE8A'],
    'ل': ['\uFEDD', '\uFEDF', '\uFEE0', '\uFEDE'],
    'لا': ['\uFEFB', '\uFEFB', '\uFEFC', '\uFEFC'],
    'لأ': ['\uFEF7', '\uFEF7', '\uFEF8', '\uFEF8'],
    'لإ': ['\uFEF9', '\uFEF9', '\uFEFA', '\uFEFA'],
    'لآ': ['\uFEF5', '\uFEF5', '\uFEF6', '\uFEF6'],
}

right_connectors = ['ا', 'أ', 'إ', 'آ', 'د', 'ذ', 'ر', 'ز', 'و', 'ؤ', 'ة', 'ى']

def reshape_arabic(text):
    words = text.split(' ')
    reshaped_words = []
    
    for word in words:
        reshaped_word = ''
        for i, char in enumerate(word):
            if char not in arabic_map:
                reshaped_word += char
                continue
            
            connects_right = False
            connects_left = False
            
            if i > 0 and word[i-1] in arabic_map and word[i-1] not in right_connectors:
                connects_right = True
            
            if i < len(word)-1 and word[i+1] in arabic_map and char not in right_connectors:
                connects_left = True
                
            form_idx = 0 # isolated
            if connects_right and connects_left:
                form_idx = 2 # medial
            elif connects_right and not connects_left:
                form_idx = 3 # final
            elif not connects_right and connects_left:
                form_idx = 1 # initial
                
            reshaped_word += arabic_map[char][form_idx]
            
        # Fix Laam-Alef combinations
        reshaped_word = reshaped_word.replace('\uFEDF\uFE8E', '\uFEFC')
        reshaped_word = reshaped_word.replace('\uFEDD\uFE8D', '\uFEFB')
        reshaped_word = reshaped_word.replace('\uFEDF\uFE84', '\uFEF8')
        reshaped_word = reshaped_word.replace('\uFEDD\uFE83', '\uFEF7')
        
        reshaped_words.append(reshaped_word[::-1]) # reverse word
        
    return ' '.join(reshaped_words[::-1]) # reverse words

def convert_gml_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    def replacer(match):
        text = match.group(1)
        # only reshape if contains arabic
        if any(c in arabic_map for c in text):
            return '"' + reshape_arabic(text) + '"'
        return match.group(0)
        
    new_content = re.sub(r'"([^"]*[\u0600-\u06FF][^"]*)"', replacer, content)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)

print("Reshaping obj_companion and obj_neon_sign...")
convert_gml_file('objects/obj_companion/Create_0.gml')
convert_gml_file('objects/obj_neon_sign/Create_0.gml')
convert_gml_file('objects/obj_enemy3/Step_0.gml')
convert_gml_file('objects/obj_enemy3/Draw_0.gml')
convert_gml_file('objects/obj_building_door/Create_0.gml')
convert_gml_file('objects/obj_npc_scientist/Create_0.gml')
print("Done!")
