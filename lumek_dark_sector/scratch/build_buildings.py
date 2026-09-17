import os
import json
import uuid

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip())

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
  "overriddenProperties":[],
  "parent":{ "name":"'''+parent+'''", "path":"folders/'''+parent+'''.yy" },
  "parentObjectId":null,
  "persistent":false,
  "physicsAngularDamping":0.1,
  "physicsDensity":0.5,
  "physicsFriction":0.2,
  "physicsGroup":1,
  "physicsKinematic":false,
  "physicsLinearDamping":0.1,
  "physicsObject":false,
  "physicsRestitution":0.1,
  "physicsSensor":false,
  "physicsShape":1,
  "physicsShapePoints":[],
  "physicsStartAwake":true,
  "properties":[],
  "resourceType":"GMObject",
  "resourceVersion":"2.0",
  "solid":false,
  "spriteId":null,
  "spriteMaskId":null,
  "visible":true,
}'''

# 1. Update obj_companion graphics
write_file('objects/obj_companion/Draw_0.gml', '''
var time = current_time;
var hover = sin(time / 100) * 4;

// Realistic Drone Graphics
var c_metal = make_color_rgb(150, 150, 160);
var c_dark = make_color_rgb(50, 50, 55);
var c_glow = make_color_rgb(0, 255, 255);

var dx = x;
var dy = y + hover;

// Propellers
draw_set_color(c_dark);
draw_ellipse(dx - 15, dy - 8, dx - 5, dy - 6, false);
draw_ellipse(dx + 5, dy - 8, dx + 15, dy - 6, false);
draw_set_color(c_white);
var prop_spin = sin(time) * 5;
draw_line(dx - 10 - prop_spin, dy - 7, dx - 10 + prop_spin, dy - 7);
draw_line(dx + 10 - prop_spin, dy - 7, dx + 10 + prop_spin, dy - 7);

// Drone Chassis
draw_set_color(c_metal);
draw_roundrect(dx - 8, dy - 5, dx + 8, dy + 5, false);

// Drone Eye Lens
draw_set_color(c_black);
draw_circle(dx + sign(Obj_player.x - dx)*2, dy, 3, false);
draw_set_color(c_glow);
draw_circle(dx + sign(Obj_player.x - dx)*2, dy, 1, false);

// Scanner Beam
if (is_talking) {
    draw_set_alpha(0.2);
    draw_triangle_color(dx, dy+2, dx-15, dy+30, dx+15, dy+30, c_glow, c_black, c_black, false);
    draw_set_alpha(1.0);
}

// Chat system
if (is_talking) {
    draw_set_halign(fa_center);
    draw_set_valign(fa_bottom);
    var bw = string_width(active_chat) + 20;
    var bh = string_height(active_chat) + 10;
    var bx = x;
    var by = dy - 15;
    
    draw_set_color(make_color_rgb(10, 20, 30));
    draw_set_alpha(0.8);
    draw_roundrect(bx - bw/2, by - bh, bx + bw/2, by, false);
    draw_set_color(c_glow);
    draw_set_alpha(1.0);
    draw_text(bx, by - 5, active_chat);
    
    if (chat_timer > 100 and chat_timer < 250) {
        if (instance_exists(Obj_player)) {
            draw_set_color(make_color_rgb(0, 150, 255));
            draw_text(Obj_player.x, Obj_player.y - 40, "...");
        }
    }
}
draw_set_halign(fa_left);
draw_set_valign(fa_top);
''')

# 2. Building Door (obj_building_door)
os.makedirs('objects/obj_building_door', exist_ok=True)
write_file('objects/obj_building_door/obj_building_door.yy', create_gm_obj('obj_building_door'))
write_file('objects/obj_building_door/Create_0.gml', 'target_room = "rm_building_1";\ntext="اضغط سهم لأعلى للدخول";')
write_file('objects/obj_building_door/Step_0.gml', '''
if (distance_to_object(Obj_player) < 30) {
    if (keyboard_check_pressed(vk_up)) {
        room_goto(asset_get_index(target_room));
    }
}
''')
write_file('objects/obj_building_door/Draw_0.gml', '''
// Draw a neon cyberpunk door
draw_set_color(make_color_rgb(20, 20, 20));
draw_rectangle(x-20, y-60, x+20, y, false);
draw_set_color(make_color_rgb(255, 0, 100)); // Neon Pink
draw_line_width(x-20, y-60, x+20, y-60, 2);
draw_line_width(x-20, y-60, x-20, y, 2);
draw_line_width(x+20, y-60, x+20, y, 2);

if (distance_to_object(Obj_player) < 30) {
    draw_set_halign(fa_center);
    draw_set_color(c_white);
    draw_text(x, y - 80, text);
    draw_set_halign(fa_left);
}
''')

# 3. NPC Scientist (obj_npc_scientist)
os.makedirs('objects/obj_npc_scientist', exist_ok=True)
write_file('objects/obj_npc_scientist/obj_npc_scientist.yy', create_gm_obj('obj_npc_scientist'))
write_file('objects/obj_npc_scientist/Create_0.gml', 'text="أنت لوميك! اعتقدنا أن سلالتك انقرضت! يجب أن تحرر المختبر من الوحوش.";')
write_file('objects/obj_npc_scientist/Step_0.gml', '')
write_file('objects/obj_npc_scientist/Draw_0.gml', '''
var time = current_time;
// Scientist drawing
var cx = x; var cy = y;
draw_set_color(c_white); // Lab coat
draw_roundrect(cx-8, cy-15, cx+8, cy+10, false);
draw_set_color(make_color_rgb(255, 200, 150)); // Head
draw_circle(cx, cy-25, 7, false);
draw_set_color(c_aqua); // Sci-fi goggles
draw_rectangle(cx-6, cy-27, cx+6, cy-23, false);

if (distance_to_object(Obj_player) < 60) {
    draw_set_halign(fa_center);
    draw_set_valign(fa_bottom);
    draw_set_color(make_color_rgb(10, 20, 30));
    draw_set_alpha(0.8);
    draw_roundrect(x-80, y-60, x+80, y-35, false);
    draw_set_color(c_white);
    draw_set_alpha(1.0);
    draw_text(x, y-40, text);
    draw_set_halign(fa_left);
    draw_set_valign(fa_top);
}
''')

# Update YYP
with open('Deadly jumping game_1_12.yyp', 'r', encoding='utf-8') as f:
    proj = f.read()

objects_to_add = ['obj_building_door', 'obj_npc_scientist']
for obj in objects_to_add:
    if f'"{obj}"' not in proj:
        insert_str = f'    {{"id":{{"name":"{obj}","path":"objects/{obj}/{obj}.yy",}},}},\n'
        proj = proj.replace('    {"id":{"name":"obj_text_box","path":"objects/obj_text_box/obj_text_box.yy",},},\n', 
                            '    {"id":{"name":"obj_text_box","path":"objects/obj_text_box/obj_text_box.yy",},},\n' + insert_str)
with open('Deadly jumping game_1_12.yyp', 'w', encoding='utf-8') as f:
    f.write(proj)

print("Buildings, doors, and NPCs generated.")
