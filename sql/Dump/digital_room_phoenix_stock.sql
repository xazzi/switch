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
-- Table structure for table `phoenix_stock`
--

DROP TABLE IF EXISTS `phoenix_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phoenix_stock` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `stock` text,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phoenix_stock`
--

LOCK TABLES `phoenix_stock` WRITE;
/*!40000 ALTER TABLE `phoenix_stock` DISABLE KEYS */;
INSERT INTO `phoenix_stock` VALUES (1,'Sheet_48x96'),(2,'Sheet_49x99'),(3,'Sheet_50x99'),(4,'Roll_54'),(5,'Roll_126'),(6,'Roll_126_Brighton'),(7,'Roll_58'),(8,'Roll_60'),(9,'Roll_50'),(10,'Roll_30'),(11,'Roll_110'),(12,'Roll_53'),(13,'Proc_WhiteInk_48x96'),(14,'Proc_WhiteInk_50x99'),(15,'Proc_WhiteInk_54'),(16,'Proc_WhiteInk_60'),(17,'Mat_Magnet'),(18,'Mat_Reflective'),(19,'Sheet_50x98'),(20,'deprecated'),(21,'deprecated'),(22,'Mat_CutVinyl'),(23,'Proc_WhiteInk_50x98'),(24,'Mat_ClearPoly'),(25,'Mat_ClearCling'),(26,'Mat_OpaqueCling'),(27,'Proc_RollLabel_12'),(28,'Mat_Perf'),(29,'Mat_Coroplast'),(30,'Mat_Foamboard'),(31,'Mat_Falconboard');
/*!40000 ALTER TABLE `phoenix_stock` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2022-09-07 23:34:25
