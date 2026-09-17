// ============================================================
//  obj_companion — Step
//  Smooth follow + contextual chat in Arabic
// ============================================================
if (!instance_exists(target)) exit;

var dest_x = target.x - 32 * sign(target.image_xscale);
var dest_y = target.y - 55;
x += (dest_x - x) * follow_speed;
y += (dest_y - y) * follow_speed;

if (chat_timer > 0) {
    chat_timer -= 1;
    is_talking = true;
} else {
    is_talking = false;
}

if (!is_talking && chat_index < array_length(messages)) {
    if (random(1000) < 2.2 && instance_exists(Obj_player)) {
        var dist = point_distance(x, y, Obj_player.x, Obj_player.y);
        if (dist < 250) {
            active_chat = messages[chat_index];
            is_talking  = true;
            chat_timer  = 180;
            chat_index += 1;
        }
    }
}
