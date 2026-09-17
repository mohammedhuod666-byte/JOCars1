import os

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip())

# 1. Remove Score HUD (Cinematic Mode)
write_file('objects/obj_gui/Draw_64.gml', '// نمط سينيمائي: إخفاء النقاط القديمة\n')

# Helper to create GM Object yy
def create_gm_obj(name, parent='Objects'):
    return '''{
  "$GMObject":"",
  "%Name":"''' + name + '''",
  "eventList":[
    {"$GMEvent":"v1","%Name":"","collisionObjectId":null,"eventNum":0,"eventType":0,"isDnD":false,"name":"","resourceType":"GMEvent","resourceVersion":"2.0",},
    {"$GMEvent":"v1","%Name":"","collisionObjectId":null,"eventNum":0,"eventType":3,"isDnD":false,"name":"","resourceType":"GMEvent","resourceVersion":"2.0",},
    {"$GMEvent":"v1","%Name":"","collisionObjectId":null,"eventNum":0,"eventType":8,"isDnD":false,"name":"","resourceType":"GMEvent","resourceVersion":"2.0",}
  ],
  "managed":true,
  "name":"''' + name + '''",
  "parent":{ "name":"'''+parent+'''", "path":"folders/'''+parent+'''.yy", },
  "parentObjectId":null,
  "persistent":false,
  "physicsObject":false,
  "properties":[],
  "resourceType":"GMObject",
  "resourceVersion":"2.0",
  "spriteId":null,
  "visible":true,
}'''

# 2. Companion System (obj_companion)
os.makedirs('objects/obj_companion', exist_ok=True)
write_file('objects/obj_companion/obj_companion.yy', create_gm_obj('obj_companion'))
write_file('objects/obj_companion/Create_0.gml', '''
// المرافق الآلي (Companion Drone)
cx = x;
cy = y;
target = Obj_player;
chat_index = 0;
chat_timer = 0;
active_chat = "";
is_talking = false;

// نصوص القصة التفاعلية
messages[0] = "مرحباً لوميك.. أنا المساعد المتبقي، سأرشدك.";
messages[1] = "احذر، هذا القطاع مليء بالمواد الإشعاعية السامة.";
messages[2] = "السجان القرمزي يبحث عنا، يجب أن نتحرك بصمت.";
messages[3] = "هل ترى هذه الأضواء؟ إنها بقايا مدينتنا القديمة...";

follow_speed = 0.05;
''')

write_file('objects/obj_companion/Step_0.gml', '''
// اللحاق باللاعب بمرونة (Smooth Follow)
if (instance_exists(target)) {
    var dest_x = target.x - 30 * sign(target.image_xscale);
    var dest_y = target.y - 40;
    
    x += (dest_x - x) * follow_speed;
    y += (dest_y - y) * follow_speed;
}

// نظام التحدث (Chat System)
if (chat_timer > 0) {
    chat_timer -= 1;
} else if (chat_index < array_length(messages)) {
    // التحدث كل فترة
    if (random(100) < 1) { // فرصة عشوائية لبدء الحديث
        active_chat = messages[chat_index];
        is_talking = true;
        chat_timer = 300; // 5 ثواني تقريباً
        chat_index += 1;
    }
} else {
    is_talking = false;
}

if (chat_timer <= 0) is_talking = false;
''')

write_file('objects/obj_companion/Draw_0.gml', '''
var time = current_time;
var hover = sin(time / 100) * 4;

// رسم المرافق (Drone)
var c_glow = make_color_rgb(0, 255, 200); // لون RGB
draw_set_color(c_white);
draw_circle(x, y + hover, 6, false);
draw_set_color(c_glow);
draw_circle(x, y + hover, 8, true);
draw_circle(x, y + hover, 12, true);

// رسم المحادثة (Cinematic Chat)
if (is_talking) {
    draw_set_halign(fa_center);
    draw_set_valign(fa_bottom);
    
    var bw = string_width(active_chat) + 20;
    var bh = string_height(active_chat) + 10;
    var bx = x;
    var by = y + hover - 15;
    
    draw_set_color(make_color_rgb(10, 20, 30));
    draw_set_alpha(0.8);
    draw_roundrect(bx - bw/2, by - bh, bx + bw/2, by, false);
    
    draw_set_color(c_glow);
    draw_set_alpha(1.0);
    draw_text(bx, by - 5, active_chat);
    
    // رد اللاعب تلقائياً أحياناً
    if (chat_timer > 100 and chat_timer < 250) {
        if (instance_exists(Obj_player)) {
            var px = Obj_player.x;
            var py = Obj_player.y - 40;
            draw_set_color(make_color_rgb(0, 150, 255));
            draw_text(px, py, "..."); // استماع أو رد صامت
        }
    }
}
draw_set_halign(fa_left);
draw_set_valign(fa_top);
''')

