import os

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip())

# 1. Fix obj_companion
write_file('objects/obj_companion/Create_0.gml', '''
cx = x;
cy = y;
target = Obj_player;
chat_index = 0;
chat_timer = 0;
active_chat = "";
is_talking = false;

messages[0] = "مرحباً لوميك.. أنا المساعد المتبقي، سأرشدك.";
messages[1] = "احذر، هذا القطاع مليء بالمواد الإشعاعية السامة.";
messages[2] = "السجان القرمزي يبحث عنا، يجب أن نتحرك بصمت.";
messages[3] = "هل ترى هذه الأضواء؟ إنها بقايا مدينتنا القديمة...";

follow_speed = 0.05;
''')

# 2. Fix obj_neon_sign
write_file('objects/obj_neon_sign/Create_0.gml', '''
text = "سجل النظام: القطاع المظلم. تسربت الطاقة، لا يوجد ناجون.";
activated = false;
glow = 0;
''')

# 3. Fix obj_building_door
write_file('objects/obj_building_door/Create_0.gml', '''
target_room = "rm_building_1";
text="اضغط سهم لأعلى للدخول";
''')

# 4. Fix obj_npc_scientist
write_file('objects/obj_npc_scientist/Create_0.gml', '''
text="أنت لوميك! اعتقدنا أن سلالتك انقرضت! يجب أن تحرر المختبر من الوحوش.";
''')

# 5. Fix Enemy3 texts
enemy3_draw = """
var cx = x;
var cy = y;

var time = current_time;
var pulse = sin(time / 100) * 2;
var is_chasing = (state == enenmy3_attack_state);

if (is_chasing) {
    pulse = sin(time / 40) * 4; // Faster pulse when angry
}

// Draw shadow
draw_set_color(c_black);
draw_set_alpha(0.3);
draw_ellipse(cx - 15, cy + 10, cx + 15, cy + 16, false);
draw_set_alpha(1.0);

// Floating effect
var float_y = cy - 10 + sin(time / 150) * 5;

// Draw body (sharp, jagged beast)
draw_set_color(c_red);
draw_triangle(cx, float_y - 20 - pulse, cx - 15 - pulse, float_y + 10, cx + 15 + pulse, float_y + 10, false);
draw_set_color(make_color_rgb(150, 0, 0));
draw_triangle(cx, float_y - 10, cx - 10, float_y + 10, cx + 10, float_y + 10, false);

// Draw glowing eye
var ex = cx + sign(image_xscale) * 4;
var ey = float_y - 5;
draw_set_color(c_yellow);
draw_circle(ex, ey, 4 + pulse/2, false);
draw_set_color(c_white);
draw_circle(ex + sign(image_xscale), ey - 1, 1, false);

// Draw Message Bubble
if (message_timer > 0) {
    draw_set_halign(fa_center);
    draw_set_valign(fa_bottom);
    var bx = cx;
    var by = float_y - 30;
    
    draw_set_color(c_white);
    draw_roundrect(bx - 40, by - 25, bx + 40, by, false);
    draw_set_color(c_black);
    draw_triangle(bx - 5, by, bx + 5, by, bx, by + 10, false);
    
    draw_set_color(c_red);
    draw_text(bx, by - 5, "سوف أقتلك قريباً!");
    
    draw_set_halign(fa_left);
    draw_set_valign(fa_top);
}
"""
write_file('objects/obj_enemy3/Draw_0.gml', enemy3_draw)

print('Restored uncorrupted GML files.')
