import os

def insert_font_add(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We remove the old attempt if it exists
    content = content.replace('if (!variable_global_exists("font_arabic")) {', '')
    content = content.replace('global.font_arabic = font_add("Arial", 14, false, false, 32, 65535);', '')
    content = content.replace('}', '')
    content = content.replace('draw_set_font(global.font_arabic);', '')
    
    # Insert global font initialization at the start
    init_code = """
if (!variable_global_exists("font_arabic")) {
    global.font_arabic = font_add("Arial", 14, false, false, 32, 65535); 
}
draw_set_font(global.font_arabic);
    """
    
    # Safely insert before halign
    if 'draw_set_halign(' in content:
        content = content.replace('draw_set_halign(', init_code.strip() + '\\n    draw_set_halign(')
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

insert_font_add('objects/obj_companion/Draw_0.gml')
insert_font_add('objects/obj_neon_sign/Draw_0.gml')
insert_font_add('objects/obj_npc_scientist/Draw_0.gml')
insert_font_add('objects/obj_enemy3/Draw_0.gml')

# Also remove the hardcoded '...' to avoid confusion
with open('objects/obj_companion/Draw_0.gml', 'r', encoding='utf-8') as f:
    comp = f.read()
comp = comp.replace('draw_text(Obj_player.x, Obj_player.y - 40, "...");', '// removed dots')
with open('objects/obj_companion/Draw_0.gml', 'w', encoding='utf-8') as f:
    f.write(comp)

print('Added runtime font and removed dots.')
