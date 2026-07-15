// -------------------- SEEDED RNG --------------------
function SeededRNG(Seed) {
    this.seed = Seed;
    this.seedOffset = 0;
    this.multiplier = 1103515245;
    this.incrementer = 31051;
    this.modulus = 2147483647;
}
SeededRNG.prototype.get = function () { // Outputs a random number between 0 and 1, then increases the seed offset

    let value = this.seed + this.seedOffset; // Start with the seed

    for (let iteration = 0; iteration < 10; iteration++) { // Run the algorithm multiple times for a more random number
        value = (this.multiplier * value + this.incrementer) % this.modulus;
    }

    let output = value / this.modulus;

    this.seedOffset += Math.floor(999 * output) + 1; // It's possible to floor to 0 in which case we loop infinitely, so add 1 to prevent that

    console.log(`Output: ${value} | Next seed offset: ${this.seedOffset}`);
    return output;
}

/*let srng = new SeededRNG(99);

for (let i = 0; i < 200; i++) {
    srng.get();
}*/
