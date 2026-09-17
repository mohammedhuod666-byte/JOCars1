// Object39 — Step
if (!instance_exists(obj_text_box)) {
    if (wait <= 0) {
        sign_active = false;
        wait = wait_max;
    } else {
        wait -= 1;
    }
}
