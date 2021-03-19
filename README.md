# Event Organizer
## About
The Event organizer app takes a peek at everyones calendars, and then suggests the best time slots to organize an event on a given day. It aims to return only timeslots where the most amount of participants possible will be able to attend.

Users can also add 'Busy Blocks' to their calendar, to mark that participant as unavailable during those timeslots

The Event Organizer app is designed to be fully containerized with Docker so it can be spun up or redeployed quickly. It runs on an NodeJS/Express based API, with Postgres DB to store the particpants and their respective availability.

## Project Setup
### Using Docker (Recommended)
The simplest (and best) way to get up and running is with Docker. Following the steps below will start the application container in production mode, spin up a Postgres DB container, and define the necessary table schema along with some basic seed data. 

1. Clone this repo
2. Install Docker (https://docs.docker.com/get-docker/)
3. Open a terminal session in the same location that contains the `Dockerfile` and `docker-compose.yml` files in this project
4. Build the containers using  
`docker-compose build`
5. Start the containers using  
`docker-compose up`

And you're ready to go! Once you're done with this app, you can teardown all the containers created  using
`docker-compose down`

> NOTE -- Docker Compose will start the App container listening on **Port 3000** and postgres DB container listening on **Port 5432**. If you already have any other services or containers listening on either of these ports, you may need to change the containers port bindings in the `docker-compose.yml` file
e.g. if you already have another app listening on port 3000, change the "Ports" section under the "api" service to something like:  
```
ports:  
   "3080:3000"
```

### Without Docker (Untested)
As this app was designed to run in a container, it is definitely recommended you take the Docker setup route instead. However if you would rather not use Docker, you should be able to complete the following steps to get up and running
1. Clone this repo
2. Install NodeJS (https://nodejs.org/en/download/)
3. Install Postgres (https://www.postgresql.org/download/)
4. Open your Postgres console and run **ALL** the commands in the `docker_postgres_init.sql` file to define the necessary table schema
5. Open a terminal window in the same location as the `package.json` file in this project and then run  
`npm install`
6. After the packages have finishing downloading, run the following command to run the app in dev mode
`npm run start-dev`

## Usage
### Add Busy Block
To add a new "Busy block" which sets a user as unavailable for that time, make a POST request to `localhost:3000/api/schedule` which accepts the following parameters in the request body as JSON
```
startTime:    Required. DateTime string representing the start of the busy block
endTime:      Required. DateTime string representing the end of the busy block
participant:  Required. String containing user to be set unavailable. User will be created if they dont exist
description:  Optional. String describing the busy block
```

An example request which sets the user "Jade" unavailable between 9:15am and 12pm UTC on the 2nd of January would look like:
```http
POST /api/schedule HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Content-Length: 160

{
    "startTime": "2021-01-02T09:15:00-00:00",
    "endTime": "2021-01-02T12:00:00-00:00",
    "participant": "Jade",
    "description": "Daily standup"
}
```

### Get Availability
Make a Get request to `localhost:3000/api/availability` with the query string parameters `date` and `duration` included to return all time slots of length `duration` on `date` which have the most participants available to attend. The search assumes a standard workday of 9am to 5pm, so it wont look for timeslots before 9am or after 5pm

Accepts the following querystring parameters
```
date:       Required. The Date to check availability on. 
            Format is YYYYMMDD e.g 20210102
duration:   Required. The length of timeslot you need, in minutes.
            Must be an increment of 15 mins
```

An Example request to look for a 45 minute time slot on the 2nd of January 2021 would look like:
```http
GET /api/availability?date=20210102&duration=45 HTTP/1.1
Host: localhost:3000
```
