// obj_switch — Step
var dist = point_distance(x, y, Obj_player.x, Obj_player.y);
hovered = (dist < 40);

if (hovered && keyboard_check_pressed(vk_control)) {
    open = !open;
    image_index = open ? 1 : 0;
}
