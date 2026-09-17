import os

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

player_draw = """
// Procedural Player Animation (Squash, Stretch, Lean)
var cx = x;
var cy = y;
var w = 24;
var h = 32;

// Calculate squash and stretch based on velocity
var x_scale = 1.0;
var y_scale = 1.0;
var lean = 0;

if (!place_meeting(x, y + 1, Obj_wall)) {
    // In air: stretch vertically
    y_scale = 1.2;
    x_scale = 0.8;
} else if (abs(my_speed_x) > 0.5) {
    // Running: lean forward and slight squash
    lean = -10 * image_xscale;
    y_scale = 0.9 + sin(current_time / 100) * 0.1; // Bobbing effect
} else {
    // Idle: gentle breathing
    y_scale = 1.0 + sin(current_time / 200) * 0.05;
    x_scale = 1.0 - sin(current_time / 200) * 0.05;
}

if (in_dash) {
    x_scale = 1.5;
    y_scale = 0.5;
    lean = 0;
}

// Draw shadow
draw_set_color(c_black);
draw_set_alpha(0.3);
draw_ellipse(cx - w, cy - 4, cx + w, cy + 4, false);
draw_set_alpha(1.0);

// Draw body
var c1 = make_color_rgb(0, 200, 255); // Neon Blue
var c2 = make_color_rgb(0, 50, 150);
draw_primitive_begin(pr_trianglestrip);
draw_vertex_color(cx - (w/2)*x_scale + lean, cy - h*y_scale, c1, 1);
draw_vertex_color(cx + (w/2)*x_scale + lean, cy - h*y_scale, c2, 1);
draw_vertex_color(cx - (w/2)*x_scale, cy, c1, 1);
draw_vertex_color(cx + (w/2)*x_scale, cy, c2, 1);
draw_primitive_end();

// Draw eye (glows)
var eye_x = cx + (w/4)*image_xscale + (lean * 0.5);
var eye_y = cy - h*0.7 * y_scale;
draw_set_color(c_white);
draw_circle(eye_x, eye_y, 4, false);
draw_set_color(c_aqua);
draw_circle(eye_x, eye_y, 6, true);
"""

enemy_draw = """
// Procedural Enemy Animation (Floating, Breathing, Threatening)
var cx = x;
var cy = y;

// Hovering effect
var hover = sin(current_time / 150) * 5;
var draw_y = cy + hover;

var w = 30;
var h = 30;
var pulse = 1.0 + sin(current_time / 100) * 0.1;

if (state == "chase") {
    pulse = 1.2 + sin(current_time / 50) * 0.2; // Aggressive pulse
    w += 5;
}

// Draw shadow
draw_set_color(c_black);
draw_set_alpha(0.3);
draw_ellipse(cx - w, cy + h - 4, cx + w, cy + h + 4, false);
draw_set_alpha(1.0);

// Draw jagged beast shape
draw_set_color(c_red);
draw_triangle(cx, draw_y - h*pulse, cx - w*pulse, draw_y + h*0.5, cx + w*pulse, draw_y + h*0.5, false);

draw_set_color(c_maroon);
draw_triangle(cx, draw_y + h, cx - w*pulse*0.8, draw_y + h*0.3, cx + w*pulse*0.8, draw_y + h*0.3, false);

// Draw Evil Eye
var eye_x = cx + (image_xscale * 5);
var eye_y = draw_y - 5;
draw_set_color(c_yellow);
draw_circle(eye_x, eye_y, 6 * pulse, false);
draw_set_color(c_black);
draw_circle(eye_x, eye_y, 2, false);

// Draw Threat Message
if (message_timer > 0) {
    draw_set_halign(fa_center);
    draw_set_valign(fa_bottom);
    
    var text = "سوف اقتلك قريبا!";
    var bw = string_width(text) + 20;
    var bh = string_height(text) + 10;
    
    var bx = cx;
    var by = draw_y - h*pulse - 15;
    
    // Bubble background
    draw_set_alpha(0.8);
    draw_set_color(c_black);
    draw_roundrect(bx - bw/2, by - bh, bx + bw/2, by, false);
    draw_set_alpha(1.0);
    
    // Bubble text
    draw_set_color(c_red);
    draw_text(bx, by - 5, text);
    
    draw_set_halign(fa_left);
    draw_set_valign(fa_top);
}
"""

write_file('objects/Obj_player/Draw_0.gml', player_draw.strip())
write_file('objects/obj_enemy3/Draw_0.gml', enemy_draw.strip())

# Need to update Obj_player.yy to include eventNum:0, eventType:8 (Draw)
player_yy_path = 'objects/Obj_player/Obj_player.yy'
with open(player_yy_path, 'r', encoding='utf-8') as f:
    yy = f.read()

if '{"$GMEvent":"v1","%Name":"","collisionObjectId":null,"eventNum":0,"eventType":8,"isDnD":false,"name":"","resourceType":"GMEvent","resourceVersion":"2.0",}' not in yy:
    insert_str = ',\n    {"$GMEvent":"v1","%Name":"","collisionObjectId":null,"eventNum":0,"eventType":8,"isDnD":false,"name":"","resourceType":"GMEvent","resourceVersion":"2.0",}'
    yy = yy.replace('{"$GMEvent":"v1","%Name":"","collisionObjectId":null,"eventNum":4,"eventType":7,"isDnD":false,"name":"","resourceType":"GMEvent","resourceVersion":"2.0",}', 
                    '{"$GMEvent":"v1","%Name":"","collisionObjectId":null,"eventNum":4,"eventType":7,"isDnD":false,"name":"","resourceType":"GMEvent","resourceVersion":"2.0",}' + insert_str)
    write_file(player_yy_path, yy)

print("Procedural graphics applied to Player and Enemy.")
