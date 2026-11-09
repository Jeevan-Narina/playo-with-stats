use playo_db;

delimiter //

-- function 1: calculate booking amount
-- calculates the cost using venue price and booking duration

create function fn_calculate_booking_amount(
    p_venue_id int,
    p_duration int
)
returns decimal(10,2)
reads sql data
begin
    declare v_price decimal(10,2) default null;

    if p_venue_id is null
       or p_duration is null
       or p_duration <= 0 then
        signal sqlstate '45000'
        set message_text = 'invalid venue or duration';
    end if;

    select price into v_price
    from venue
    where venue_id = p_venue_id;

    if v_price is null then
        signal sqlstate '45000'
        set message_text = 'venue does not exist';
    end if;

    return round(v_price * p_duration / 60, 2);
end//

-- function 2: calculate total player statistics
-- sums a player's selected statistic across all matches

create function fn_get_player_total_stat(
    p_user_id int,
    p_type_id int
)
returns int
reads sql data
begin
    declare v_total int default 0;

    select coalesce(sum(value), 0)
    into v_total
    from player_stat
    where user_id = p_user_id
      and type_id = p_type_id;

    return v_total;
end//

delimiter ;