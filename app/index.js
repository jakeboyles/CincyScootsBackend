// Super quick and easy pull and api for scooter population.
// Needs a lot of cleanup

const Bird = require('../')
const bird = new Bird()
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 8080;
require('dotenv').config()

app.use(cors())
mongoose.connect(process.env.MONGO_URL);

// Simple Mongoose Models for DB.
const BirdDb = mongoose.model('Bird', { 
  lat: String,
  long: String,
  id: String,
  code: String,
  battery: Number,
  run: { type: Schema.Types.ObjectId, ref: 'Run' }
});

const Run = mongoose.model('Run', { 
  time: Date,
  birds: [{ type: Schema.Types.ObjectId, ref: 'Bird' }]
});


// Getting the biiiirrrrddddsss. I use a token I got from the api
// https://github.com/ubahnverleih/WoBike/blob/master/Bird.md

async function getSomeFuckingBirds() {
  try {
    await bird.setAccessToken();
    const birds = await bird.getScootersNearby(39.108774, -84.511449, 3000);

    if(birds.length === 0) return false;

    const run = new Run(
      { 
        time: Date.now() 
      }
    );
    await run.save();

    birds.forEach(async (birdSingle)=>{
      const bird = new BirdDb({ 
        lat: birdSingle.location.latitude,
        long: birdSingle.location.longitude,
        id: birdSingle.id,
        code: birdSingle.code,
        battery: birdSingle.battery_level,
        run
      });

      await bird.save();
      run.birds.push(bird);
      return true;
    })

    // ucking hacky.. figure it out later.
    setTimeout(()=>{
      run.save();
    }, 3000);

  } catch (err) {
    console.log(err)
  }
}


// Routes for quick API
app.get('/birds/:id', (req, res) => {
  Run.
  findOne({_id: req.params.id}).
  populate('birds').
  exec(function (err, birds) {
    if (err) return handleError(err);
    res.status(200).json(birds);
  });
});

app.get('/runs', (req, res) => {
  Run.
  find().
  exec(function (err, runs) {
    if (err) return handleError(err);
    res.status(200).json(runs);
  });
});

// Inital push to db.
getSomeFuckingBirds();

// Set them every 3 mins.
setInterval(()=> {
  getSomeFuckingBirds();
}, 240 * 1000); 


app.listen(port, () => console.log(`Example app listening on port ${port}!`))