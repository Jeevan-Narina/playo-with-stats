use playo_db;

delimiter //

-- trigger 1: prevent inserting matches with identical teams
create trigger trg_match_different_teams_insert
before insert on `match`
for each row
begin
    if new.team1_id = new.team2_id then
        signal sqlstate '45000'
        set message_text = 'a team cannot play against itself';
    end if;
end//

-- trigger 2: prevent updating matches with identical teams
create trigger trg_match_different_teams_update
before update on `match`
for each row
begin
    if new.team1_id = new.team2_id then
        signal sqlstate '45000'
        set message_text = 'a team cannot play against itself';
    end if;
end//

-- trigger 3: prevent inserting overlapping venue bookings
create trigger trg_booking_conflict_insert
before insert on booking
for each row
begin
    if new.status in ('pending', 'confirmed')
       and exists (
           select 1
           from booking b
           where b.venue_id = new.venue_id
             and b.booking_date = new.booking_date
             and b.status in ('pending', 'confirmed')
             and new.booking_time < addtime(b.booking_time, sec_to_time(b.duration * 60))
             and addtime(new.booking_time, sec_to_time(new.duration * 60)) > b.booking_time
       )
    then
        signal sqlstate '45000'
        set message_text = 'venue already booked for this time slot';
    end if;
end//

-- trigger 4: prevent updating bookings to overlapping time slots
create trigger trg_booking_conflict_update
before update on booking
for each row
begin
    if new.status in ('pending', 'confirmed')
       and exists (
           select 1
           from booking b
           where b.booking_id <> old.booking_id
             and b.venue_id = new.venue_id
             and b.booking_date = new.booking_date
             and b.status in ('pending', 'confirmed')
             and new.booking_time < addtime(b.booking_time, sec_to_time(b.duration * 60))
             and addtime(new.booking_time, sec_to_time(new.duration * 60)) > b.booking_time
       )
    then
        signal sqlstate '45000'
        set message_text = 'venue already booked for this time slot';
    end if;
end//

delimiter ;