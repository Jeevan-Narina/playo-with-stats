use playo_db;

-- view 1: booking details with venue information
create view vw_booking_details as
select
    b.booking_id,
    v.name as venue_name,
    v.address as venue_address,
    v.type as sport_type,
    b.booking_date,
    b.booking_time,
    b.duration,
    b.amount,
    b.status
from booking b
join venue v on b.venue_id = v.venue_id;


-- view 2: event details with organizer and venue information
create view vw_event_details as
select
    e.event_id,
    e.event_title,
    e.sport_type,
    e.event_date,
    e.start_time,
    e.end_time,
    e.max_players,
    u.name as organizer_name,
    v.name as venue_name,
    v.address as venue_address
from event e
join user u on e.created_by_user_id = u.user_id
join venue v on e.venue_id = v.venue_id;


-- view 3: player statistics with match and sport information
create view vw_player_statistics as
select
    ps.stat_id,
    u.user_id,
    u.name as player_name,
    m.match_id,
    e.event_title,
    e.sport_type,
    m.match_date,
    st.name as stat_type,
    ps.value
from player_stat ps
join user u on ps.user_id = u.user_id
join `match` m on ps.match_id = m.match_id
join event e on m.event_id = e.event_id
join stat_type st on ps.type_id = st.type_id;