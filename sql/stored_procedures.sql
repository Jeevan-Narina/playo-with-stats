use playo_db;

delimiter //

-- procedure 1: create a venue booking
-- validates inputs, checks availability and calculates the amount

create procedure sp_create_booking(
    in p_venue_id int,
    in p_booking_date date,
    in p_booking_time time,
    in p_duration int
)
begin
    declare v_price decimal(10,2);
    declare v_amount decimal(10,2);

    if p_duration is null
       or p_duration <= 0
       or p_booking_time is null
       or p_booking_date is null
       or p_duration > 1439
       or time_to_sec(p_booking_time) + p_duration * 60 > 86400
    then
        signal sqlstate '45000'
        set message_text = 'invalid booking date, time or duration';
    end if;

    select price into v_price
    from venue
    where venue_id = p_venue_id;

    if v_price is null then
        signal sqlstate '45000'
        set message_text = 'venue does not exist';
    end if;

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

    set v_amount = round(v_price * p_duration / 60, 2);

    insert into booking
        (booking_date, booking_time, duration, amount, status, venue_id)
    values
        (p_booking_date, p_booking_time, p_duration,
         v_amount, 'confirmed', p_venue_id);
end//

delimiter ;