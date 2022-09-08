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
-- Table structure for table `material_info`
--

DROP TABLE IF EXISTS `material_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_info` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `production_name` text,
  `file_name` text,
  `type` text,
  `width` int DEFAULT NULL,
  `height` int DEFAULT NULL,
  `phoenix_stock` int NOT NULL,
  `rotation` text,
  `spacing_type` text,
  `spacing_default` text,
  `spacing_top` text,
  `spacing_bottom` text,
  `spacing_left` text,
  `spacing_right` text,
  `bleed` text,
  `allowed_rotations` text,
  `imposition_profile` text,
  `gsm` int NOT NULL,
  `bleed_type` text,
  `printer` int NOT NULL,
  `margins` int NOT NULL,
  `force_lamination` tinyint DEFAULT NULL,
  `crop_gang` tinyint DEFAULT NULL,
  `white_elements` tinyint DEFAULT NULL,
  `page_handling` text,
  `overrun` int DEFAULT NULL,
  `force_undersize` tinyint DEFAULT '0',
  `side_mix` tinyint DEFAULT '1',
  `rip_device` int DEFAULT NULL,
  `rip_hotfolder` int DEFAULT NULL,
  `cutter_device` int DEFAULT NULL,
  `cutter_hotfolder` int DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_info`
--

LOCK TABLES `material_info` WRITE;
/*!40000 ALTER TABLE `material_info` DISABLE KEYS */;
INSERT INTO `material_info` VALUES (1,'24pt-Cardstock',NULL,'sheet',48,96,1,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',1,'Contour',2,2,0,0,0,'OnePerTwoPages',0,0,1,2,42,2,1),(3,'Coroplast',NULL,'sheet',48,96,29,'None','Margins','0.5','0.125','0.75','0.125','0.125','0.125','','Coroplast',1,'Contour',2,10,0,0,0,'OnePerTwoPages',10,1,0,2,38,2,4),(4,'BlackGator',NULL,'sheet',48,96,1,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',1,'Contour',2,2,0,0,0,'OnePerTwoPages',0,0,1,2,30,5,9),(5,'WhiteGator',NULL,'sheet',48,96,1,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',1,'Contour',2,2,0,0,0,'OnePerTwoPages',0,0,1,2,31,5,9),(6,'2mm-Epanel',NULL,'sheet',49,99,2,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',1,'Contour',2,2,0,0,0,'OnePerTwoPages',0,0,1,2,32,5,1),(7,'3mm-Sintra',NULL,'sheet',50,99,3,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',1,'Contour',2,2,0,0,0,'OnePerTwoPages',0,0,1,2,34,2,11),(8,'6mm-Sintra',NULL,'sheet',50,99,3,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',1,'Contour',2,2,0,0,0,'OnePerTwoPages',0,0,1,2,33,5,1),(9,'3m180',NULL,'roll',54,150,4,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',2,'Contour',9,9,1,1,0,'OnePerTwoPages',0,0,1,1,2,1,2),(10,'3mIJ40',NULL,'roll',54,150,4,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',2,'Contour',12,9,0,1,0,'OnePerTwoPages',0,0,1,1,27,1,2),(11,'4milWall',NULL,'roll',54,150,4,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',2,'Contour',12,9,0,1,0,'OnePerTwoPages',0,0,1,1,3,1,2),(12,'25-Acrylic',NULL,'sheet',50,98,23,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',1,'Contour',1,2,0,0,1,'OnePerTwoPages',0,0,1,1,7,5,1),(13,'125-Acrylic',NULL,'sheet',50,98,23,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',1,'Contour',1,2,0,0,1,'OnePerTwoPages',0,0,1,1,7,5,1),(14,'FrostedAcrylic',NULL,'sheet',48,96,13,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',1,'Contour',1,2,0,0,1,'OnePerTwoPages',0,0,1,1,7,5,1),(15,'13ozBanner',NULL,'roll',126,150,5,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',2,'Contour',3,3,0,1,0,'OnePerTwoPages',0,0,0,1,4,1,3),(17,'18ozBanner',NULL,'roll',126,150,5,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',2,'Contour',3,3,0,0,0,'OnePerTwoPages',0,0,0,1,25,1,3),(18,'DSS',NULL,'roll',30,150,10,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',2,'Contour',1,2,0,1,0,'OnePerTwoPages',0,0,1,1,2,1,3),(19,'BrushedSilver',NULL,'sheet',48,96,13,'Custom','Margins','0.5','','0.75','','','0.125','90','Sheet',1,'Contour',1,2,0,0,1,'OnePerTwoPages',0,0,1,1,7,5,1),(20,'ClearCling',NULL,'roll',54,110,25,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',2,'Contour',1,13,0,1,1,'OnePerTwoPages',0,0,1,1,6,1,2),(21,'ClearPoly',NULL,'roll',60,150,24,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',2,'Contour',1,13,0,1,1,'OnePerTwoPages',0,0,1,1,6,1,2),(22,'CarpetDecal',NULL,'roll',54,150,4,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',2,'Contour',3,9,1,1,0,'OnePerTwoPages',0,0,1,1,2,1,2),(23,'Falconboard',NULL,'sheet',48,96,31,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',1,'Contour',2,10,0,0,0,'OnePerTwoPages',0,0,1,2,39,2,6),(24,'FloorDecal',NULL,'roll',54,150,4,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',2,'Contour',3,9,1,1,0,'OnePerTwoPages',0,0,1,1,2,1,2),(25,'Foamboard',NULL,'sheet',48,96,30,'Orthogonal','Margins','0.5','0.125','0.75','0.125','0.125','0.125','','Sheet',1,'Contour',2,10,0,0,0,'OnePerTwoPages',10,1,1,2,40,2,7),(26,'Litecal',NULL,'roll',60,150,8,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',2,'Contour',3,9,0,1,0,'OnePerTwoPages',0,0,1,1,2,1,2),(27,'Magnet',NULL,'roll',40,140,17,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',2,'Contour',1,10,0,1,0,'OnePerTwoPages',0,0,1,1,2,1,10),(28,'Mesh',NULL,'roll',126,150,5,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',2,'Contour',3,3,0,1,0,'OnePerTwoPages',0,0,1,1,2,1,5),(29,'MDO',NULL,'sheet',48,96,1,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',1,'Contour',1,2,0,0,0,'OnePerTwoPages',0,0,1,1,5,5,1),(30,'OpaqueCling',NULL,'roll',54,150,26,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',2,'Contour',12,9,0,1,0,'OnePerTwoPages',0,0,1,1,29,1,2),(31,'Perf',NULL,'roll',54,150,28,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',2,'Contour',12,9,0,1,0,'OnePerTwoPages',0,0,1,1,26,1,2),(32,'ReflectiveVinyl',NULL,'sheet',49,99,18,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',3,'Contour',12,3,0,1,0,'OnePerTwoPages',0,0,1,1,28,5,1),(33,'EtchedGlass',NULL,'roll',60,150,8,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',2,'Contour',1,11,0,1,1,'OnePerTwoPages',0,0,1,1,6,1,2),(34,'PhotoMatte',NULL,'roll',50,150,9,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',2,'Contour',6,6,0,0,0,'OnePerTwoPages',0,0,1,1,2,6,1),(35,'PhotoGloss',NULL,'roll',50,150,9,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',2,'Contour',6,6,0,0,0,'OnePerTwoPages',0,0,1,1,2,6,1),(36,'PhotoMetallic',NULL,'roll',30,150,10,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',2,'Contour',6,6,0,0,0,'OnePerTwoPages',0,0,1,1,2,6,1),(37,'Celtec',NULL,'roll',126,160,5,'Orthogonal','Margins','0.5','','0.75','','','0.25','','Sheet',2,'Contour',5,3,0,1,0,'OnePerTwoPages',0,0,1,1,2,1,5),(38,'Flag',NULL,'roll',126,160,5,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',2,'Contour',5,3,0,1,0,'OnePerPage',0,0,1,1,2,1,5),(39,'OutdoorWall',NULL,'roll',53,150,12,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',2,'Contour',3,9,0,1,0,'OnePerTwoPages',0,0,1,1,2,1,2),(40,'StreetGraphics',NULL,'roll',53,150,12,'Orthogonal','Margins','0.5','','0.75','','','0.125','','Sheet',2,'Contour',3,9,0,1,0,'OnePerTwoPages',0,0,1,1,2,1,2),(41,'Mask',NULL,'roll',126,160,5,'None','Margins','0.5','','0.75','','','0.125','','CustomFaceMask',2,'Contour',5,3,0,1,0,'OnePerTwoPages',0,0,1,1,2,1,5),(42,'Gaiter',NULL,'roll',126,160,5,'Custom','Margins','0.6','','0.75','','','0.125','90','CustomFaceMask',2,'Contour',5,3,0,1,0,'OnePerTwoPages',0,0,1,1,2,1,5),(43,'Gaiter-Lightweight',NULL,'roll',60,160,8,'None','Margins','0.6','','0.75','','','0.125','0','CustomFaceMask',2,'Contour',5,3,0,1,0,'OnePerTwoPages',0,0,1,1,2,1,5),(44,'CutVinyl',NULL,'roll',48,150,22,'Orthogonal','Margins','0.5','','0.75','','','0.125','','CutVinyl',2,'Margins',7,16,0,0,0,'OnePerTwoPages',0,0,1,3,1,8,13),(45,'RollLabels',NULL,'roll',12,39,27,'Custom','Margins','0.125','','','','','0.0625','-90','RollLabel',2,'Margins',10,16,0,0,0,'OnePerTwoPages',10,0,1,3,1,7,13),(46,'Coroplast','Cor','sheet',48,96,29,'None','Margins','0.5','.125','.75','.125','.125','.125',NULL,'Coroplast',1,'Contour',11,10,0,0,0,'OnePerTwoPages',10,1,0,3,1,7,13),(48,'13oz-Matte',NULL,'roll',126,370,6,'Orthogonal','Margins','.5',NULL,'.75',NULL,NULL,'.125',NULL,'Roll',2,'Contour',13,3,0,1,0,'OnePerTwoPages',0,0,1,3,1,7,13),(50,'8oz-Mesh',NULL,'roll',126,370,6,'Orthogonal','Margins','.5',NULL,'.75',NULL,NULL,'.125',NULL,'Roll',2,'Contour',13,3,0,1,0,'OnePerTwoPages',0,0,1,3,1,7,13),(51,'13oz-Smooth',NULL,'roll',126,370,6,'Orthogonal','Margins','.5',NULL,'.75',NULL,NULL,'.125',NULL,'Roll',2,'Contour',13,3,0,1,0,'OnePerTwoPages',0,0,1,3,1,7,13),(52,'12oz-Mesh',NULL,'roll',126,370,6,'Orthogonal','Margins','.5',NULL,'.75',NULL,NULL,'.125',NULL,'Roll',2,'Contour',13,3,0,1,0,'OnePerTwoPages',0,0,1,3,1,7,13),(53,'Coroplast','6mm-Coro','sheet',48,96,29,'None','Margins','.5','.125','.75','.125','.125','.125',NULL,'Coroplast',1,'Contour',11,10,0,0,0,'OnePerTwoPages',10,1,0,3,1,7,13);
/*!40000 ALTER TABLE `material_info` ENABLE KEYS */;
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
