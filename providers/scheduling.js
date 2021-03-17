const { Client } = require('pg')

async function GetClient(){
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'postgres',
        password: 'admin',
        port: 5432,
    })
    client.connect()

    return client;
}

async function GetParticipantInfoAsync(userName){
    const client = await GetClient();
    try {
        let res = await client.query('SELECT * FROM participants WHERE name = $1 LIMIT 1', [userName]);
        return res.rows[0];
    } catch (err) {
        console.log(err.stack);
    } finally {
        client.end();
    }
}

async function InsertParticipantInfoAsync(userName){
    const client = await GetClient();
    try {
        await client.query('INSERT INTO participants(name) VALUES($1)', [userName])
        return "Participant Inserted"
    } catch (err) {
        console.log(err.stack);
    } finally {
        client.end();
    }
}


// block 1 - 9/930 - avail [x,y,z] unavail[a,b,c]
async function UpsertUserAvailabilityAsync(usedblocks, participant_id, date) {
    const client = await GetClient();
    try {
        let res = await client.query('SELECT * FROM availabilityByDay WHERE participant_id = $1 AND date = $2', [participant_id, date]);
        if(!res.rows[0]){
            await client.query('INSERT INTO availabilityByDay(participant_id, date, used_blocks) VALUES($1, $2, $3)', [participant_id, date, usedblocks]);
        } else {
            await client.query('UPDATE availabilityByDay SET used_blocks = $1 WHERE participant_id = $2 AND DATE = $3 ', [usedblocks, participant_id, date]);
        }
        
    } catch (err) {
        console.log(err.stack);
    } finally {
        client.end();
    }
}

async function GetUserAvailabilityByDayAsync(date, participant_id){
    const client = await GetClient();
    try {
        let result = await client.query('SELECT * FROM availabilityByDay WHERE participant_id = $1 AND date = $2', [participant_id, date]);
        return result.rows[0];
    } catch (err) {
        console.log(err.stack);
    } finally {
        client.end();
    }
}

async function InsertBusyBlockAsync(busyBlock) {
    const client = await GetClient();
    try {
        await client.query('INSERT INTO busyblocks(starttime, endtime, participant_id, description) VALUES($1, $2, $3, $4)', [busyBlock.startTime, busyBlock.endTime, busyBlock.participant_id, busyBlock.description]);
        return 'Busyblock inserted';
    } catch (err) {
        console.log(err.stack);
    } finally {
        client.end();
    }
}

async function GetAllAvailabilityByDayAsync(date) {
    const client = await GetClient();
    try {
        const res = await client.query('SELECT participant_id, name, date, used_blocks FROM availabilityByDay INNER JOIN participants ON availabilityByDay.participant_id = participants.id WHERE availabilityByDay.date = $1', [date]);
        console.log(res.rows)
        return res.rows
    } catch (err) {
        console.log(err.stack);
    } finally {
        client.end();
    }
}

async function GetUsersWithNoEventsByDayAsync(date) {
    const client = await GetClient();
    try {
        const res = await client.query('SELECT name FROM participants WHERE id NOT IN ( SELECT participant_id FROM availabilityByDay WHERE date = $1)', [date]);
        console.log(res.rows)
        return res.rows
    } catch (err) {
        console.log(err.stack);
    } finally {
        client.end();
    }
}


module.exports = {
    InsertBusyBlockAsync,
    GetAllAvailabilityByDayAsync,
    GetUserAvailabilityByDayAsync,
    UpsertUserAvailabilityAsync,
    GetParticipantInfoAsync,
    InsertParticipantInfoAsync,
    GetUsersWithNoEventsByDayAsync
};

