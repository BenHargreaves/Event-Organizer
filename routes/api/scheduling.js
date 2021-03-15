var express = require('express');
var router = express.Router();

/* GET scheduling availability */
router.get('/availability', function(req, resp, next) {
  if(!req.query.date) {
    return resp.status(400).json({ msg: 'Missing date parameter' });
  }
  if(!req.query.duration) {
    return resp.status(400).json({ msg: 'Missing duration parameter' });
  }
  console.log(req.query);
  resp.send('respond with a resource');
});

router.post('/schedule', function(req, resp, next) {

  const busyBlock = {
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      participant: req.body.participant,
      description: req.body.description
  }
  if(!busyBlock.startTime || !busyBlock.endTime || !busyBlock.participant) {
    return resp.status(400).json({ msg: 'Please send a startTime, endTime, and participant with your request to add a busy block.' })
  } 

  console.log(req.body);
  resp.send('respond with a resource');
});

module.exports = router;
