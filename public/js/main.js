/** Rename vars */
var Neat      = neataptic.Neat;
var Methods   = neataptic.methods;
var Config    = neataptic.config;
var Architect = neataptic.Architect;

/** Turn off warnings */
Config.warnings = false;

/** Settings */
var SPEED           = 10;
var WIDTH           = window.innerWidth;
var HEIGHT          = window.innerHeight;
var MAX_DIST        = Math.sqrt(WIDTH*WIDTH + HEIGHT*HEIGHT);
var THRUST          = 1.0;
var FRICTION        = 0.002;
var MAX_SPEED       = WIDTH/300;
var START_X         = WIDTH/2;
var START_Y         = HEIGHT/2;
//var SCORE_RADIUS	= WIDTH/6;

// GA settings
var PLAYER_AMOUNT   = 250;
var ITERATIONS      = 1000;
var MUTATION_RATE   = 0.2;
var MAX_MUTATION    = 0.75;
var ELITISM         = Math.round(0.35 * PLAYER_AMOUNT);

// Trained population
var USE_TRAINED_POP = false;

//track when we won...
var firstConvergence = -1

/** Global vars */
var neat;
var players = [];


/** Construct the genetic algorithm */
function initNeat()
{
    neat = new Neat(
        6, 2,
        null,
        {
            mutation: [
                Methods.mutation.ADD_NODE,
                Methods.mutation.SUB_NODE,

                Methods.mutation.ADD_CONN,
                Methods.mutation.SUB_CONN,

                Methods.mutation.ADD_GATE,
                Methods.mutation.SUB_GATE,

                Methods.mutation.MOD_WEIGHT,
                Methods.mutation.MOD_BIAS,
                Methods.mutation.MOD_ACTIVATION,

                Methods.mutation.ADD_SELF_CONN,
                Methods.mutation.SUB_SELF_CONN,

                Methods.mutation.ADD_BACK_CONN,
                Methods.mutation.SUB_BACK_CONN
            ],
            popsize: PLAYER_AMOUNT,
            mutationRate: MAX_MUTATION,
            elitism: ELITISM
        }
    );

    if (USE_TRAINED_POP)
    {
        neat.population = population;
    }
    
    // Draw the first graph
    drawGraph(neat.population[0].graph($('.best').width()/2, $('.best').height()/2), '.best');
}


/** Start the evaluation of the current generation */
function startEvaluation()
{
    //console.log('population: ' + neat.population.length)
    highestScore = 0;

    //for(var genome in neat.population){
    for(var v=0;v<neat.population.length;v++)
    {
        genome = neat.population[v];
        if (!players[v])
        {
            players[v] = new Player(genome, v);
        }
        else
        {
            // create a new player at this old player's location
            var oldPos = players[v].getPos()
            var oldScore = players[v].getScore()
            players[v] = new Player(genome, v);

            // fix NaN
            oldPos.x = isNaN(oldPos.x) ? 0 : oldPos.x
            oldPos.y = isNaN(oldPos.y) ? 0 : oldPos.y
            oldPos.ax = isNaN(oldPos.ax) ? 0 : oldPos.ax
            oldPos.ay = isNaN(oldPos.ay) ? 0 : oldPos.ay
            oldPos.vx = isNaN(oldPos.vx) ? 0 : oldPos.vx
            oldPos.vy = isNaN(oldPos.vy) ? 0 : oldPos.vy

            players[v].setPos(oldPos)
            players[v].setScore(0)    //(oldScore * .5)
        }
    }

    walker.reset();
}



/** End the evaluation of the current generation */
function endEvaluation()
{
    var totalScore = 0
    var averageScore = 0

    // Sort the population by score
    neat.sort();

    // Draw the best genome
    if (neat.population[0])
    {
	    drawGraph(neat.population[0].graph($('.best').width()/2, $('.best').height()/2), '.best');
    }

    // Find average score of the elite group
    for(let i = 0; i < neat.elitism; i++)
    {
        const j = neat.population[i].genomeIdx;
        const s = Math.max(players[j].brain.score / ITERATIONS * 100, 0);
        totalScore += s;
    }
    averageScore = totalScore / neat.elitism;

    // Variable mutation... (Lerp towards target)
    let mutationTarget = MUTATION_RATE + (1 - Math.min(averageScore / 200, 1)) * (MAX_MUTATION - MUTATION_RATE);
    neat.mutationRate += (mutationTarget - neat.mutationRate) * 0.1;
    neat.mutationRate = Math.min(neat.mutationRate, MAX_MUTATION);

    if (firstConvergence == -1 && averageScore >= 200)
    {
        firstConvergence = neat.generation
        SPEED = 1;
        $('#firstConvergence').html(firstConvergence)
    }


    // Init new pop
    var newPopulation = [];

    // Breed the next individuals with Elitism for the best of the last generation
    for(var i = 0; i < neat.popsize; i++)
    {
        if (i < neat.elitism)
            newPopulation.push(neat.population[i]);
        else
            newPopulation.push(neat.getOffspring());
    }

    // Replace the old population with the new population
    neat.population = newPopulation;

    // Mutate the genomes
    neat.mutate();

    // Networks shouldn't get too big (ignore input and output size, they're fixed so should not penalise!)
    for(var g in neat.population)
    {
        let genome = neat.population[g];
        genome.score -= (genome.nodes.length - (genome.input + genome.output)) * 0.1;
    }

    neat.generation++;
    $('#generation').html(neat.generation)
    $('#mutationRate').html(Math.floor(neat.mutationRate * 1000) / 1000);
    $('#averageScore').html(Math.floor(averageScore * 1000) / 1000);
    $('#highestScore').html(Math.floor(highestScore * 1000) / 1000);

    startEvaluation();
}
