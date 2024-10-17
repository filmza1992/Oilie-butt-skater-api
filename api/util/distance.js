const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // รัศมีของโลกในหน่วยกิโลเมตร
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // ระยะทางในหน่วยกิโลเมตร
    return distance;
};

const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
};

// ฟังก์ชันสำหรับการเรียงลำดับห้อง
const sortRoomsByDistance = (rooms, userLat, userLon) => {
    return rooms.sort((roomA, roomB) => {
        const distanceA = getDistanceFromLatLonInKm(userLat, userLon, roomA.latitude, roomA.longitude);
        const distanceB = getDistanceFromLatLonInKm(userLat, userLon, roomB.latitude, roomB.longitude);
        return distanceA - distanceB; // เรียงจากใกล้ไปไกล
    });
};

module.exports = {sortRoomsByDistance};