DROP TABLE IF EXISTS participants;
DROP TABLE IF EXISTS busyblocks;
DROP TABLE IF EXISTS availabilityByDay;

CREATE TABLE participants(
    id INT GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(255) NOT NULL,
    PRIMARY KEY(id)
);

CREATE TABLE busyblocks(
    id INT GENERATED ALWAYS AS IDENTITY,
    participant_id INT,
    starttime TIMESTAMP WITH TIME ZONE,
    endtime TIMESTAMP WITH TIME ZONE,
    description VARCHAR(255),
    PRIMARY KEY(id),
    CONSTRAINT fk_participant
        FOREIGN KEY(participant_id) 
 	    REFERENCES participants(id)
	    ON DELETE CASCADE
);

CREATE TABLE availabilityByDay(
    id INT GENERATED ALWAYS AS IDENTITY,
    participant_id INT,
    date DATE,
    used_blocks VARCHAR(255),
    PRIMARY KEY(id),
    CONSTRAINT fk_participant
        FOREIGN KEY(participant_id) 
	    REFERENCES participants(id)
	    ON DELETE CASCADE
);

INSERT INTO participants(name)
VALUES ('Jade'), ('Mike');

