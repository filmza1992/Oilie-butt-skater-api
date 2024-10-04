const getMonthNameInThai = (month) => {
    const monthNames = [
        "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", 
        "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", 
        "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    return monthNames[month - 1]; // month เป็น 1-indexed
};

module.exports = getMonthNameInThai;