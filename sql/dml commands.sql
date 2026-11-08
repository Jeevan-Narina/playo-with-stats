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
-- Dumping data for table `booking`
--

LOCK TABLES `booking` WRITE;
/*!40000 ALTER TABLE `booking` DISABLE KEYS */;
INSERT INTO `booking` (`booking_id`, `booking_date`, `booking_time`, `duration`, `amount`, `status`, `venue_id`) VALUES (1,'2026-11-14','08:00:00',120,1000.00,'confirmed',1),(2,'2026-11-15','17:00:00',120,2400.00,'confirmed',2),(3,'2026-11-15','09:00:00',180,4500.00,'confirmed',3),(4,'2026-11-16','07:00:00',120,1400.00,'confirmed',4),(5,'2026-11-17','16:00:00',120,1600.00,'confirmed',5),(6,'2026-11-18','15:00:00',120,1200.00,'confirmed',6),(7,'2026-11-19','18:00:00',120,900.00,'confirmed',7),(8,'2026-11-20','17:00:00',120,2200.00,'confirmed',8),(9,'2026-11-21','08:00:00',180,3900.00,'confirmed',9),(10,'2026-11-22','07:00:00',120,1300.00,'confirmed',10),(11,'2026-11-23','16:00:00',120,1900.00,'confirmed',11),(12,'2026-11-24','08:00:00',120,1100.00,'confirmed',12),(13,'2026-11-25','09:00:00',180,4200.00,'confirmed',13),(14,'2026-11-26','17:00:00',120,1500.00,'confirmed',14),(15,'2026-11-27','07:00:00',120,1600.00,'confirmed',15),(16,'2026-11-28','18:00:00',120,2500.00,'confirmed',16),(17,'2026-11-29','08:00:00',120,1000.00,'confirmed',17),(18,'2026-11-30','09:00:00',180,4800.00,'confirmed',18),(19,'2026-12-01','16:00:00',120,1300.00,'confirmed',19),(20,'2026-12-02','17:00:00',120,1800.00,'confirmed',20);
/*!40000 ALTER TABLE `booking` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `event`
--

LOCK TABLES `event` WRITE;
/*!40000 ALTER TABLE `event` DISABLE KEYS */;
INSERT INTO `event` (`event_id`, `event_title`, `sport_type`, `event_date`, `start_time`, `end_time`, `max_players`, `created_by_user_id`, `venue_id`) VALUES (1,'weekend badminton challenge','badminton','2026-11-14','08:00:00','10:00:00',8,1,1),(2,'koramangala football cup','football','2026-11-15','17:00:00','19:00:00',14,2,2),(3,'sunday cricket showdown','cricket','2026-11-15','09:00:00','12:00:00',22,3,3),(4,'indiranagar tennis open','tennis','2026-11-16','07:00:00','09:00:00',4,4,4),(5,'hsr basketball league','basketball','2026-11-17','16:00:00','18:00:00',10,5,5),(6,'jayanagar volleyball cup','volleyball','2026-11-18','15:00:00','17:00:00',12,6,6),(7,'marathahalli shuttle clash','badminton','2026-11-19','18:00:00','20:00:00',8,7,7),(8,'sarjapur football showdown','football','2026-11-20','17:00:00','19:00:00',14,8,8),(9,'bellandur cricket bash','cricket','2026-11-21','08:00:00','11:00:00',22,9,9),(10,'malleshwaram tennis cup','tennis','2026-11-22','07:00:00','09:00:00',4,10,10),(11,'hebbal football tournament','football','2026-11-23','16:00:00','18:00:00',14,1,11),(12,'btm badminton championship','badminton','2026-11-24','08:00:00','10:00:00',8,2,12),(13,'yelahanka cricket league','cricket','2026-11-25','09:00:00','12:00:00',22,3,13),(14,'rajajinagar basketball cup','basketball','2026-11-26','17:00:00','19:00:00',10,4,14),(15,'banashankari tennis battle','tennis','2026-11-27','07:00:00','09:00:00',4,5,15),(16,'brookefield football derby','football','2026-11-28','18:00:00','20:00:00',14,6,16),(17,'jp nagar badminton league','badminton','2026-11-29','08:00:00','10:00:00',8,7,17),(18,'kr puram cricket challenge','cricket','2026-11-30','09:00:00','12:00:00',22,8,18),(19,'basavanagudi volleyball match','volleyball','2026-12-01','16:00:00','18:00:00',12,9,19),(20,'mahadevapura football finals','football','2026-12-02','17:00:00','19:00:00',14,10,20);
/*!40000 ALTER TABLE `event` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `match`
--

LOCK TABLES `match` WRITE;
/*!40000 ALTER TABLE `match` DISABLE KEYS */;
INSERT INTO `match` (`match_id`, `match_date`, `status`, `event_id`, `team1_id`, `team2_id`) VALUES (1,'2026-11-14','completed',1,1,2),(2,'2026-11-15','completed',2,3,4),(3,'2026-11-15','completed',3,5,6),(4,'2026-11-16','scheduled',4,7,8),(5,'2026-11-17','scheduled',5,9,10),(6,'2026-11-18','scheduled',6,1,3),(7,'2026-11-19','scheduled',7,2,4),(8,'2026-11-20','scheduled',8,5,7),(9,'2026-11-21','scheduled',9,6,8),(10,'2026-11-22','scheduled',10,9,10);
/*!40000 ALTER TABLE `match` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `player_stat`
--

LOCK TABLES `player_stat` WRITE;
/*!40000 ALTER TABLE `player_stat` DISABLE KEYS */;
INSERT INTO `player_stat` (`stat_id`, `value`, `match_id`, `type_id`, `user_id`) VALUES (1,21,1,5,1),(2,4,1,7,1),(3,8,1,8,1),(4,15,1,5,2),(5,2,1,7,2),(6,5,1,8,2),(7,19,1,5,4),(8,3,1,7,4),(9,7,1,8,4),(10,17,1,5,5),(11,2,1,7,5),(12,6,1,8,5),(13,2,2,1,7),(14,1,2,2,7),(15,0,2,10,7),(16,1,2,1,8),(17,2,2,2,8),(18,3,2,10,8),(19,1,2,1,9),(20,1,2,2,9),(21,4,2,10,9),(22,0,2,1,10),(23,1,2,2,10),(24,2,2,10,10),(25,68,3,3,1),(26,2,3,4,1),(27,42,3,3,4),(28,1,3,4,4),(29,75,3,3,2),(30,3,3,4,2),(31,31,3,3,5),(32,2,3,4,5);
/*!40000 ALTER TABLE `player_stat` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `stat_type`
--

LOCK TABLES `stat_type` WRITE;
/*!40000 ALTER TABLE `stat_type` DISABLE KEYS */;
INSERT INTO `stat_type` (`type_id`, `name`, `description`) VALUES (1,'goals','number of goals scored in football'),(2,'assists','number of assists made by a player'),(3,'runs','number of runs scored in cricket'),(4,'wickets','number of wickets taken in cricket'),(5,'points','total points scored by a player'),(6,'rebounds','number of rebounds in basketball'),(7,'aces','number of successful service aces'),(8,'smashes','number of successful smashes in badminton'),(9,'blocks','number of successful blocks in volleyball'),(10,'saves','number of saves made by a goalkeeper');
/*!40000 ALTER TABLE `stat_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `team`
--

LOCK TABLES `team` WRITE;
/*!40000 ALTER TABLE `team` DISABLE KEYS */;
INSERT INTO `team` (`team_id`, `name`, `logo`) VALUES (1,'thunderbolts',NULL),(2,'phoenix warriors',NULL),(3,'royal titans',NULL),(4,'shadow strikers',NULL),(5,'storm breakers',NULL),(6,'blazing falcons',NULL),(7,'iron wolves',NULL),(8,'velocity united',NULL),(9,'crimson knights',NULL),(10,'apex legends',NULL);
/*!40000 ALTER TABLE `team` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `team_member`
--

LOCK TABLES `team_member` WRITE;
/*!40000 ALTER TABLE `team_member` DISABLE KEYS */;
INSERT INTO `team_member` (`team_id`, `user_id`, `role`) VALUES (1,1,'captain'),(1,2,'player'),(1,3,'player'),(2,4,'captain'),(2,5,'player'),(2,6,'player'),(3,7,'captain'),(3,8,'player'),(4,9,'captain'),(4,10,'player'),(5,1,'captain'),(5,4,'player'),(6,2,'captain'),(6,5,'player'),(7,3,'captain'),(7,6,'player'),(8,7,'captain'),(8,9,'player'),(9,8,'captain'),(10,10,'captain');
/*!40000 ALTER TABLE `team_member` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` (`user_id`, `name`, `email`, `profile_pic`, `dob`, `gender`) VALUES (1,'rahul sharma','rahul@example.com',NULL,'2002-05-15','male'),(2,'priya reddy','priya@example.com',NULL,'2003-08-22','female'),(3,'arjun kumar','arjun@example.com',NULL,'2001-12-10','male'),(4,'sneha patel','sneha@example.com',NULL,'2002-03-18','female'),(5,'kiran rao','kiran@example.com',NULL,'2003-07-25','male'),(6,'aditya varma','aditya@example.com',NULL,'2002-11-14','male'),(7,'ananya singh','ananya@example.com',NULL,'2003-02-09','female'),(8,'rohit nair','rohit@example.com',NULL,'2001-09-30','male'),(9,'meghana das','meghana@example.com',NULL,'2002-06-17','female'),(10,'vikram reddy','vikram@example.com',NULL,'2003-04-12','male');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `user_phone`
--

LOCK TABLES `user_phone` WRITE;
/*!40000 ALTER TABLE `user_phone` DISABLE KEYS */;
INSERT INTO `user_phone` (`user_id`, `phone`) VALUES (1,'9847261053'),(2,'9173058642'),(3,'8631947205'),(4,'9726184035'),(5,'8095731624'),(6,'9352047816'),(7,'8863175094'),(8,'7619423058'),(9,'9485306172'),(10,'8271659043');
/*!40000 ALTER TABLE `user_phone` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `venue`
--

LOCK TABLES `venue` WRITE;
/*!40000 ALTER TABLE `venue` DISABLE KEYS */;
INSERT INTO `venue` (`venue_id`, `name`, `address`, `price`, `type`) VALUES (1,'smash badminton arena','whitefield, bangalore',500.00,'badminton'),(2,'champions football turf','koramangala, bangalore',1200.00,'football'),(3,'powerplay cricket ground','electronic city, bangalore',1500.00,'cricket'),(4,'ace tennis academy','indiranagar, bangalore',700.00,'tennis'),(5,'hoop basketball court','hsr layout, bangalore',800.00,'basketball'),(6,'victory volleyball arena','jayanagar, bangalore',600.00,'volleyball'),(7,'elite badminton courts','marathahalli, bangalore',450.00,'badminton'),(8,'strikers football ground','sarjapur road, bangalore',1100.00,'football'),(9,'super six cricket turf','bellandur, bangalore',1300.00,'cricket'),(10,'pro tennis court','malleshwaram, bangalore',650.00,'tennis'),(11,'falcon sports arena','hebbal, bangalore',950.00,'football'),(12,'shuttle masters court','btm layout, bangalore',550.00,'badminton'),(13,'royal cricket academy','yelahanka, bangalore',1400.00,'cricket'),(14,'urban basketball arena','rajajinagar, bangalore',750.00,'basketball'),(15,'grand slam tennis court','banashankari, bangalore',800.00,'tennis'),(16,'kickoff football turf','brookefield, bangalore',1250.00,'football'),(17,'champion badminton hub','jp nagar, bangalore',500.00,'badminton'),(18,'greenfield cricket ground','kr puram, bangalore',1600.00,'cricket'),(19,'spike volleyball court','basavanagudi, bangalore',650.00,'volleyball'),(20,'sports united arena','mahadevapura, bangalore',900.00,'football');
/*!40000 ALTER TABLE `venue` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `waitlist`
--

LOCK TABLES `waitlist` WRITE;
/*!40000 ALTER TABLE `waitlist` DISABLE KEYS */;
INSERT INTO `waitlist` (`waitlist_id`, `user_id`, `event_id`, `joined_time`, `status`) VALUES (1,2,1,'2026-11-09 00:49:11','waiting'),(2,3,1,'2026-11-09 00:49:11','waiting'),(3,4,2,'2026-11-09 00:49:11','promoted'),(4,5,2,'2026-11-09 00:49:11','waiting'),(5,6,3,'2026-11-09 00:49:11','cancelled'),(6,7,3,'2026-11-09 00:49:11','waiting'),(7,8,4,'2026-11-09 00:49:11','promoted'),(8,9,5,'2026-11-09 00:49:11','waiting'),(9,10,6,'2026-11-09 00:49:11','waiting'),(10,1,7,'2026-11-09 00:49:11','cancelled'),(11,3,8,'2026-11-09 00:49:11','waiting'),(12,5,9,'2026-11-09 00:49:11','promoted'),(13,7,10,'2026-11-09 00:49:11','waiting'),(14,9,11,'2026-11-09 00:49:11','waiting'),(15,2,12,'2026-11-09 00:49:11','waiting');
/*!40000 ALTER TABLE `waitlist` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-09  0:54:04
