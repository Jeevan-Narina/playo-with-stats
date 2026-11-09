use playo_db;

-- query 1: display bookings with venue details using inner join

select
    b.booking_id,
    v.name as venue_name,
    v.address,
    b.booking_date,
    b.booking_time,
    b.duration,
    b.amount,
    b.status
from booking b
inner join venue v on b.venue_id = v.venue_id
order by b.booking_date, b.booking_time;


-- query 2: total bookings and revenue for each venue

select
    v.venue_id,
    v.name as venue_name,
    count(b.booking_id) as total_bookings,
    coalesce(sum(
        case
            when b.status = 'confirmed' then b.amount
            else 0
        end
    ), 0) as total_revenue
from venue v
left join booking b on v.venue_id = b.venue_id
group by v.venue_id, v.name
order by total_revenue desc;

-- query 3: venues with more than one confirmed booking

select
    v.venue_id,
    v.name as venue_name,
    count(b.booking_id) as confirmed_bookings
from venue v
join booking b on v.venue_id = b.venue_id
where b.status = 'confirmed'
group by v.venue_id, v.name
having count(b.booking_id) > 1
order by confirmed_bookings desc;

-- query 4: venues priced above the average hourly rate

select
    venue_id,
    name as venue_name,
    price,
    type
from venue
where price > (
    select avg(price)
    from venue
)
order by price desc;


-- query 5: users who created more than one event
-- demonstrates a correlated subquery

select
    u.user_id,
    u.name as organizer_name,
    (
        select count(*)
        from event e
        where e.created_by_user_id = u.user_id
    ) as total_events
from user u
where (
    select count(*)
    from event e
    where e.created_by_user_id = u.user_id
) > 1
order by total_events desc, u.user_id;



-- query 7: teams that have not participated in any match
-- not exists

select
    t.team_id,
    t.name as team_name
from team t
where not exists (
    select 1
    from `match` m
    where m.team1_id = t.team_id
       or m.team2_id = t.team_id
)
order by t.team_id;


-- query 8: match details with both participating teams
-- multiple joins

select
    m.match_id,
    e.event_title,
    e.sport_type,
    m.match_date,
    t1.name as team1_name,
    t2.name as team2_name,
    m.status
from `match` m
join event e on m.event_id = e.event_id
join team t1 on m.team1_id = t1.team_id
join team t2 on m.team2_id = t2.team_id
order by m.match_id;


-- query 9: average confirmed booking amount by sport
-- avg and group by

select
    v.type as sport_type,
    count(b.booking_id) as total_bookings,
    round(avg(b.amount), 2) as average_booking_amount
from booking b
join venue v on b.venue_id = v.venue_id
where b.status = 'confirmed'
group by v.type
order by average_booking_amount desc;


-- query 10: list all available sports
-- distinct

select distinct
    type as sport_type
from venue
order by sport_type;


-- query 11: bookings within a selected date range
-- between

select
    b.booking_id,
    v.name as venue_name,
    b.booking_date,
    b.booking_time,
    b.amount,
    b.status
from booking b
join venue v on b.venue_id = v.venue_id
where b.booking_date between '2026-11-14' and '2026-11-20'
order by b.booking_date, b.booking_time;


-- query 12: search venues in whitefield
-- like

select
    venue_id,
    name,
    address,
    price,
    type
from venue
where address like '%whitefield%'
order by price;


-- query 13: find football and cricket events
-- in operator

select
    event_id,
    event_title,
    sport_type,
    event_date,
    max_players
from event
where sport_type in ('football', 'cricket')
order by event_date;


-- query 14: categorize venues based on hourly price
-- case expression

select
    venue_id,
    name,
    price,
    case
        when price < 700 then 'budget'
        when price <= 1200 then 'standard'
        else 'premium'
    end as price_category
from venue
order by price;


-- query 15: list users who are team captains or event organizers
-- union

select
    u.user_id,
    u.name,
    'team captain' as user_role
from user u
join team_member tm on u.user_id = tm.user_id
where tm.role = 'captain'

union

select
    u.user_id,
    u.name,
    'event organizer' as user_role
from user u
join event e on u.user_id = e.created_by_user_id

order by user_id, user_role;


-- query 16: find venues with the highest hourly price
-- max with subquery

select
    venue_id,
    name,
    price,
    type
from venue
where price = (
    select max(price)
    from venue
);


-- query 17: number of players in each team
-- left join and group by

select
    t.team_id,
    t.name as team_name,
    count(tm.user_id) as total_players
from team t
left join team_member tm on t.team_id = tm.team_id
group by t.team_id, t.name
order by total_players desc, t.team_id;


-- query 18: total statistics for each player
-- sum and group by

select
    u.user_id,
    u.name as player_name,
    st.name as stat_type,
    sum(ps.value) as total_value
from player_stat ps
join user u on ps.user_id = u.user_id
join stat_type st on ps.type_id = st.type_id
group by u.user_id, u.name, st.type_id, st.name
order by u.user_id, st.name;


-- query 19: show users currently waiting for events
-- multiple joins with where

select
    w.waitlist_id,
    u.name as user_name,
    e.event_title,
    w.joined_time,
    w.status
from waitlist w
join user u on w.user_id = u.user_id
join event e on w.event_id = e.event_id
where w.status = 'waiting'
order by w.joined_time, w.waitlist_id;


-- query 20: rank venues by total confirmed booking value
-- window function

select
    v.venue_id,
    v.name as venue_name,
    coalesce(sum(b.amount), 0) as total_booking_value,
    dense_rank() over (
        order by coalesce(sum(b.amount), 0) desc
    ) as revenue_rank
from venue v
left join booking b
    on v.venue_id = b.venue_id
   and b.status = 'confirmed'
group by v.venue_id, v.name
order by revenue_rank, v.venue_id;