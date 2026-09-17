import os

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

create_code = """
state = "patrol";
range = 400; // Increased vision
spd = 3;
chase_spd = 7;
jump_speed = -12;
grav = 0.5;
vsp = 0;
image_blend = c_red;

// AI Variables
patrol_dir = 1;
patrol_timer = 0;
alert_timer = 0;
seen_player = false;
message_timer = 0; // For "I will kill you soon"
"""

step_code = """
var on_ground = place_meeting(x, y + 1, Obj_wall);
var hsp = 0;

if (state == "patrol") {
    spd = 3;
    hsp = spd * patrol_dir;
    
    // Turn around at walls or cliffs
    if (place_meeting(x + hsp, y, Obj_wall) or !place_meeting(x + hsp*15, y + 2, Obj_wall)) {
        patrol_dir *= -1;
        hsp = spd * patrol_dir;
    }
    
    // Look for player
    if (instance_exists(Obj_player)) {
        if (distance_to_object(Obj_player) < range and sign(Obj_player.x - x) == patrol_dir) {
            // Player in sight
            state = "alert";
            alert_timer = 45; // Stare for 45 frames
            message_timer = 180; // Show text for 3 seconds
        }
    }
}
else if (state == "alert") {
    hsp = 0;
    alert_timer -= 1;
    if (alert_timer <= 0) {
        state = "chase";
    }
}
else if (state == "chase") {
    if (instance_exists(Obj_player)) {
        var dir = sign(Obj_player.x - x);
        hsp = chase_spd * dir;
        
        // Smart jump: predict gaps or jump over walls
        if (place_meeting(x + hsp, y, Obj_wall) and on_ground) {
            vsp = jump_speed;
        }
        
        // Smart jump over pits
        if (!place_meeting(x + hsp*20, y + 2, Obj_wall) and on_ground) {
             vsp = jump_speed;
        }
        
        // Give up if too far
        if (distance_to_object(Obj_player) > range * 1.5) {
            state = "patrol";
            patrol_dir = sign(x - Obj_player.x);
            if(patrol_dir == 0) patrol_dir = 1;
        }
    } else {
        state = "patrol";
    }
}

// Apply Gravity
if (!on_ground) {
    vsp += grav;
}
if (vsp > 12) vsp = 12;

// Apply Horizontal Movement
if (place_meeting(x + hsp, y, Obj_wall)) {
    while (!place_meeting(x + sign(hsp), y, Obj_wall)) {
        x += sign(hsp);
    }
    hsp = 0;
}
x += hsp;

// Apply Vertical Movement
if (place_meeting(x, y + vsp, Obj_wall)) {
    while (!place_meeting(x, y + sign(vsp), Obj_wall)) {
        y += sign(vsp);
    }
    vsp = 0;
}
y += vsp;

// Facing
if (hsp != 0) image_xscale = sign(hsp);

// Message Timer
if (message_timer > 0) message_timer -= 1;
"""

draw_code = """
draw_self();

// Draw Threat Message
if (message_timer > 0) {
    draw_set_halign(fa_center);
    draw_set_valign(fa_bottom);
    draw_set_color(c_white);
    
    // Draw bubble
    var text = "!ًﺎﺒﻳﺮﻗ ﻚﻠﺘﻗﺍ ﻑﻮﺳ";
    var bw = string_width(text) + 10;
    var bh = string_height(text) + 10;
    
    var bx = x;
    var by = y - sprite_height - 10;
    
    draw_set_color(c_black);
    draw_roundrect(bx - bw/2, by - bh, bx + bw/2, by, false);
    
    draw_set_color(c_red);
    draw_text(bx, by - 5, text);
    
    draw_set_halign(fa_left);
    draw_set_valign(fa_top);
}
"""

write_file('objects/obj_enemy3/Create_0.gml', create_code.strip())
write_file('objects/obj_enemy3/Step_0.gml', step_code.strip())
write_file('objects/obj_enemy3/Draw_0.gml', draw_code.strip())

# Need to update obj_enemy3.yy to include Draw event
yy_content = """{
  "$GMObject":"",
  "%Name":"obj_enemy3",
  "eventList":[
    {"$GMEvent":"v1","%Name":"","collisionObjectId":null,"eventNum":0,"eventType":0,"isDnD":false,"name":"","resourceType":"GMEvent","resourceVersion":"2.0",},
    {"$GMEvent":"v1","%Name":"","collisionObjectId":null,"eventNum":0,"eventType":3,"isDnD":false,"name":"","resourceType":"GMEvent","resourceVersion":"2.0",},
    {"$GMEvent":"v1","%Name":"","collisionObjectId":null,"eventNum":0,"eventType":8,"isDnD":false,"name":"","resourceType":"GMEvent","resourceVersion":"2.0",}
  ],
  "managed":true,
  "name":"obj_enemy3",
  "overriddenProperties":[],
  "parent":{
    "name":"group_enemy",
    "path":"folders/Objects/group_enemy.yy",
  },
  "parentObjectId":{
    "name":"Obj_enemy1",
    "path":"objects/Obj_enemy1/Obj_enemy1.yy",
  },
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
  "spriteId":{
    "name":"Spr_enemy2",
    "path":"sprites/Spr_enemy2/Spr_enemy2.yy",
  },
  "spriteMaskId":null,
  "visible":true,
}"""
write_file('objects/obj_enemy3/obj_enemy3.yy', yy_content.strip())
print("Enemy AI updated with state machine, smart jumping, and text bubble.")
