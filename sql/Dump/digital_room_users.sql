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
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `first` varchar(45) DEFAULT NULL,
  `last` varchar(45) DEFAULT NULL,
  `email` varchar(45) DEFAULT NULL,
  `directory` varchar(45) DEFAULT NULL,
  `default_facility` varchar(2) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Bret','Combe','bret.c@digitalroominc.com','6290','28'),(2,'Dalenna','McVay','dalenna.mv@digitalroominc.com','6534','28'),(3,'Chelsea','McVay','chelsea.mv@digitalroominc.com','6532','28'),(4,'Gary','Speers','gary.s@digitalroominc.com','6536','28'),(5,'Chris','Roberts','chris.r@digitalroominc.com','6533','28'),(6,'Brian','Bunch','brian.b@digitalroominc.com','2353','28'),(7,'Joshua','Thorton','joshua.t@digitalroominc.com','4329','28'),(8,'Renato','Pascua','renato.p@digitalroominc.com','1927','28'),(9,'John','Kallios','john.k@digitalroominc.com',NULL,'28'),(10,'Jason','Richard Leyco','jrichard.l@digitalroominc.com','2530','28'),(11,'Norman','De Jesus','norman.dj@digitalroominc.com','2827','28'),(12,'Alianha','Nicole Javier','alianha.j@digitalroominc.com',NULL,'28'),(13,'Ryan','Republica','ryan.r@digitalroominc.com','4339','28'),(14,'Juan','Jerome Magbanua','juanjerome.m@digitalroominc.com','2882','28'),(15,'Mario','Atendido','mario.a@digitalroominc.com','216','28'),(16,'Jude','Vallagomesa','jude.v@digitalroominc.com','3799','28'),(17,'Ritchie','Cortez','ritchie.c@digitalroominc.com',NULL,'28'),(18,'Alfredo','Cruz','alfredo.c@digitalroominc.com','517','28'),(19,'Archimedes','Turo','archie.t@digitalroominc.com','5596','28'),(20,'Vincent','Gonzales','vincent.g@digitalroominc.com','171','28'),(21,'Matthew','Alliston','matthew.al@digitalroominc.com',NULL,'28'),(22,'Mao','Rivera','mao.r@digitalroominc.com',NULL,'28'),(23,'Charmaine','Rabaino','charmaine.r@digitalroominc.com','1183','28'),(24,'John','Eddie Macias','eddie.m@digitalroominc.com',NULL,'28'),(25,'Andrew','Philip Moris','philip.m@digitalroominc.com',NULL,'28'),(26,'Reynante','Santiago','reynante.s@digitalroominc.com',NULL,'28'),(27,'Poul','Michael Grapa','poul.g@digitalroominc.com','1691','28');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
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
