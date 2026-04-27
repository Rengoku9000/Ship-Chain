export const WAREHOUSES = [
    {
        id: "WH-SIN",
        name: "Singapore Hub",
        location: { lat: 1.3521, lng: 103.8198 },
        capacity: 150000,
        baseLoad: 95000,
        throughput: 4500,
        maxThroughput: 5000,
        maxShipments: 100, // Max concurrent shipments expected for this hub to normalize activity
        avgShipmentLoad: 500 // Assuming each shipment adds ~500 units of load
    },
    {
        id: "WH-ROT",
        name: "Rotterdam Eurohub",
        location: { lat: 51.9225, lng: 4.4791 },
        capacity: 120000,
        baseLoad: 72000,
        throughput: 3800,
        maxThroughput: 4500,
        maxShipments: 80,
        avgShipmentLoad: 450
    },
    {
        id: "WH-DXB",
        name: "Dubai Logistics City",
        location: { lat: 25.2048, lng: 55.2708 },
        capacity: 90000,
        baseLoad: 45000,
        throughput: 2900,
        maxThroughput: 3500,
        maxShipments: 60,
        avgShipmentLoad: 400
    },
    {
        id: "WH-SHA",
        name: "Shanghai Port Central",
        location: { lat: 31.2304, lng: 121.4737 },
        capacity: 200000,
        baseLoad: 160000,
        throughput: 6200,
        maxThroughput: 7000,
        maxShipments: 120,
        avgShipmentLoad: 600
    },
    {
        id: "WH-LAX",
        name: "Los Angeles Pacific Gateway",
        location: { lat: 33.7445, lng: -118.2726 },
        capacity: 110000,
        baseLoad: 85000,
        throughput: 3100,
        maxThroughput: 4000,
        maxShipments: 75,
        avgShipmentLoad: 450
    },
    {
        id: "WH-HAM",
        name: "Hamburg Speicherstadt",
        location: { lat: 53.5511, lng: 9.9937 },
        capacity: 80000,
        baseLoad: 52000,
        throughput: 2100,
        maxThroughput: 3000,
        maxShipments: 50,
        avgShipmentLoad: 400
    },
    {
        id: "WH-BOM",
        name: "Mumbai Nhava Sheva",
        location: { lat: 18.9438, lng: 72.9602 },
        capacity: 95000,
        baseLoad: 68000,
        throughput: 2700,
        maxThroughput: 3500,
        maxShipments: 65,
        avgShipmentLoad: 450
    },
    {
        id: "WH-SYD",
        name: "Sydney Port Botany",
        location: { lat: -33.9687, lng: 151.2064 },
        capacity: 70000,
        baseLoad: 40000,
        throughput: 1800,
        maxThroughput: 2500,
        maxShipments: 40,
        avgShipmentLoad: 350
    },
    {
        id: "WH-SGS",
        name: "Santos Port Terminal",
        location: { lat: -23.9619, lng: -46.3117 },
        capacity: 85000,
        baseLoad: 55000,
        throughput: 2400,
        maxThroughput: 3200,
        maxShipments: 55,
        avgShipmentLoad: 400
    },
    {
        id: "WH-NYC",
        name: "New York Terminal Link",
        location: { lat: 40.7128, lng: -74.0060 },
        capacity: 130000,
        baseLoad: 92000,
        throughput: 4100,
        maxThroughput: 4800,
        maxShipments: 85,
        avgShipmentLoad: 500
    }
];

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

export const getNearestWarehouse = (lat, lng) => {
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

    let nearest = null;
    let minDistance = Infinity;

    for (const warehouse of WAREHOUSES) {
        const distance = calculateDistance(lat, lng, warehouse.location.lat, warehouse.location.lng);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = warehouse;
        }
    }

    return nearest;
};
