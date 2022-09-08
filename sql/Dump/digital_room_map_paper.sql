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
-- Table structure for table `map_paper`
--

DROP TABLE IF EXISTS `map_paper`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `map_paper` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `paper_name` text,
  `SLC` varchar(3) DEFAULT NULL,
  `BRI` varchar(3) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=104 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `map_paper`
--

LOCK TABLES `map_paper` WRITE;
/*!40000 ALTER TABLE `map_paper` DISABLE KEYS */;
INSERT INTO `map_paper` VALUES (1,'8.8 oz. Polyester Fabric','37',''),(2,'8.8 oz Polyester Fabric','37',''),(3,'8.8 Polyester Fabric','37',''),(4,'6.8 oz. Polyester Fabric','37',''),(5,'6.8 oz Polyester Fabric','37',''),(6,'6.8 Polyester Fabric','37',''),(7,'9 oz. Wrinkle Free Fabric','37',''),(8,'6.8 oz Polyester Tension Fabric','37',''),(9,'9 oz Polyester Fabric','37',''),(10,'4mm Corrugated Plastic','3','46'),(11,'3/16\" Corrugated Plastic\"','3','46'),(12,'3/16\" Corrugated Plastic','3','46'),(13,'1/8\" Clear Acrylic\"','13',''),(14,'1/8\" Clear Acrylic','13',''),(15,'8 oz. Mesh','28','50'),(16,'Mesh','28',''),(17,'1/2\" High-Density Fiberboard\"','29',''),(18,'1/2\" High-Density Fiberboard','29',''),(19,'3mm Aluminum Composite Panel','6',''),(20,'3mm Aluminum Composite Panel UV Coating','6',''),(21,'1/4\" Clear Acrylic\"','12',''),(22,'1/4\" Clear Acrylic','12',''),(23,'1/4\" Acrylic','12',''),(24,'3M 180C Adhesive Vinyl','9',''),(25,'3.4 mil. Floor Graphic Vinyl','24',''),(26,'3/16\" White-Black-White Gatorboard\"','4',''),(27,'3/16\" White-Black-White Gatorboard','4',''),(28,'24 pt. Cardstock Board 48\"x96\"\"\"','1',''),(29,'24 pt. Cardstock Board 48\"x96\"','1',''),(30,'3/16\" White Gatorboard\"','5',''),(31,'3/16\" White Gatorboard','5',''),(32,'3mm PVC','7',''),(33,'White PVC Board','7',''),(34,'6mm PVC','8',''),(35,'White Window Adhesive','10',''),(36,'4 mil. Adhesive Vinyl (Removable)','11',''),(37,'1/8\" Frosted Acrylic\"','14',''),(38,'1/8\" Frosted Acrylic','14',''),(39,'13 oz. Matte Vinyl','15','48'),(40,'13 oz. Vinyl','15',''),(41,'13oz Matte','15','48'),(42,'13oz Gloss','15',''),(43,'13 oz. Gloss Vinyl','15',''),(44,'13 oz. Smooth Blockout Vinyl','18',''),(45,'3 mm. Brushed Aluminum E-Panel','19',''),(46,'Clear Static Cling','20',''),(47,'Clear Window Cling','20',''),(48,'Clear Window Adhesive','21',''),(49,'3.4 mil. Carpet Vinyl','22',''),(50,'3.4 mil Calendared Vinyl','22',''),(51,'1/2\" White-Kraft Falconboard\"','23',''),(52,'1/2\" White-Kraft Falconboard','23',''),(53,'3/16\" Foam Core\"','25',''),(54,'3/16\" Foam Core','25',''),(55,'3.5 mil. Backlit Adhesive Vinyl','26',''),(56,'30 pt. Magnetic Stock','27',''),(57,'30 mil Rolled Magnetic','27',''),(58,'Opaque Static Cling','30',''),(59,'50/50 Perforated Adhesive Vinyl','31',''),(60,'7 mil. Reflective Adhesive Vinyl','32',''),(61,'2 mil. Frosted Adhesive Vinyl','33',''),(62,'Matte Photo Paper','34',''),(63,'Photo Paper (Matte)','34',''),(64,'Gloss Photo Paper','35',''),(65,'Photo Paper (Gloss)','35',''),(66,'Metallic Photo Paper','36',''),(67,'4 oz. Polyester Fabric','38',''),(68,'4 oz Polyester Fabric','38',''),(69,'20 mil. Adhesive Aluminum (Smooth)','39',''),(70,'20 mil. Adhesive Aluminum (Rough)','40',''),(71,'3M Exterior Vinyl','40',''),(72,'Antimicrobial Polyester Fabric','41',''),(73,'5.7 oz. Stretch Polyester-Spandex','42',''),(74,'3.5 oz. Stretch Polyester-Spandex','43',''),(75,'18 oz. Matte Vinyl','17',''),(76,'2 mil. Adhesive Cut Vinyl','44',''),(77,'2 mil. Adhesive Cut Vinyl (Frosted)','44',''),(78,'2 mil. Adhesive Vinyl','44',''),(79,'White Vinyl (Outdoor/Indoor)','45','45'),(80,'White Premium Sticker Paper','45','45'),(81,'8 oz./9 oz. Mesh Vinyl','28',''),(82,'1/8\" Acrylic','13',''),(84,'Perforated Vinyl','31',''),(85,'3 mm. Brushed Aluminum E-Panel UV Coating','19',''),(86,'20 mil. Adhesive Aluminum (Removable)','39',''),(87,'Perforated Window Film','31',''),(89,'Wall Decal','11',''),(90,'8oz Mesh','28','50'),(91,'White Window Cling','30',''),(92,'Floor Graphic','24',''),(101,'13 oz. Smooth Matte',NULL,'51'),(102,'12oz Mesh',NULL,'52'),(103,'6mm Corrugated Plastic',NULL,'53');
/*!40000 ALTER TABLE `map_paper` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2022-09-07 23:34:28
