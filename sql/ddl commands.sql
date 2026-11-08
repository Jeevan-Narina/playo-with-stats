
create database if not exists playo_db;
use playo_db;

-- 1. user table

create table user (
    user_id int auto_increment primary key,
    name varchar(100) not null,
    email varchar(150) not null unique,
    profile_pic mediumblob,
    dob date,
    gender varchar(20),

    constraint chk_user_email
        check (email like '%_@_%._%')
);

-- 2. user_phone table

create table user_phone (
    user_id int not null,
    phone varchar(15) not null,

    primary key (user_id, phone),

    foreign key (user_id)
        references user(user_id)
        on delete cascade
);

-- 3. venue table

create table venue (
    venue_id int auto_increment primary key,
    name varchar(100) not null,
    address varchar(255) not null,
    price decimal(10,2) not null,
    type varchar(50) not null,

    constraint chk_venue_price
        check (price >= 0)
);

-- 4. event table

create table event (
    event_id int auto_increment primary key,
    event_title varchar(100) not null,
    sport_type varchar(50) not null,
    event_date date not null,
    start_time time not null,
    end_time time not null,
    max_players int not null,
    created_by_user_id int not null,
    venue_id int not null,

    foreign key (created_by_user_id)
        references user(user_id)
        on delete restrict
        on update cascade,

    foreign key (venue_id)
        references venue(venue_id)
        on delete restrict
        on update cascade,

    constraint chk_event_players
        check (max_players > 0),

    constraint chk_event_time
        check (end_time > start_time)
);

-- 5. booking table

create table booking (
    booking_id int auto_increment primary key,
    booking_date date not null,
    booking_time time not null,
    duration int not null,
    amount decimal(10,2) not null,
    status varchar(20) not null default 'pending',
    venue_id int not null,

    foreign key (venue_id)
        references venue(venue_id)
        on delete restrict
        on update cascade,

    constraint chk_booking_duration
        check (duration > 0),

    constraint chk_booking_amount
        check (amount >= 0),

    constraint chk_booking_status
        check (status in ('pending', 'confirmed', 'cancelled'))
);

-- 6. team table

create table team (
    team_id int auto_increment primary key,
    name varchar(100) not null,
    logo mediumblob
);

-- 7. team_member table

create table team_member (
    team_id int not null,
    user_id int not null,
    role varchar(50) not null,

    primary key (team_id, user_id),

    foreign key (team_id)
        references team(team_id)
        on delete cascade
        on update cascade,

    foreign key (user_id)
        references user(user_id)
        on delete cascade
        on update cascade
);

-- 8. match table

create table `match` (
    match_id int auto_increment primary key,
    match_date date not null,
    status varchar(20) not null default 'scheduled',
    event_id int not null,
    team1_id int not null,
    team2_id int not null,

    foreign key (event_id)
        references event(event_id)
        on delete restrict
        on update cascade,

    foreign key (team1_id)
        references team(team_id)
        on delete restrict
        on update cascade,

    foreign key (team2_id)
        references team(team_id)
        on delete restrict
        on update cascade,

    constraint chk_match_status
        check (status in ('scheduled', 'ongoing', 'completed', 'cancelled'))
);

-- 9. stat_type table

create table stat_type (
    type_id int auto_increment primary key,
    name varchar(100) not null unique,
    description varchar(255)
);

-- 10. player_stat table

create table player_stat (
    stat_id int auto_increment primary key,
    value int not null,
    match_id int not null,
    type_id int not null,
    user_id int not null,

    foreign key (match_id)
        references `match`(match_id)
        on delete cascade
        on update cascade,

    foreign key (type_id)
        references stat_type(type_id)
        on delete restrict
        on update cascade,

    foreign key (user_id)
        references user(user_id)
        on delete restrict
        on update cascade,

    constraint chk_stat_value
        check (value >= 0)
);

-- 11. waitlist table

create table waitlist (
    waitlist_id int auto_increment primary key,
    user_id int not null,
    event_id int not null,
    joined_time datetime not null default current_timestamp,
    status varchar(20) not null default 'waiting',

    foreign key (user_id)
        references user(user_id)
        on delete cascade
        on update cascade,

    foreign key (event_id)
        references event(event_id)
        on delete cascade
        on update cascade,

    constraint uq_waitlist_user_event
        unique (user_id, event_id),

    constraint chk_waitlist_status
        check (status in ('waiting', 'promoted', 'cancelled'))
);

