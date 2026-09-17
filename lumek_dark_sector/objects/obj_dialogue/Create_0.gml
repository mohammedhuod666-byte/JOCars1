// obj_dialogue — in-game text box with Arabic support
// Shows NPC / sign lines with portrait, speaker name, typewriter
// reveal, and an "Enter to advance" prompt.
//
// 아랍어 텍스트는 GM 폰트(아랍어 글리프 포함) + RTL 버디로 처리합니다.
// GM 기본 draw_text는 아랍어를 문자 단위로만 표시하므로,
// 여기서 글리프 방향 처리는 하지 않고 폰트 측으로 맡깁니다.
// 필요하면 draw_text_ext와 wrap_text를 함께 씁니다.

// ---- Create ----
current_index  = 0;
char_index     = 0;
char_speed     = 6;          // chars per frame (타이핑 속도)
frame_counter  = 0;
is_finished    = false;
is_skipped     = false;
margin         = 1;
box_h          = 170;
box_w          = 0;
font_id        = -1;
portrait       = noone;
speaker_name   = "";
speaker_color  = c_yellow;

// ---- Step ----
frame_counter += 1;

if (!is_finished and !is_skipped) {
    if (frame_counter mod char_speed == 0) {
        char_index += 1;
        if (char_index >= string_length(lines[current_index])) {
            char_index = string_length(lines[current_index]);
            is_finished = true;
        }
    }
}

// ---- Input: Enter to advance / skip ----
if (keyboard_check_pressed(vk_enter) or keyboard_check_pressed(vk_space)) {
    if (!is_finished and !is_skipped) {
        // skip the rest of typing
        char_index    = string_length(lines[current_index]);
        is_finished   = true;
        is_skipped    = true;
    } else {
        current_index += 1;
        if (current_index >= array_length(lines)) {
            global.dialogue_active = false;
            instance_destroy();
        } else {
            char_index   = 0;
            is_finished  = false;
            is_skipped   = false;
        }
    }
}

// also allow mouse click on box
if (mouse_check_button_pressed(mb_left)) {
    var gw = display_get_gui_width();
    var gh = display_get_gui_height();
    var bx = margin;
    var by = gh - box_h - margin;
    if (mouse_x >= bx and mouse_x <= gw - margin
        and mouse_y >= by and mouse_y <= gh - margin) {
        // same as Enter
        if (!is_finished and !is_skipped) {
            char_index    = string_length(lines[current_index]);
            is_finished   = true;
            is_skipped    = true;
        } else {
            current_index += 1;
            if (current_index >= array_length(lines)) {
                global.dialogue_active = false;
                instance_destroy();
            } else {
                char_index  = 0;
                is_finished = false;
                is_skipped  = false;
            }
        }
    }
}
