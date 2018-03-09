

var monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

function monthName(monthNumber) {
    return monthNames[monthNumber];
}

module.exports.monthName = monthName;