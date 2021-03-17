const { InsertBusyBlockAsync, GetAllAvailabilityByDayAsync, GetUserAvailabilityByDayAsync, UpsertUserAvailabilityAsync, GetParticipantInfoAsync, InsertParticipantInfoAsync, GetUsersWithNoEventsByDayAsync } = require('../providers/scheduling')
const { addMinutes, addHours } = require('date-fns')

//32 = number of 15 min blocks between 9a-5p
const BLANK_USED_BLOCKS = '0'.repeat(32);

// Public (exported) functions
async function UpdateAvailability(busyBlock) {
    
    // Add event to Calendar
    await AddBusyBlock(busyBlock);

    //Get used_Blocks by user
    let dayStart = new Date(busyBlock.startTime)
    let result = await GetUserAvailabilityByDayAsync(dayStart, busyBlock.participant_id)
    let updatedUsedBlocks = "";
    if(result){
        updatedUsedBlocks = CalculateUsedBlocks(busyBlock, result.used_blocks)     
    } else {
        updatedUsedBlocks = CalculateUsedBlocks(busyBlock, BLANK_USED_BLOCKS)
    }
    UpsertUserAvailabilityAsync(updatedUsedBlocks, busyBlock.participant_id, dayStart)

}

async function GetAvailability(startDate, durationMins) {
    let availableBlocks = await GetAllAvailabilityByDayAsync(startDate);

    let usersWithNoEvents = await GetUsersWithNoEventsByDayAsync(startDate);
    usersWithNoEvents = usersWithNoEvents.map(row => row.name)
    

    let startptr = 0;
    let endptr = durationMins / 15

    let startBlock = new Date([startDate.slice(0, 4), startDate.slice(4,6), startDate.slice(6,8)].join('-'))
    startBlock.setUTCHours(9, 0, 0)
    let endBlock = addMinutes(startBlock, durationMins)


    let possibleSlots = []
    let nonAttendanceCount = []
    while(endptr <= 32){
        let currentSlot = {
            startTime: startBlock.toUTCString(),
            endTime: endBlock.toUTCString(),
            participants: [...usersWithNoEvents],
            cannotAttend: []
        }
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

    var minMissing = Math.min( ...nonAttendanceCount );

    return possibleSlots.filter(slot => slot.cannotAttend.length == minMissing )
}

// Private functions for use within this module
function CalculateUsedBlocks(busyBlock, usedBlocks){
    let start = new Date(busyBlock.startTime)
    let end = new Date(busyBlock.endTime)

    let workstart = new Date(busyBlock.startTime)
    workstart.setUTCHours(09, 00, 00);

    var startblock = start.getTime() - workstart.getTime();
    var endblock = end.getTime() - workstart.getTime();

    let startBlockIdx = (startblock / 60000) / 15;
    let endBlockIdx = (endblock / 60000) / 15;

    let newUsedBlockString = usedBlocks.substr(0, startBlockIdx);
    newUsedBlockString = newUsedBlockString + '1'.repeat((endBlockIdx - startBlockIdx))
    newUsedBlockString = newUsedBlockString + usedBlocks.substr(endBlockIdx)
    return newUsedBlockString
}

async function AddBusyBlock(busyBlock) {
    let participant = await GetParticipantInfoAsync(busyBlock.participant);
    if(!participant){
        await InsertParticipantInfoAsync(busyBlock.participant)
        participant = await GetParticipantInfoAsync(busyBlock.participant);
    } 

    busyBlock.participant_id = participant.id;
    await InsertBusyBlockAsync(busyBlock);
}

module.exports = {
    UpdateAvailability,
    GetAvailability
};