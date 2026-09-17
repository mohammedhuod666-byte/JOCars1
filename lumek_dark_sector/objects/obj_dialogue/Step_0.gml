frame_counter += 1;


if (!is_finished) {
    if (frame_counter mod char_speed == 0) {
        char_index += 1;
        if (char_index >= string_length(lines[current_index])) {
            char_index = string_length(lines[current_index]);
            is_finished = true;
        }
    }
}


if (keyboard_check_pressed(vk_enter)) {
    if (!is_finished) {
      
        char_index = string_length(lines[current_index]);
        is_finished = true;
    } else {
       
        current_index += 1;
        if (current_index >= array_length(lines)) {
            global.dialogue_active = false; 
            instance_destroy();
        } else {
            char_index = 0;
            is_finished = false;
        }
    }
}