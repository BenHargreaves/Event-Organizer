var express = require('express');
const { UpdateAvailability, GetAvailability } = require('../../services/scheduling')


var router = express.Router();

/* GET scheduling availability */
router.get('/availability', async (req, resp) => {
    //Check if user provided all the necessary params in query string, but not their validity
    // Service layer handles wether or not the value is valid
    if(!req.query.date) {
        return resp.status(400).json({ msg: 'Missing date parameter' });
    }
    if(!req.query.duration) {
        return resp.status(400).json({ msg: 'Missing duration parameter' });
    }

    try {
        const result = await GetAvailability(req.query.date, req.query.duration);
        resp.json(result);
    } catch(err) {
        //Service layer will throw a statusCode if Client side error has been caught (4xx)
        if(err.statusCode){
            resp.status(err.statusCode).json({ msg : err.message})
        } else {
            resp.status(500).json({ msg: "Something went wrong" })
        }
    }
});

/* POST new busy block */
router.post('/schedule', async (req, resp) => {
    const busyBlock = {
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        participant: req.body.participant,
        description: req.body.description
    }
    //Check if user provided all the required values in the request body, but not their validity
    // Service layer handles wether or not the values are valid
    if(!busyBlock.startTime || !busyBlock.endTime || !busyBlock.participant) {
        return resp.status(400).json({ msg: 'Please send a startTime, endTime, and participant with your request to add a busy block.' })
    } 

    try {
        const result = await UpdateAvailability(busyBlock)
        resp.json(result)
    } catch(err) {
        //Service layer will throw a statusCode if Client side error has been caught (4xx)
        if(err.statusCode){
            resp.status(err.statusCode).json({ msg : err.message})
        } else {
            resp.status(500).json({ msg: "Something went wrong" })
        }
    }
});

module.exports = router;
