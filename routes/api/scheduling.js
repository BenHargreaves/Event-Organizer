var express = require('express');
const { UpdateAvailability, GetAvailability } = require('../../services/scheduling')


var router = express.Router();

/* GET scheduling availability */
router.get('/availability', async (req, resp) => {
    if(!req.query.date) {
        return resp.status(400).json({ msg: 'Missing date parameter' });
    }
    if(!req.query.duration) {
        return resp.status(400).json({ msg: 'Missing duration parameter' });
    }
    const result = await GetAvailability(req.query.date, req.query.duration);
    console.log(req.query);
    resp.json(result);
});

// POST new busy block
router.post('/schedule', async (req, resp) => {
    const busyBlock = {
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        participant: req.body.participant,
        description: req.body.description
    }
    if(!busyBlock.startTime || !busyBlock.endTime || !busyBlock.participant) {
        return resp.status(400).json({ msg: 'Please send a startTime, endTime, and participant with your request to add a busy block.' })
    } 

    try {
        const result = await UpdateAvailability(busyBlock)
        resp.json(result)
    } catch(err) {
        console.log(err);
    }
});

module.exports = router;
