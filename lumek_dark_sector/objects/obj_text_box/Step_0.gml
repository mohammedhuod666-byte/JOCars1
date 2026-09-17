// obj_text_box — Step
life -= 1;
alpha -= 0.008;
y -= 0.3;  // float upward slightly
if (life <= 0 or alpha <= 0) {
    instance_destroy();
}
