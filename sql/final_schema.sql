-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: playo_db
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `booking`
--

DROP TABLE IF EXISTS `booking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `booking` (
  `booking_id` int NOT NULL AUTO_INCREMENT,
  `booking_date` date NOT NULL,
  `booking_time` time NOT NULL,
  `duration` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `venue_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `court_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`booking_id`),
  KEY `venue_id` (`venue_id`),
  KEY `fk_booking_user` (`user_id`),
  KEY `fk_booking_court` (`court_id`),
  CONSTRAINT `booking_ibfk_1` FOREIGN KEY (`venue_id`) REFERENCES `venue` (`venue_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_booking_court` FOREIGN KEY (`court_id`) REFERENCES `venue_court` (`court_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_booking_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_booking_amount` CHECK ((`amount` >= 0)),
  CONSTRAINT `chk_booking_duration` CHECK ((`duration` > 0)),
  CONSTRAINT `chk_booking_status` CHECK ((`status` in (_utf8mb4'pending',_utf8mb4'confirmed',_utf8mb4'cancelled')))
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_booking_conflict_insert` BEFORE INSERT ON `booking` FOR EACH ROW begin
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
end */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_booking_conflict_update` BEFORE UPDATE ON `booking` FOR EACH ROW begin
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
end */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `event`
--

DROP TABLE IF EXISTS `event`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event` (
  `event_id` int NOT NULL AUTO_INCREMENT,
  `event_title` varchar(100) NOT NULL,
  `sport_type` varchar(50) NOT NULL,
  `event_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `max_players` int NOT NULL,
  `created_by_user_id` int NOT NULL,
  `venue_id` int NOT NULL,
  PRIMARY KEY (`event_id`),
  KEY `created_by_user_id` (`created_by_user_id`),
  KEY `venue_id` (`venue_id`),
  CONSTRAINT `event_ibfk_1` FOREIGN KEY (`created_by_user_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `event_ibfk_2` FOREIGN KEY (`venue_id`) REFERENCES `venue` (`venue_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_event_players` CHECK ((`max_players` > 0)),
  CONSTRAINT `chk_event_time` CHECK ((`end_time` > `start_time`))
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `event_registration`
--

DROP TABLE IF EXISTS `event_registration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_registration` (
  `registration_id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `user_id` int NOT NULL,
  `registered_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(20) NOT NULL DEFAULT 'registered',
  PRIMARY KEY (`registration_id`),
  UNIQUE KEY `uq_event_registration` (`event_id`,`user_id`),
  KEY `fk_registration_user` (`user_id`),
  CONSTRAINT `fk_registration_event` FOREIGN KEY (`event_id`) REFERENCES `event` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_registration_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_registration_status` CHECK ((`status` in (_cp850'registered',_cp850'cancelled')))
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `match`
--

DROP TABLE IF EXISTS `match`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `match` (
  `match_id` int NOT NULL AUTO_INCREMENT,
  `match_date` date NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'scheduled',
  `event_id` int NOT NULL,
  `team1_id` int NOT NULL,
  `team2_id` int NOT NULL,
  PRIMARY KEY (`match_id`),
  KEY `event_id` (`event_id`),
  KEY `team1_id` (`team1_id`),
  KEY `team2_id` (`team2_id`),
  CONSTRAINT `match_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `event` (`event_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `match_ibfk_2` FOREIGN KEY (`team1_id`) REFERENCES `team` (`team_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `match_ibfk_3` FOREIGN KEY (`team2_id`) REFERENCES `team` (`team_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_match_status` CHECK ((`status` in (_cp850'scheduled',_cp850'ongoing',_cp850'completed',_cp850'cancelled')))
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_match_different_teams_insert` BEFORE INSERT ON `match` FOR EACH ROW begin
    if new.team1_id = new.team2_id then
        signal sqlstate '45000'
        set message_text = 'a team cannot play against itself';
    end if;
end */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_match_different_teams_update` BEFORE UPDATE ON `match` FOR EACH ROW begin
    if new.team1_id = new.team2_id then
        signal sqlstate '45000'
        set message_text = 'a team cannot play against itself';
    end if;
end */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `payment`
--

DROP TABLE IF EXISTS `payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `booking_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(30) NOT NULL,
  `payment_status` varchar(20) NOT NULL DEFAULT 'pending',
  `transaction_reference` varchar(100) DEFAULT NULL,
  `payment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `transaction_reference` (`transaction_reference`),
  KEY `fk_payment_booking` (`booking_id`),
  CONSTRAINT `fk_payment_booking` FOREIGN KEY (`booking_id`) REFERENCES `booking` (`booking_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_payment_amount` CHECK ((`amount` >= 0)),
  CONSTRAINT `chk_payment_method` CHECK ((`payment_method` in (_cp850'upi',_cp850'card',_cp850'netbanking',_cp850'wallet'))),
  CONSTRAINT `chk_payment_status` CHECK ((`payment_status` in (_cp850'pending',_cp850'success',_cp850'failed',_cp850'refunded')))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `player_stat`
--

DROP TABLE IF EXISTS `player_stat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `player_stat` (
  `stat_id` int NOT NULL AUTO_INCREMENT,
  `value` int NOT NULL,
  `match_id` int NOT NULL,
  `type_id` int NOT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`stat_id`),
  KEY `match_id` (`match_id`),
  KEY `type_id` (`type_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `player_stat_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `match` (`match_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `player_stat_ibfk_2` FOREIGN KEY (`type_id`) REFERENCES `stat_type` (`type_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `player_stat_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_stat_value` CHECK ((`value` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stat_type`
--

DROP TABLE IF EXISTS `stat_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stat_type` (
  `type_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`type_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `team`
--

DROP TABLE IF EXISTS `team`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team` (
  `team_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `logo` mediumblob,
  PRIMARY KEY (`team_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `team_member`
--

DROP TABLE IF EXISTS `team_member`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_member` (
  `team_id` int NOT NULL,
  `user_id` int NOT NULL,
  `role` varchar(50) NOT NULL,
  PRIMARY KEY (`team_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `team_member_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `team` (`team_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `team_member_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `profile_pic` mediumblob,
  `dob` date DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `profile_photo` mediumblob,
  `profile_photo_type` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  CONSTRAINT `chk_user_email` CHECK ((`email` like _utf8mb4'%_@_%._%'))
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_auth`
--

DROP TABLE IF EXISTS `user_auth`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_auth` (
  `user_id` int NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_user_auth_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_phone`
--

DROP TABLE IF EXISTS `user_phone`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_phone` (
  `user_id` int NOT NULL,
  `phone` varchar(15) NOT NULL,
  PRIMARY KEY (`user_id`,`phone`),
  CONSTRAINT `user_phone_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `venue`
--

DROP TABLE IF EXISTS `venue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `venue` (
  `venue_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `address` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `type` varchar(50) NOT NULL,
  PRIMARY KEY (`venue_id`),
  CONSTRAINT `chk_venue_price` CHECK ((`price` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `venue_court`
--

DROP TABLE IF EXISTS `venue_court`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `venue_court` (
  `court_id` int NOT NULL AUTO_INCREMENT,
  `venue_id` int NOT NULL,
  `court_name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`court_id`),
  UNIQUE KEY `uq_venue_court` (`venue_id`,`court_name`),
  CONSTRAINT `fk_court_venue` FOREIGN KEY (`venue_id`) REFERENCES `venue` (`venue_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `vw_booking_details`
--

DROP TABLE IF EXISTS `vw_booking_details`;
/*!50001 DROP VIEW IF EXISTS `vw_booking_details`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_booking_details` AS SELECT 
 1 AS `booking_id`,
 1 AS `venue_name`,
 1 AS `venue_address`,
 1 AS `sport_type`,
 1 AS `booking_date`,
 1 AS `booking_time`,
 1 AS `duration`,
 1 AS `amount`,
 1 AS `status`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_event_details`
--

DROP TABLE IF EXISTS `vw_event_details`;
/*!50001 DROP VIEW IF EXISTS `vw_event_details`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_event_details` AS SELECT 
 1 AS `event_id`,
 1 AS `event_title`,
 1 AS `sport_type`,
 1 AS `event_date`,
 1 AS `start_time`,
 1 AS `end_time`,
 1 AS `max_players`,
 1 AS `organizer_name`,
 1 AS `venue_name`,
 1 AS `venue_address`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `vw_player_statistics`
--

DROP TABLE IF EXISTS `vw_player_statistics`;
/*!50001 DROP VIEW IF EXISTS `vw_player_statistics`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_player_statistics` AS SELECT 
 1 AS `stat_id`,
 1 AS `user_id`,
 1 AS `player_name`,
 1 AS `match_id`,
 1 AS `event_title`,
 1 AS `sport_type`,
 1 AS `match_date`,
 1 AS `stat_type`,
 1 AS `value`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `waitlist`
--

DROP TABLE IF EXISTS `waitlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `waitlist` (
  `waitlist_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `event_id` int NOT NULL,
  `joined_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(20) NOT NULL DEFAULT 'waiting',
  PRIMARY KEY (`waitlist_id`),
  UNIQUE KEY `uq_waitlist_user_event` (`user_id`,`event_id`),
  KEY `event_id` (`event_id`),
  CONSTRAINT `waitlist_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `waitlist_ibfk_2` FOREIGN KEY (`event_id`) REFERENCES `event` (`event_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_waitlist_status` CHECK ((`status` in (_cp850'waiting',_cp850'promoted',_cp850'cancelled')))
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping events for database 'playo_db'
--

--
-- Dumping routines for database 'playo_db'
--
/*!50003 DROP FUNCTION IF EXISTS `fn_calculate_booking_amount` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `fn_calculate_booking_amount`(
    p_venue_id int,
    p_duration int
) RETURNS decimal(10,2)
    READS SQL DATA
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
end ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `fn_get_player_total_stat` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `fn_get_player_total_stat`(
    p_user_id int,
    p_type_id int
) RETURNS int
    READS SQL DATA
begin
    declare v_total int default 0;

    select coalesce(sum(value), 0)
    into v_total
    from player_stat
    where user_id = p_user_id
      and type_id = p_type_id;

    return v_total;
end ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_cancel_event_registration` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_cancel_event_registration`(
    in p_event_id int,
    in p_user_id int
)
begin
    declare v_event_id int default null;

    declare exit handler for sqlexception
    begin
        rollback;
        resignal;
    end;

    start transaction;

    select event_id into v_event_id
    from event
    where event_id = p_event_id
    for update;

    if v_event_id is null then
        signal sqlstate '45000'
        set message_text = 'event does not exist';
    end if;

    update event_registration
    set status = 'cancelled'
    where event_id = p_event_id
      and user_id = p_user_id
      and status = 'registered';

    if row_count() = 0 then
        signal sqlstate '45000'
        set message_text = 'active registration not found';
    end if;

    commit;
end ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_create_booking` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_create_booking`(
    IN p_user_id INT,
    IN p_venue_id INT,
    IN p_court_id INT,
    IN p_booking_date DATE,
    IN p_booking_time TIME,
    IN p_duration INT,
    OUT p_booking_id INT
)
BEGIN
    DECLARE v_price DECIMAL(10,2) DEFAULT NULL;
    DECLARE v_amount DECIMAL(10,2);
    DECLARE v_court_id INT DEFAULT NULL;
    DECLARE v_user_id INT DEFAULT NULL;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_user_id IS NULL
       OR p_venue_id IS NULL
       OR p_court_id IS NULL
       OR p_booking_date IS NULL
       OR p_booking_time IS NULL
       OR p_duration IS NULL
       OR p_duration <= 0
       OR p_duration > 1439
       OR TIME_TO_SEC(p_booking_time) + p_duration * 60 > 86400
       OR p_booking_date < CURRENT_DATE()
    THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid booking details';
    END IF;

    START TRANSACTION;

    SELECT user_id INTO v_user_id
    FROM `user`
    WHERE user_id = p_user_id;

    IF v_user_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User does not exist';
    END IF;

    SELECT price INTO v_price
    FROM venue
    WHERE venue_id = p_venue_id
    FOR UPDATE;

    IF v_price IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Venue does not exist';
    END IF;

    SELECT court_id INTO v_court_id
    FROM venue_court
    WHERE court_id = p_court_id
      AND venue_id = p_venue_id
      AND is_active = TRUE;

    IF v_court_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid or unavailable court';
    END IF;

    
    UPDATE booking
    SET status = 'expired'
    WHERE venue_id = p_venue_id
      AND status = 'pending'
      AND created_at <= NOW() - INTERVAL 15 MINUTE;

    
    IF EXISTS (
        SELECT 1
        FROM booking
        WHERE court_id = p_court_id
          AND booking_date = p_booking_date
          AND status IN ('pending', 'confirmed')
          AND p_booking_time <
              ADDTIME(booking_time, SEC_TO_TIME(duration * 60))
          AND ADDTIME(
              p_booking_time,
              SEC_TO_TIME(p_duration * 60)
          ) > booking_time
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Court already booked for this time slot';
    END IF;

    SET v_amount = ROUND(v_price * p_duration / 60, 2);

    INSERT INTO booking (
        booking_date,
        booking_time,
        duration,
        amount,
        status,
        venue_id,
        user_id,
        court_id
    )
    VALUES (
        p_booking_date,
        p_booking_time,
        p_duration,
        v_amount,
        'pending',
        p_venue_id,
        p_user_id,
        p_court_id
    );

    SET p_booking_id = LAST_INSERT_ID();

    COMMIT;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_join_event_waitlist` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_join_event_waitlist`(
    in p_event_id int,
    in p_user_id int
)
begin
    declare v_capacity int default null;
    declare v_registered int default 0;
    declare v_existing_status varchar(20) default null;

    declare exit handler for sqlexception
    begin
        rollback;
        resignal;
    end;

    start transaction;

    select max_players into v_capacity
    from event
    where event_id = p_event_id
    for update;

    if v_capacity is null then
        signal sqlstate '45000'
        set message_text = 'event does not exist';
    end if;

    if exists (
        select 1 from event_registration
        where event_id = p_event_id
          and user_id = p_user_id
          and status = 'registered'
    ) then
        signal sqlstate '45000'
        set message_text = 'user already registered';
    end if;

    select count(*) into v_registered
    from event_registration
    where event_id = p_event_id
      and status = 'registered';

    if v_registered < v_capacity then
        signal sqlstate '45000'
        set message_text = 'event has available slots';
    end if;

    select max(status) into v_existing_status
    from waitlist
    where event_id = p_event_id
      and user_id = p_user_id;

    if v_existing_status = 'waiting' then
        signal sqlstate '45000'
        set message_text = 'user already on waitlist';
    end if;

    if v_existing_status is not null then
        update waitlist
        set status = 'waiting',
            joined_time = current_timestamp
        where event_id = p_event_id
          and user_id = p_user_id;
    else
        insert into waitlist (event_id, user_id, status)
        values (p_event_id, p_user_id, 'waiting');
    end if;

    commit;
end ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_promote_waitlist` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_promote_waitlist`(
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

    
    select event_id into v_event_id
    from event
    where event_id = p_event_id
    for update;

    if v_event_id is null then
        signal sqlstate '45000'
        set message_text = 'event does not exist';
    end if;

    
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
end ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_register_for_event` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = cp850 */ ;
/*!50003 SET character_set_results = cp850 */ ;
/*!50003 SET collation_connection  = cp850_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_register_for_event`(
    in p_event_id int,
    in p_user_id int
)
begin
    declare v_capacity int default null;
    declare v_registered int default 0;
    declare v_existing_status varchar(20) default null;

    declare exit handler for sqlexception
    begin
        rollback;
        resignal;
    end;

    start transaction;

    select max_players into v_capacity
    from event
    where event_id = p_event_id
    for update;

    if v_capacity is null then
        signal sqlstate '45000'
        set message_text = 'event does not exist';
    end if;

    select count(*) into v_registered
    from event_registration
    where event_id = p_event_id
      and status = 'registered';

    if v_registered >= v_capacity then
        signal sqlstate '45000'
        set message_text = 'event is full';
    end if;

    select max(status) into v_existing_status
    from event_registration
    where event_id = p_event_id
      and user_id = p_user_id;

    if v_existing_status = 'registered' then
        signal sqlstate '45000'
        set message_text = 'user already registered';
    end if;

    if v_existing_status = 'cancelled' then
        update event_registration
        set status = 'registered',
            registered_at = current_timestamp
        where event_id = p_event_id
          and user_id = p_user_id;
    else
        insert into event_registration (event_id, user_id)
        values (p_event_id, p_user_id);
    end if;

    commit;
end ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Final view structure for view `vw_booking_details`
--

/*!50001 DROP VIEW IF EXISTS `vw_booking_details`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_booking_details` AS select `b`.`booking_id` AS `booking_id`,`v`.`name` AS `venue_name`,`v`.`address` AS `venue_address`,`v`.`type` AS `sport_type`,`b`.`booking_date` AS `booking_date`,`b`.`booking_time` AS `booking_time`,`b`.`duration` AS `duration`,`b`.`amount` AS `amount`,`b`.`status` AS `status` from (`booking` `b` join `venue` `v` on((`b`.`venue_id` = `v`.`venue_id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vw_event_details`
--

/*!50001 DROP VIEW IF EXISTS `vw_event_details`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_event_details` AS select `e`.`event_id` AS `event_id`,`e`.`event_title` AS `event_title`,`e`.`sport_type` AS `sport_type`,`e`.`event_date` AS `event_date`,`e`.`start_time` AS `start_time`,`e`.`end_time` AS `end_time`,`e`.`max_players` AS `max_players`,`u`.`name` AS `organizer_name`,`v`.`name` AS `venue_name`,`v`.`address` AS `venue_address` from ((`event` `e` join `user` `u` on((`e`.`created_by_user_id` = `u`.`user_id`))) join `venue` `v` on((`e`.`venue_id` = `v`.`venue_id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `vw_player_statistics`
--

/*!50001 DROP VIEW IF EXISTS `vw_player_statistics`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_player_statistics` AS select `ps`.`stat_id` AS `stat_id`,`u`.`user_id` AS `user_id`,`u`.`name` AS `player_name`,`m`.`match_id` AS `match_id`,`e`.`event_title` AS `event_title`,`e`.`sport_type` AS `sport_type`,`m`.`match_date` AS `match_date`,`st`.`name` AS `stat_type`,`ps`.`value` AS `value` from ((((`player_stat` `ps` join `user` `u` on((`ps`.`user_id` = `u`.`user_id`))) join `match` `m` on((`ps`.`match_id` = `m`.`match_id`))) join `event` `e` on((`m`.`event_id` = `e`.`event_id`))) join `stat_type` `st` on((`ps`.`type_id` = `st`.`type_id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-10  2:18:42
