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
-- Table structure for table `rip_hotfolder`
--

DROP TABLE IF EXISTS `rip_hotfolder`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rip_hotfolder` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `hotfolder` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rip_hotfolder`
--

LOCK TABLES `rip_hotfolder` WRITE;
/*!40000 ALTER TABLE `rip_hotfolder` DISABLE KEYS */;
INSERT INTO `rip_hotfolder` VALUES (1,'None'),(2,'Standard'),(3,'4mil'),(4,'13ozBanner'),(5,'Rigid-99x50'),(6,'Standard-W'),(7,'Rigid-99x50-W'),(25,'Standard-DS'),(26,'Perf'),(27,'IJ40'),(28,'Reflective'),(29,'OpaqueCling'),(30,'BlackGator'),(31,'WhiteGator'),(32,'2mm-Epanel'),(33,'6mm-Sintra'),(34,'3mm-Sintra'),(35,'25-Acrylic'),(36,'125-Acrylic'),(37,'BrushedSilver'),(38,'Coroplast'),(39,'Falconboard'),(40,'Foamboard'),(41,'A-Frame'),(42,'24pt-Cardstock');
/*!40000 ALTER TABLE `rip_hotfolder` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2022-09-07 23:34:27
