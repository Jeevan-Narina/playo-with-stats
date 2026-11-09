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
-- Dumping data for table `venue`
--

LOCK TABLES `venue` WRITE;
/*!40000 ALTER TABLE `venue` DISABLE KEYS */;
INSERT INTO `venue` (`venue_id`, `name`, `address`, `price`, `type`) VALUES (1,'smash badminton arena','whitefield, bangalore',500.00,'badminton'),(2,'champions football turf','koramangala, bangalore',1200.00,'football'),(3,'powerplay cricket ground','electronic city, bangalore',1500.00,'cricket'),(4,'ace tennis academy','indiranagar, bangalore',700.00,'tennis'),(5,'hoop basketball court','hsr layout, bangalore',800.00,'basketball'),(6,'victory volleyball arena','jayanagar, bangalore',600.00,'volleyball'),(7,'elite badminton courts','marathahalli, bangalore',450.00,'badminton'),(8,'strikers football ground','sarjapur road, bangalore',1100.00,'football'),(9,'super six cricket turf','bellandur, bangalore',1300.00,'cricket'),(10,'pro tennis court','malleshwaram, bangalore',650.00,'tennis'),(11,'falcon sports arena','hebbal, bangalore',950.00,'football'),(12,'shuttle masters court','btm layout, bangalore',550.00,'badminton'),(13,'royal cricket academy','yelahanka, bangalore',1400.00,'cricket'),(14,'urban basketball arena','rajajinagar, bangalore',750.00,'basketball'),(15,'grand slam tennis court','banashankari, bangalore',800.00,'tennis'),(16,'kickoff football turf','brookefield, bangalore',1250.00,'football'),(17,'champion badminton hub','jp nagar, bangalore',500.00,'badminton'),(18,'greenfield cricket ground','kr puram, bangalore',1600.00,'cricket'),(19,'spike volleyball court','basavanagudi, bangalore',650.00,'volleyball'),(20,'sports united arena','mahadevapura, bangalore',900.00,'football');
/*!40000 ALTER TABLE `venue` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `venue_court`
--

LOCK TABLES `venue_court` WRITE;
/*!40000 ALTER TABLE `venue_court` DISABLE KEYS */;
INSERT INTO `venue_court` (`court_id`, `venue_id`, `court_name`, `is_active`) VALUES (1,1,'Court 3',1),(2,1,'Court 2',1),(3,1,'Court 1',1),(4,2,'Court 3',1),(5,2,'Court 2',1),(6,2,'Court 1',1),(7,3,'Court 3',1),(8,3,'Court 2',1),(9,3,'Court 1',1),(10,4,'Court 3',1),(11,4,'Court 2',1),(12,4,'Court 1',1),(13,5,'Court 3',1),(14,5,'Court 2',1),(15,5,'Court 1',1),(16,6,'Court 3',1),(17,6,'Court 2',1),(18,6,'Court 1',1),(19,7,'Court 3',1),(20,7,'Court 2',1),(21,7,'Court 1',1),(22,8,'Court 3',1),(23,8,'Court 2',1),(24,8,'Court 1',1),(25,9,'Court 3',1),(26,9,'Court 2',1),(27,9,'Court 1',1),(28,10,'Court 3',1),(29,10,'Court 2',1),(30,10,'Court 1',1),(31,11,'Court 3',1),(32,11,'Court 2',1),(33,11,'Court 1',1),(34,12,'Court 3',1),(35,12,'Court 2',1),(36,12,'Court 1',1),(37,13,'Court 3',1),(38,13,'Court 2',1),(39,13,'Court 1',1),(40,14,'Court 3',1),(41,14,'Court 2',1),(42,14,'Court 1',1),(43,15,'Court 3',1),(44,15,'Court 2',1),(45,15,'Court 1',1),(46,16,'Court 3',1),(47,16,'Court 2',1),(48,16,'Court 1',1),(49,17,'Court 3',1),(50,17,'Court 2',1),(51,17,'Court 1',1),(52,18,'Court 3',1),(53,18,'Court 2',1),(54,18,'Court 1',1),(55,19,'Court 3',1),(56,19,'Court 2',1),(57,19,'Court 1',1),(58,20,'Court 3',1),(59,20,'Court 2',1),(60,20,'Court 1',1);
/*!40000 ALTER TABLE `venue_court` ENABLE KEYS */;
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
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-10  2:21:43
