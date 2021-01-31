function Player(genome, v){
  this.x = Math.random() * WIDTH;
  this.y = Math.random() * HEIGHT;

  this.vx = 0;
  this.vy = 0;
  this.r = 6;

  this.brain = genome;
  this.brain.genomeIdx = v;
  this.brain.score = 0;
}


Player.prototype = {
  /** Update the stats */
  update: function(){
    var input = this.detect();
    var output = this.brain.activate(input);
    var moveangle = output[0] * 2 * PI;

    // Calculate next position
    this.ax = Math.cos(moveangle)
    this.ay = Math.sin(moveangle)

    // Apply only a fraction of the angular velocity to simulate inertia
    this.vx += this.ax * .8 * output[1]
    this.vy += this.ay * .8 * output[1]

    // Limit speeds to maximum speed
    this.vx = this.vx > MAX_SPEED ? MAX_SPEED : this.vx < -MAX_SPEED ? -MAX_SPEED : this.vx;
    this.vy = this.vy > MAX_SPEED ? MAX_SPEED : this.vy < -MAX_SPEED ? -MAX_SPEED : this.vy;

    // Friction
    // this.vx -= (this.vx * 0.01);
    // this.vy -= (this.vy * 0.01);

    this.x += this.vx;
    this.y += this.vy;

    // Limit position to width and height
    //this.x = this.x >= WIDTH  ? WIDTH  : this.x <= 0 ? 0 : this.x;
    //this.y = this.y >= HEIGHT ? HEIGHT : this.y <= 0 ? 0 : this.y;
    this.x = this.x >= WIDTH  ? (this.x - WIDTH)  : this.x <= 0 ? (WIDTH - this.x) : this.x;
    this.y = this.y >= HEIGHT  ? (this.y - HEIGHT)  : this.y <= 0 ? (HEIGHT - this.y) : this.y;

    if(this.x == 0 || this.x == WIDTH) this.vx = -this.vx;
    if(this.y == 0 || this.y == HEIGHT) this.vy = -this.vy;

    this.score();
  },
  exit: function(){
    return;
  },
  getPos: function(){
    return({"x": this.x, "y": this.y, "vx" : this.vx, "vy":this.vy})
  },
  setPos: function(newPos){
    this.x = newPos.x
    this.y = newPos.y
    this.vx = newPos.vx
    this.vy = newPos.vy
  },
  getScore: function(){
    return this.brain.score
  },
  setScore: function(newScore){
    this.brain.score = newScore
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

    // Replace highest score to visualise
    highestScore = this.brain.score > highestScore ? this.brain.score : highestScore;
  },

  /** Display the player on the field, parts borrowed from the CodingTrain */
  show: function(){
    // Draw a triangle rotated in the direction of velocity
    var angle = Math.atan2(this.vy, this.vx) + Math.PI / 2.0;
    var color = activationColor(this.brain.score, highestScore);

    push();
    translate(this.x, this.y);
    rotate(angle);

    stroke(color);
    //console.log(color)
    fill([0,0,0]);
    beginShape();
    vertex(0, -this.r * 2);
    vertex(-this.r, this.r * 2);
    vertex(this.r, this.r * 2);
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
    var vx = this.vx / MAX_SPEED;
    var vy = this.vy / MAX_SPEED;
    var tvx = walker.vx / MAX_SPEED;
    var tvy = walker.vy / MAX_SPEED;

    return [vx, vy, tvx, tvy, targetAngle, dist];
  },
};
