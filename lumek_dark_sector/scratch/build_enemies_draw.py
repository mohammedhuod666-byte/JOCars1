import os

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip())

def inject_draw_event(yy_path):
    with open(yy_path, 'r', encoding='utf-8') as f:
        yy = f.read()
    if 'eventType":8' not in yy:
        insert_str = ',\n    {"$GMEvent":"v1","%Name":"","collisionObjectId":null,"eventNum":0,"eventType":8,"isDnD":false,"name":"","resourceType":"GMEvent","resourceVersion":"2.0",}'
        yy = yy.replace('{"$GMEvent":"v1","%Name":"","collisionObjectId":null,"eventNum":0,"eventType":0,"isDnD":false,"name":"","resourceType":"GMEvent","resourceVersion":"2.0",}', 
                        '{"$GMEvent":"v1","%Name":"","collisionObjectId":null,"eventNum":0,"eventType":0,"isDnD":false,"name":"","resourceType":"GMEvent","resourceVersion":"2.0",}' + insert_str)
        write_file(yy_path, yy)

enemy1_draw = """
// Spiky Wheel Animation for Enemy1
var cx = x;
var cy = y;
var rad = 12;

// Draw Shadow
draw_set_color(c_black);
draw_set_alpha(0.3);
draw_ellipse(cx - rad, cy + rad - 4, cx + rad, cy + rad + 4, false);
draw_set_alpha(1.0);

// Rotate based on x position to simulate rolling
var angle = -x * 3; 

// Draw Body
draw_set_color(make_color_rgb(100, 100, 100)); // Iron
draw_circle(cx, cy, rad, false);

// Draw Spikes
draw_set_color(c_red);
for (var i = 0; i < 360; i += 45) {
    var a = degtorad(angle + i);
    var sx = cx + cos(a) * rad;
    var sy = cy + sin(a) * rad;
    var sx2 = cx + cos(a) * (rad + 6);
    var sy2 = cy + sin(a) * (rad + 6);
    draw_line_width(sx, sy, sx2, sy2, 3);
}

// Inner glowing core
draw_set_color(c_orange);
draw_circle(cx, cy, 5, false);
draw_set_color(c_yellow);
draw_circle(cx, cy, 2, false);
"""

enemy2_draw = """
// Jelly Monster Animation for Enemy2
var cx = x;
var cy = y;

var time = current_time;
var pulse = sin(time / 150) * 4;
var w = 15 + pulse;
var h = 15 - pulse;

if (state == enenmy2_rest_state) {
    w = 15 + sin(time / 50) * 6; // Angry pulsing
    h = 15 - sin(time / 50) * 6;
}

// Draw Shadow
draw_set_color(c_black);
draw_set_alpha(0.3);
draw_ellipse(cx - 15, cy + 12, cx + 15, cy + 18, false);
draw_set_alpha(1.0);

// Draw Jelly Body
draw_set_color(make_color_rgb(0, 255, 100)); // Toxic green
draw_ellipse(cx - w, cy - h, cx + w, cy + 15, false);
draw_set_color(make_color_rgb(0, 150, 50));
draw_ellipse(cx - w + 4, cy - h + 4, cx + w - 4, cy + 15 - 2, false);

// Draw Eyes
var ex = cx + sign(image_xscale) * 5;
draw_set_color(c_white);
draw_circle(ex - 4, cy - 2, 3, false);
draw_circle(ex + 4, cy - 2, 3, false);
draw_set_color(c_black);
draw_circle(ex - 4 + sign(image_xscale), cy - 2, 1, false);
draw_circle(ex + 4 + sign(image_xscale), cy - 2, 1, false);
"""

write_file('objects/Obj_enemy1/Draw_0.gml', enemy1_draw)
write_file('objects/obj_enemy2/Draw_0.gml', enemy2_draw)

inject_draw_event('objects/Obj_enemy1/Obj_enemy1.yy')
inject_draw_event('objects/obj_enemy2/obj_enemy2.yy')

print("Enemy 1 and 2 graphics updated.")
