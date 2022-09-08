CREATE DATABASE  IF NOT EXISTS `digital_room` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `digital_room`;
-- MySQL dump 10.13  Distrib 8.0.28, for Win64 (x86_64)
--
-- Host: localhost    Database: digital_room
-- ------------------------------------------------------
-- Server version	8.0.28

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `map_item`
--

DROP TABLE IF EXISTS `map_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `map_item` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `item_name` text,
  `subprocess_map_id` int DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `map_item`
--

LOCK TABLES `map_item` WRITE;
/*!40000 ALTER TABLE `map_item` DISABLE KEYS */;
INSERT INTO `map_item` VALUES (1,'A-Frames',1),(2,'Signicade White 36 x 24 in',1),(3,'Signicade A Frame Signs',1),(4,'Signicade Black',1),(5,'Signicade White',1),(6,'Signicade Deluxe Black 36 x 24 in',1),(7,'Signicade Deluxe White 36 x 24 in',1),(8,'Deluxe Signicade A Frame Signs',1),(9,'Signicade Blue 3\' x 2\'',1),(10,'A-Frame Replacement Signs',1),(11,'Signicade Deluxe Black',1),(12,'Signicade Deluxe White',1),(13,'A-Frame Sign',1),(14,'Econo Classic',1),(15,'Sign Panels',1),(16,'Wheeled Snap In',1),(17,'36 x 24 in Sandwich Board Sign',1),(18,'Windsign 36 x 24 in',1),(19,'Untitled A-Frame Sign',1),(20,'Breakaway',2),(21,'Breakaway Banners',2),(25,'Simpo II A-Frame (Sign Only)',1),(26,'Simpo II A-Frame',1),(28,'Signicade White, 36 x 24 in',1),(30,'Signicade Deluxe Black, 36 x 24 in',1),(32,'Signicade Deluxe White, 36 x 24 in',1),(33,'22\" x 28\" Simpo II, 28 x 22 In',1),(34,'Econo Classic, 3\' x 2\'',1),(35,'Signicade Blue, 3\' x 2\'',1),(36,'Signicade Black, 36 x 24 in',1),(37,'Signicade Green, 3\' x 2\'',1),(38,'Windsign, 36 x 24 in',1),(39,'24\" x 24\" Simpo Square 24 in, Black',1),(40,'24\" x 24\" Simpo Square 24 in, White',1);
/*!40000 ALTER TABLE `map_item` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2022-09-07 23:34:26
