/// Light Is Life — Lumek: The Dark Sector
/// Reads raw keyboard + gamepad input and writes named state flags
/// that Obj_player / Obj_player_1 Step events consume.
/// Called once per Step from the player object (already wired in).

var r = false;
var l = false;
var u = false;
var d = false;

if (gamepad_is_connected(0)) {

    var h_axis = gamepad_axis_value(0, gp_axislh);
    var v_axis = gamepad_axis_value(0, gp_axislv);

    if (h_axis > 0.5)  r = true;
    if (h_axis < -0.5) l = true;
    if (v_axis < -0.5) u = true;
    if (v_axis > 0.5)  d = true;

    // melee interaction (used by obj_companion / future melee combat)
    sword = keyboard_check_pressed(ord("E")) or gamepad_button_check_pressed(0, gp_face4);

    right      = r or keyboard_check(vk_right) or keyboard_check(ord("D")) or gamepad_button_check(0, gp_padr);
    left       = l or keyboard_check(vk_left)  or keyboard_check(ord("A")) or gamepad_button_check(0, gp_padl);
    up         = u or keyboard_check(vk_up)    or keyboard_check(ord("W")) or gamepad_button_check(0, gp_padu);
    up_pressed = keyboard_check_pressed(vk_up) or keyboard_check_pressed(ord("W")) or gamepad_button_check_pressed(0, gp_padu);
    dash       = keyboard_check(vk_tab)        or gamepad_button_check_pressed(0, gp_face2);
    action     = keyboard_check(vk_alt)        or gamepad_button_check_pressed(0, gp_face3);
} else {

    sword = keyboard_check_pressed(ord("E"));

    right      = keyboard_check(vk_right) or keyboard_check(ord("D"));
    left       = keyboard_check(vk_left)  or keyboard_check(ord("A"));
    up         = keyboard_check(vk_up)    or keyboard_check(ord("W"));
    up_pressed = keyboard_check_pressed(vk_up) or keyboard_check_pressed(ord("W"));
    dash       = keyboard_check(vk_tab);
    action     = keyboard_check(vk_alt);
}
