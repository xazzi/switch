getShipType = function(query){

    var type

    switch(query){
        case "1DA":
            type = "OVERNIGHT";
        break;
        case "1DAS":
            type = "OVERNIGHT";
        break;
        case "1DM":
            type = "OVERNIGHT";
        break;
        case "1DMS":
            type = "OVERNIGHT";
        break;
        case "1DP":
            type = "OVERNIGHT";
        break;
        case "2DA":
            type = "2";
        break;
        case "2DAS":
            type = "2";
        break;
        case "2DM":
            type = "2";
        break;
        case "3DS":
            type = "GROUND";
        break;
        case "3DSS":
            type = "GROUND";
        break;
        case "ARLINGTON":
            type = "W";
        break;
        case "BRIGHTON":
            type = "W";
        break;
        case "CHATSWORTH":
            type = "W";
        break;
        case "CLEVELAND":
            type = "W";
        break;
        case "DELIVERY_VIA_VAN":
            type = "W";
        break;
        case "FEDEX_2_DAY":
            type = "2";
        break;
        case "FEDEX_EXPRESS_SAVER":
            type = "GROUND";
        break;
        case "FEDEX_FREIGHT_ECONOMY":
            type = "F";
        break;
        case "FEDEX_FREIGHT_PRIORITY":
            type = "F";
        break;
        case "FEDEX_GROUND":
            type = "GROUND";
        break;
        case "FIRST_OVERNIGHT":
            type = "OVERNIGHT";
        break;
        case "FR":
            type = "X";
        break;
        case "GND":
            type = "GROUND";
        break;
        case "GNDS":
            type = "GROUND";
        break;
        case "GND_SAVER":
            type = "GROUND";
        break;
        case "GROUND_HOME_DELIVERY":
            type = "GROUND";
        break;
        case "HOLD_FOR_NEXT_DROP":
            type = "M";
        break;
        case "HOLD_SHIPMENT":
            type = "H";
        break;
        case "INTERNATIONAL_ECONOMY":
            type = "GROUND";
        break;
        case "INTERNATIONAL_PRIORITY":
            type = "OVERNIGHT";
        break;
        case "LA":
            type = "W";
        break;
        case "LOCAL_MAILING_ART_IN":
            type = "M";
        break;
        case "LOCAL_MAILING_MELLADY":
            type = "M";
        break;
        case "LOCAL_MAILING_MMP":
            type = "M";
        break;
        case "MBOTEST123":
            type = "W";
        break;
        case "MESSENGER_HAP":
            type = "W";
        break;
        case "MESSENGER_TOPLINE":
            type = "W";
        break;
        case "MS":
            type = "M";
        break;
        case "NJ":
            type = "W";
        break;
        case "OTHER_INTERNATIONAL":
            type = "GROUND";
        break;
        case "PRIORITY_OVERNIGHT":
            type = "OVERNIGHT";
        break;
        case "RD":
            type = "W";
        break;
        case "SLC":
            type = "W";
        break;
        case "SMARTMAIL_PARCEL_EXPEDITED_MAX":
            type = "OVERNIGHT";
        break;
        case "SMARTMAIL_PARCEL_GROUND":
            type = "GROUND";
        break;
        case "SMART_POST":
            type = "GROUND";
        break;
        case "SOLON":
            type = "W";
        break;
        case "STANDARD_OVERNIGHT":
            type = "OVERNIGHT";
        break;
        case "STD":
            type = "GROUND";
        break;
        case "SURE_POST":
            type = "GROUND";
        break;
        case "THIRD_PARTY_ACCURATE_COURIER":
            type = "W";
        break;
        case "THIRD_PARTY_ASAP_COURIERS":
            type = "W";
        break;
        case "THIRD_PARTY_BLUE_GRACE":
            type = "W";
        break;
        case "THIRD_PARTY_DC_EXPRESS":
            type = "W";
        break;
        case "THIRD_PARTY_DEPENDABLE":
            type = "W";
        break;
        case "THIRD_PARTY_DIRECT_LOGISTICS":
            type = "W";
        break;
        case "THIRD_PARTY_JETT_MESSENGER":
            type = "W";
        break;
        case "THIRD_PARTY_JET_COURIERS":
            type = "W";
        break;
        case "THIRD_PARTY_LA_MESSENGER":
            type = "W";
        break;
        case "THIRD_PARTY_OTHER_FREIGHT":
            type = "W";
        break;
        case "THIRD_PARTY_UBER_FREIGHT":
            type = "W";
        break;
        case "TORRANCE":
            type = "W";
        break;
        case "UPS_FREIGHT_LTL":
            type = "F";
        break;
        case "UPS_FREIGHT_LTL_GUARANTEED":
            type = "F";
        break;
        case "UPS_FREIGHT_LTL_GUARANTEED_AM":
            type = "F";
        break;
        case "UPS_STANDARD_LTL":
            type = "F";
        break;
        case "USPS_FCPINT":
            type = "GROUND";
        break;
        case "USPS_PM":
            type = "GROUND";
        break;
        case "USPS_PME":
            type = "GROUND";
        break;
        case "USPS_PMEINT":
            type = "GROUND";
        break;
        case "USPS_PMINT":
            type = "GROUND";
        break;
        case "VAN NUYS":
            type = "W";
        break;
        case "XPD":
            type = "OVERNIGHT";
        break;
        case "XPP":
            type = "GROUND";
        break;
        default:
            type = "NULL";
    }

    return type
}