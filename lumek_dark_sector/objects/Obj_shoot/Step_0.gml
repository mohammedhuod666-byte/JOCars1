// obj_shoot — Step
var dir = image_xscale != 0 ? sign(image_xscale) : 1;
x += spd * dir;

life -= 1;
if (life <= 0) {
    instance_destroy();
}

if (place_meeting(x, y, Obj_player)) {
    with (Obj_player) {
        hp -= dmg;
        light_radius = max(25, light_radius - 10);
        if (hp <= 0) player_lost();
    }
    instance_destroy();
}
