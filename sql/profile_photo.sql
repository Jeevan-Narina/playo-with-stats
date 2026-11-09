alter table user
modify column profile_photo mediumblob null;

alter table user
add column profile_photo_type varchar(50) null;