# 3. Holographic Lore Signs (obj_neon_sign)
os.makedirs('objects/obj_neon_sign', exist_ok=True)
write_file('objects/obj_neon_sign/obj_neon_sign.yy', create_gm_obj('obj_neon_sign'))
write_file('objects/obj_neon_sign/Create_0.gml', '''
text = "سجل النظام: القطاع المظلم. تسربت الطاقة، لا يوجد ناجون.";
activated = false;
glow = 0;
''')
write_file('objects/obj_neon_sign/Step_0.gml', '''
if (instance_exists(Obj_player)) {
    if (distance_to_object(Obj_player) < 80) {
        activated = true;
        glow = lerp(glow, 1, 0.1);
    } else {
        activated = false;
        glow = lerp(glow, 0, 0.1);
    }
}
''')
write_file('objects/obj_neon_sign/Draw_0.gml', '''
// جهاز عرض هولوجرام
draw_set_color(make_color_rgb(50, 50, 50));
draw_rectangle(x - 10, y, x + 10, y + 5, false);
draw_set_color(make_color_rgb(0, 255, 255)); // RGB Cyan
draw_line_width(x - 5, y, x + 5, y, 2);

if (glow > 0.05) {
    draw_set_alpha(glow * 0.5);
    draw_triangle_color(x - 5, y, x + 5, y, x, y - 40, c_aqua, c_aqua, c_black, false);
    draw_set_alpha(1.0);
    
    draw_set_halign(fa_center);
    draw_set_valign(fa_bottom);
    draw_set_alpha(glow);
    draw_set_color(c_aqua);
    draw_text(x, y - 50, text);
    draw_set_alpha(1.0);
    draw_set_halign(fa_left);
    draw_set_valign(fa_top);
}
''')

# 4. Parallax RGB 2.5D City Generator (obj_parallax_city)
os.makedirs('objects/obj_parallax_city', exist_ok=True)
write_file('objects/obj_parallax_city/obj_parallax_city.yy', create_gm_obj('obj_parallax_city'))
write_file('objects/obj_parallax_city/Create_0.gml', '''
depth = 1000; // في الخلفية تماماً
// توليد مباني وهمية
random_set_seed(12345);
b_count = 50;
for(var i=0; i<b_count; i++) {
    bx[i] = random_range(0, 5000); // امتداد العالم
    bh[i] = random_range(100, 600);
    bw[i] = random_range(50, 150);
    bcolor[i] = make_color_rgb(random(50), random(50), random_range(50, 150)); // ألوان نيون غامقة
    bdepth[i] = random_range(0.2, 0.8); // عمق 2.5D
}
''')
write_file('objects/obj_parallax_city/Step_0.gml', '')
write_file('objects/obj_parallax_city/Draw_0.gml', '''
var cam = view_camera[0];
var cx = camera_get_view_x(cam);
var cy = camera_get_view_y(cam);
var ch = camera_get_view_height(cam);

// رسم خلفية 2.5D مع بارالاكس
for(var i=0; i<b_count; i++) {
    var p_x = bx[i] - (cx * bdepth[i]); // تأثير البارالاكس (تتحرك أبطأ من الكاميرا)
    var p_y = (room_height) - bh[i] + (cy * bdepth[i] * 0.2);
    
    // رسم المبنى 
    draw_set_color(bcolor[i]);
    draw_rectangle(p_x, p_y, p_x + bw[i], room_height + 500, false);
    
    // رسم أضواء نيون على حواف المباني (RGB Vibe)
    draw_set_color(make_color_rgb(0, 255, 255));
    draw_set_alpha(0.3);
    draw_line_width(p_x, p_y, p_x, room_height + 500, 2);
    draw_set_alpha(1.0);
}
''')

# Update YYP
with open('Deadly jumping game_1_12.yyp', 'r', encoding='utf-8') as f:
    proj = f.read()

objects_to_add = ['obj_companion', 'obj_neon_sign', 'obj_parallax_city']
for obj in objects_to_add:
    if f'"{obj}"' not in proj:
        insert_str = f'    {{"id":{{"name":"{obj}","path":"objects/{obj}/{obj}.yy",}},}},\n'
        proj = proj.replace('    {"id":{"name":"obj_text_box","path":"objects/obj_text_box/obj_text_box.yy",},},\n', 
                            '    {"id":{"name":"obj_text_box","path":"objects/obj_text_box/obj_text_box.yy",},},\n' + insert_str)

write_file('Deadly jumping game_1_12.yyp', proj)
print("AAA Foundations generated.")
