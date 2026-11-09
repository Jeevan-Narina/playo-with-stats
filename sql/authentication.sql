
create table if not exists user_auth (
    user_id int primary key,
    password_hash varchar(255) not null,
    created_at timestamp default current_timestamp,
    constraint fk_user_auth_user
        foreign key (user_id)
        references user(user_id)
        on delete cascade
        on update cascade
);
