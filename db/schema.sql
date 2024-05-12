create table users (
  id       serial primary key,
  username text   not null,
  password text   not null
);

create table quincenas (
  id         serial primary key,
  user_id    int    not null,
  start_date date   not null,
  available  decimal not null,

  foreign key (user_id) references users (id)
);

create table payments (
  id          serial  primary key,
  quincena_id int     not null,
  description text    not null,
  amount      decimal not null,
  fulfilled   boolean not null default FALSE,

  foreign key (quincena_id) references quincenas (id)
);
