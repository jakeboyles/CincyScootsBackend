const Bird = require('../')
const bird = new Bird()
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 8080;

app.use(cors())

mongoose.connect('mongodb://jake:Baseball_200@ds129422.mlab.com:29422/birds');

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

async function getSomeFuckingBirds() {
  try {
    await bird.login('jake@jibdesigns.com')
    const birds = await bird.getScootersNearby(39.108774, -84.511449, 3000);

    if(birds.length === 0) return false;

    const run = new Run({ time: Date.now() });
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

app.get('/birds/:id', (req, res) => {
  Run.
  findOne({_id: req.params.id}).
  populate('birds').
  exec(function (err, birds) {
    if (err) return handleError(err);
    res.json(birds);
  });
});

app.get('/runs', (req, res) => {
  Run.
  find().
  exec(function (err, runs) {
    if (err) return handleError(err);
    res.json(runs);
  });
});

// getSomeFuckingBirds();

// setInterval(()=> {
//   getSomeFuckingBirds();
// }, 240 * 1000); // 60 * 1000 milsec


app.listen(port, () => console.log(`Example app listening on port ${port}!`))