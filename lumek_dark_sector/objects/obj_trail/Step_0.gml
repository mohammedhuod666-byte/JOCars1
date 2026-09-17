// obj_trail — Step
life -= 1;
alpha -= 0.04;
if (alpha <= 0) {
    instance_destroy();
}
