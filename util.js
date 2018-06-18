function rand_int(lower, upper) {
    return Math.floor(lower + Math.random() * (upper - lower));
}

export {
    rand_int
}
