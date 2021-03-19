const { InsertBusyBlockAsync, GetAllAvailabilityByDayAsync, GetUserAvailabilityByDayAsync, UpsertUserAvailabilityAsync, GetParticipantInfoAsync, InsertParticipantInfoAsync, GetUsersWithNoEventsByDayAsync } = require('../providers/scheduling')
const { addMinutes } = require('date-fns')

//32 = number of 15 min blocks between 9a-5p
const BLANK_USED_BLOCKS = '0'.repeat(32);

/* Public (exported) functions */
async function UpdateAvailability(busyBlock) {

    // Check start and end time are valid dates
    if(isNaN(new Date(busyBlock.startTime).getTime())){
        let err = new Error('Provided start time is not a valid Date. Valid Date example = "2021-01-02T12:45:00-00:00"');
        err.statusCode = 400;
        throw err;
    }
    if(isNaN(new Date(busyBlock.endTime).getTime())){
        let err = new Error('Provided end time is not a valid Date. Valid Date example = "2021-01-02T12:45:00-00:00"');
        err.statusCode = 400;
        throw err;
    }

    try {
        // Add event to Calendar
        await AddBusyBlock(busyBlock);

        //Get current "used_Blocks" by user for the day, and calculate its new value
        //Although not provided by user, busyBlock.participant_id should always exist at this point --
        // because AddBusyBlock() will throw an error if it fails to create or retrieve the participant
        let dayStart = new Date(busyBlock.startTime)
        let userAvailability = await GetUserAvailabilityByDayAsync(dayStart, busyBlock.participant_id)

        //If user has no events for this day yet, start with blank slate
        let currentUsedBlocks = userAvailability ? userAvailability.used_blocks : BLANK_USED_BLOCKS;
        let calculatedUsedBlocks = CalculateUsedBlocks(busyBlock, currentUsedBlocks)     
        
        //Update existing, or insert new user availability for the day
        await UpsertUserAvailabilityAsync(calculatedUsedBlocks, busyBlock.participant_id, dayStart)
        return "Availability Updated"

    } catch(err) {
        throw err;
    }
}

// Returns all blocks of size durationMins on date with the least amount of unavailable participants
async function GetAvailability(date, durationMins) {

    // Check that durationMins is valid block length
    if((durationMins % 15) !== 0){
        let err = new Error('Provided duration needs to be an increment of 15 mins');
        err.statusCode = 400;
        throw err;
    }

    //Define the start and end of the first block of the day (regardless of participants) based on durationMins
    // e.g if durationMins = 45min -- First block is 9:00am - 9:45am UTC
    let startBlock = new Date([date.slice(0, 4), date.slice(4,6), date.slice(6,8)].join('-'))
    // Double check the date sent is actually valid
    if(isNaN(startBlock.getTime())){
        let err = new Error('Provided querystring date is not a valid. Valid query example = /api/availability?date=20210102&duration=45');
        err.statusCode = 400;
        throw err;
    }
    startBlock.setUTCHours(9, 0, 0)
    let endBlock = addMinutes(startBlock, durationMins)
    
    //Fetch all users availability blocks who have some 'busy blocks' on provided date
    let availableBlocks = await GetAllAvailabilityByDayAsync(date);

    //Fetch all users who exist in participants table, but have no availability blocks set for this day
    // no availability blocks set for day === participant available all day
    let usersWithNoEvents = await GetUsersWithNoEventsByDayAsync(date);
    usersWithNoEvents = usersWithNoEvents.map(row => row.name)
    

    // A used_blocks value is a string of 32 0's and 1's -- defined per user per day
    // Each digit represents wether this user is available during that coresponding 15 minute block for the given day
    // 0 = available
    // 1 = unavailable
    // startptr & endptr represent a moving window of blocks of the length defined by durationMins 
    let startptr = 0;
    let endptr = durationMins / 15
    let possibleSlots = []
    let nonAttendanceCount = []
    // 32 represents the last block of the day - so stop when the moving window has hit the final block of the day (5pm)
    while(endptr <= 32){
        let currentSlot = {
            startTime: startBlock.toUTCString(),
            endTime: endBlock.toUTCString(),
            participants: [...usersWithNoEvents],
            cannotAttend: []
        }
        // Check per user if the current window being observed has any value other than all 0's (available)
        // regardless of window length, if the parsed int of current window is greater than 0, this user is unavailable for this slot
        availableBlocks.forEach(user => {
            let sub = parseInt(user.used_blocks.substring(startptr, endptr))
            if(sub > 0){
                currentSlot.cannotAttend.push(user.name)
            } else {
                currentSlot.participants.push(user.name)
            }
        });
        possibleSlots.push(currentSlot);
        nonAttendanceCount.push(currentSlot.cannotAttend.length)
        startBlock = addMinutes(startBlock, 15)
        endBlock = addMinutes(endBlock, 15)
        startptr += 1
        endptr += 1
    }

    // nonAttendanceCount is an array containing the lengths of all 'cannotAttend' arrays per slot
    var minMissing = Math.min( ...nonAttendanceCount );

    // We only want to return slots with the least participants unavailable
    return possibleSlots.filter(slot => slot.cannotAttend.length == minMissing )
}


/* Private functions for use within this module */
// used for updating the "used_blocks" based on busy block being added
function CalculateUsedBlocks(busyBlock, usedBlocks){
    let start = new Date(busyBlock.startTime)
    let end = new Date(busyBlock.endTime)

    let workstart = new Date(busyBlock.startTime)
    workstart.setUTCHours(09, 00, 00);

    //diff between added busyblock start time, and start of work day (9am UTC) is used to
    // calculate the first index of the "used_blocks" string we need to update and the same for the end index
    // e.g. new busyblock = 10:30 - 11:00
    // 10:30 - 9:00 = 1.5hrs
    // 11:00 - 9:00 = 2hrs
    // 1.5hrs / 15(mins) = 6 and 2hrs / 15(mins) = 8
    // so need to update used_blocks string between index 6 and 8
    var startblock = start.getTime() - workstart.getTime();
    var endblock = end.getTime() - workstart.getTime();

    let startBlockIdx = (startblock / 60000) / 15;
    let endBlockIdx = (endblock / 60000) / 15;

    // replace all digits between start and end index with 1's to signify this participant is unavailable for those slots
    let newUsedBlockString = usedBlocks.substr(0, startBlockIdx);
    newUsedBlockString = newUsedBlockString + '1'.repeat((endBlockIdx - startBlockIdx))
    newUsedBlockString = newUsedBlockString + usedBlocks.substr(endBlockIdx)
    return newUsedBlockString
}

// Adds event to busyBlock table
// will also insert new participant to participants table if they dont yet exist
async function AddBusyBlock(busyBlock) {
    try {
        let participant = await GetParticipantInfoAsync(busyBlock.participant);
        if(!participant){
            await InsertParticipantInfoAsync(busyBlock.participant)
            participant = await GetParticipantInfoAsync(busyBlock.participant);
        } 

        //If theres still no participant - something went wrong with the insert, dont continue
        if(!participant.id){         
            let err = new Error('Something went wrong while inserting or fetching participant for this block.');
            throw err;
        }
        busyBlock.participant_id = participant.id;
        await InsertBusyBlockAsync(busyBlock);

    } catch(err) {
        throw err;
    }
}

module.exports = {
    UpdateAvailability,
    GetAvailability
};