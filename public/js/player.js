function Player(genome, v)
{
    this.size = 6;
    this.clock = 0;

    this.x = Math.random() * WIDTH;
    this.y = Math.random() * HEIGHT;
    this.vx = 0;
    this.vy = 0;

    this.leftFinAngle = 0.5;
    this.rightFinAngle = 0.5;

    this.brain = genome;
    this.brain.genomeIdx = v;
    this.brain.score = 0;
}


Player.prototype =
{
    /** Update the stats */
    update: function()
    {
        const input = this.detect();
        const output = this.brain.activate(input);

        let leftFinMuscle = output[0];
        let rightFinMuscle = output[1];
        if (isNaN(leftFinMuscle)) leftFinMuscle = 0;
        if (isNaN(rightFinMuscle)) rightFinMuscle = 0;
        if (leftFinMuscle < 0) leftFinMuscle = 0;
        if (leftFinMuscle > 1) leftFinMuscle = 1;
        if (rightFinMuscle < 0) rightFinMuscle = 0;
        if (rightFinMuscle > 1) rightFinMuscle = 1;

        // open and close fins, rotate away only from _closing_ fin thrust
        let speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        let angle = Math.atan2(this.vy, this.vx);
        let rotation = 0;
        const ml = this.leftFinAngle;
        const mr = this.rightFinAngle;
        if (leftFinMuscle != this.leftFinAngle)
        {
            this.leftFinAngle += (leftFinMuscle - this.leftFinAngle) * 0.1;
            if (this.leftFinAngle < ml)
            {
                rotation += (ml - this.leftFinAngle);
                speed += (ml - this.leftFinAngle);
            }
        }
        if (rightFinMuscle != this.rightFinAngle)
        {
            this.rightFinAngle += (rightFinMuscle - this.rightFinAngle) * 0.1;
            if (this.rightFinAngle < mr)
            {
                rotation -= (mr - this.rightFinAngle);
                speed += (mr - this.rightFinAngle);
            }
        }

        // calculate friction from fin positions (wider open = turn faster)
        rotation += (this.rightFinAngle * 0.1 - this.leftFinAngle * 0.1) * speed / MAX_SPEED;

        // turn from fin thrusts and fin friction
        angle += rotation;

        // apply friction proportional to speed
        speed -= FRICTION * speed;

        // recalculate vx, vy from velocity and new angle
        if (speed < 0) speed = 0;
        if (speed > MAX_SPEED) speed = MAX_SPEED;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        // move with velocity
        this.x += this.vx;
        this.y += this.vy;

        // Toroidal world
        if (this.x < 0) this.x += WIDTH;
        if (this.x >= WIDTH) this.x -= WIDTH;
        if (this.y < 0) this.y += HEIGHT;
        if (this.y >= HEIGHT) this.y -= HEIGHT;

        this.score();
    },
    exit: function(){
        return;
    },
    getPos: function()
    {
        return({
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            la: this.leftFinAngle,
            ra: this.rightFinAngle,
            clock:this.clock
            });
    },
    setPos: function(newPos)
    {
        this.x = newPos.x;
        this.y = newPos.y;
        this.vx = newPos.vx;
        this.vy = newPos.vy;
        this.leftFinAngle = newPos.la;
        this.rightFinAngle = newPos.ra;
        this.clock = newPos.clock;
    },
    getScore: function()
    {
        return this.brain.score;
    },
    setScore: function(newScore)
    {
        this.brain.score = newScore;
    },

    /** Calculate fitness of this players genome **/
    score: function()
    {
        var dx = walker.x - this.x;
        var dy = walker.y - this.y;
        // world is toroidal, wrap around at edges
        if (dx > WIDTH / 2) dx = WIDTH - dx;
        if (dx < -WIDTH / 2) dx = WIDTH + dx;
        if (dy > HEIGHT / 2) dy = HEIGHT - dy;
        if (dy < -HEIGHT / 2) dy = HEIGHT + dy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < SCORE_RADIUS)
        {
            this.brain.score += (SCORE_RADIUS - dist) / SCORE_RADIUS;
            if (this.brain.score <= 0)
                this.brain.score = 0;
        }

        // small bonus for movement (to kick-start the evolution)
        let speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy) / MAX_SPEED;
        if (speed > 0.1) this.brain.score += 1 / ITERATIONS;

        // Replace highest score to visualise
        highestScore = this.brain.score > highestScore ? this.brain.score : highestScore;
    },

    /** Display the player on the field */
    show: function()
    {
        push();
        const color = activationColor(this.brain.score, highestScore);
        stroke(color);
        fill([0,0,0]);
        beginShape();

        translate(this.x, this.y);
        const angle = Math.atan2(this.vy, this.vx) + Math.PI / 2.0;
        rotate(angle);

        // spine, tail to nose
        let x = 0, y = this.size * 2;
        vertex(x, y);
        x = 0, y = -this.size * 2;
        vertex(x, y);

        // left fin from nose, then to tail
        x -= this.size * 4 * Math.sin(this.leftFinAngle * Math.PI / 4);
        y += this.size * 4 * Math.cos(this.leftFinAngle * Math.PI / 4);
        vertex(x, y);
        x = 0, y = this.size * 2;
        vertex(x, y);

        // right fin line from tail, calculated as offset from nose, then to nose
        x = 0              + this.size * 4 * Math.sin(this.rightFinAngle * Math.PI / 4);
        y = -this.size * 2 + this.size * 4 * Math.cos(this.rightFinAngle * Math.PI / 4);
        vertex(x, y);
        x = 0, y = -this.size * 2;
        vertex(x, y);

        // close shape (nose to tail again)
        endShape(CLOSE);
        pop();
    },

    /** Detect and normalize inputs */
    detect: function(){
        var dx = walker.x - this.x;
        var dy = walker.y - this.y;

        // world is toroidal, wrap around at edges
        if (dx > WIDTH / 2) dx = WIDTH - dx;
        if (dx < -WIDTH / 2) dx = WIDTH + dx;
        if (dy > HEIGHT / 2) dy = HEIGHT - dy;
        if (dy < -HEIGHT / 2) dy = HEIGHT + dy;

        var targetAngle = (Math.atan2(dy, dx) + Math.PI / 2.0) / TWO_PI;
        var dist = Math.sqrt(dx * dx + dy * dy) / Math.sqrt(WIDTH*WIDTH + HEIGHT*HEIGHT);

        let angle = (Math.atan2(this.vy, this.vx) + Math.PI / 2.0) / TWO_PI;
        let speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy) / MAX_SPEED;

        this.clock++;
        let wave = (Math.sin(this.clock * 0.1) + 1.0) * 0.5;

        // all values must be normalised 0..1
        return [angle, speed, targetAngle, dist, (this.clock % ITERATIONS) / ITERATIONS, wave];
    },
};
