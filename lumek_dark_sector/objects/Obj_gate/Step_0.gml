// Obj_gate — Step (gentle flash to guide player)
if (is_active) {
    flash_timer += 1;
    if (flash_timer > 60) flash_timer = 0;
}
