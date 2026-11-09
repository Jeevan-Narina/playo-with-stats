use playo_db;

delimiter //

-- procedure 1: concurrency-safe venue booking
-- validates booking details, prevents overlapping reservations,
-- calculates the amount, and uses transaction-level locking

create procedure sp_create_booking(
    in p_venue_id int,
    in p_booking_date date,
    in p_booking_time time,
    in p_duration int
)
begin
    declare v_price decimal(10,2) default null;
    declare v_amount decimal(10,2);

    declare exit handler for sqlexception
    begin
        rollback;
        resignal;
    end;

    -- validate booking details
    if p_venue_id is null
       or p_booking_date is null
       or p_booking_time is null
       or p_duration is null
       or p_duration <= 0
       or p_duration > 1439
       or time_to_sec(p_booking_time) + p_duration * 60 > 86400
       or p_booking_date < current_date()
    then
        signal sqlstate '45000'
        set message_text = 'invalid booking details';
    end if;

    -- begin transaction
    start transaction;

    -- lock the selected venue row
    select price into v_price
    from venue
    where venue_id = p_venue_id
    for update;

    if v_price is null then
        signal sqlstate '45000'
        set message_text = 'venue does not exist';
    end if;

    -- check for overlapping bookings
    if exists (
        select 1
        from booking
        where venue_id = p_venue_id
          and booking_date = p_booking_date
          and status in ('pending', 'confirmed')
          and p_booking_time <
              addtime(booking_time, sec_to_time(duration * 60))
          and addtime(p_booking_time, sec_to_time(p_duration * 60))
              > booking_time
    ) then
        signal sqlstate '45000'
        set message_text = 'venue already booked for this time slot';
    end if;

    -- calculate amount using hourly venue price
    set v_amount = round(v_price * p_duration / 60, 2);

    -- insert confirmed booking
    insert into booking
        (booking_date, booking_time, duration, amount, status, venue_id)
    values
        (p_booking_date, p_booking_time, p_duration,
         v_amount, 'confirmed', p_venue_id);

    -- save the transaction and release the lock
    commit;
end//

delimiter ;
-- procedure 2: promote the earliest waiting user
-- call only after confirming an available event slot

drop procedure if exists sp_promote_waitlist;

delimiter //

create procedure sp_promote_waitlist(
    in p_event_id int
)
begin
    declare v_event_id int default null;
    declare v_waitlist_id int default null;

    declare exit handler for sqlexception
    begin
        rollback;
        resignal;
    end;

    start transaction;

    -- lock the event to serialize promotions
    select event_id into v_event_id
    from event
    where event_id = p_event_id
    for update;

    if v_event_id is null then
        signal sqlstate '45000'
        set message_text = 'event does not exist';
    end if;

    -- identify the earliest waiting user
    select waitlist_id into v_waitlist_id
    from waitlist
    where event_id = p_event_id
      and status = 'waiting'
    order by joined_time, waitlist_id
    limit 1
    for update;

    if v_waitlist_id is null then
        signal sqlstate '45000'
        set message_text = 'no waiting users for this event';
    end if;

    update waitlist
    set status = 'promoted'
    where waitlist_id = v_waitlist_id
      and status = 'waiting';

    commit;

    select v_waitlist_id as promoted_waitlist_id;
end //

delimiter ;
