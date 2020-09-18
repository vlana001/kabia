const moment = require("moment-timezone");

let self = {
  //Trabajo con la hora UTC
  calculateAgeYears: function(birthdate) {
    return moment.utc().diff(birthdate, "years");
  },
  calculateTodayDate: function() {
    return moment.utc().format("YYYY-MM-DD");
  },
  calculateTomorrowDate: function() {
    return moment
      .utc()
      .add(1, "days")
      .format("YYYY-MM-DD");
  },
  calculateXDaysAfterTodayDate: function(numDays) {
    return moment
      .utc()
      .add(numDays, "days")
      .format("YYYY-MM-DD");
  },
  calculateXDaysBeforeTodayDate: function(numDays) {
    //si pasan 7, calculo 6 dias antes que hoy
    return moment
      .utc()
      .subtract(numDays - 1, "days")
      .format("YYYY-MM-DD");
  },
  getLastXDaysDates: function(numDays) {
    let labels = [];
    let lastXDaysDates = [];

    for (i = 0; i < numDays; i++) {
      let day = moment
        .utc()
        .subtract(i, "days")
        .format("YYYY-MM-DD");

      let previousDay = moment(day)
        .subtract(1, "days")
        .format("YYYY-MM-DD");

      let nextDay = moment(day)
        .add(1, "days")
        .format("YYYY-MM-DD");

      const dayDate = {
        day: day,
        previousDay: previousDay,
        nextDay: nextDay
      };
      lastXDaysDates.push(dayDate);
      labels.push(day);
    }
    // console.log(labels);
    // console.log(lastXDaysDates);

    return [lastXDaysDates, labels];
  },
  isSameDate: function(d1, d2) {
    return moment(d1).isSame(d2, "day");
  },
  getLastXMonthsNumberOfDays: function(numMonths) {
    const yearAndMonthNow = moment()
      .utc()
      .format("YYYY-MM");

    let firstAndLastDayOfEachLastXMonths = [];
    let labels = [];

    for (i = 0; i < numMonths; i++) {
      const endMonth = moment(yearAndMonthNow)
        .subtract(i, "months")
        .endOf("month")
        .format("YYYY-MM-DD");

      const startMonth = moment(yearAndMonthNow)
        .subtract(i, "months")
        .startOf("month")
        .format("YYYY-MM-DD");

      const monthDates = {
        firstDayOfMonth: startMonth,
        lastDayOfMonth: endMonth
      };

      const label = moment(yearAndMonthNow)
        .subtract(i, "months")
        .format("YYYY-MM");

      labels.push(label);
      firstAndLastDayOfEachLastXMonths.push(monthDates);
    }

    return [firstAndLastDayOfEachLastXMonths, labels];
  },
  numberOfMonthsBetweenADateAndThisMonthBothIncluded: function(date) {
    const datefirstDayOfMonth = moment(date)
      .startOf("month")
      .format("YYYY-MM-DD");

    return moment.utc().diff(datefirstDayOfMonth, "months") + 1;
  },

  calculateUnbanningDateInTime: function(unbanningDate) {
    const nowTime = moment.utc().format("YYYY-MM-DD HH:mm:ss");
    const unbanningDateFormated = moment(unbanningDate)
      .utc()
      .format("YYYY-MM-DD HH:mm:ss");

    const secondsDiff = moment(unbanningDateFormated).diff(
      moment(nowTime),
      "seconds"
    );

    const [days, hours, minutes, seconds] = self.formatSeconds(secondsDiff);

    const timeRemaining = [
      `${unbanningDateFormated} UTC`,
      ` Faltan ${days} dias, ${hours} horas, ${minutes} minutos y ${seconds} segundos`
    ];

    return timeRemaining;
  },
  calculateLastLoginDateInTime: function(lastLoginDate) {
    const nowTime = moment.utc().format("YYYY-MM-DD HH:mm:ss");

    const lastLoginDateFormated = moment(lastLoginDate)
      .utc()
      .format("YYYY-MM-DD HH:mm:ss");

    const secondsDiff = moment(nowTime).diff(
      moment(lastLoginDateFormated),
      "seconds"
    );

    const [days, hours, minutes, seconds] = self.formatSeconds(secondsDiff);

    //format output
    //if there are only mins and secs, we dont add "0 days, 0 hours, x mins, y secs",
    //we only add "x mins, y secs" (if a var value is 0, we ommit it)
    let lastLoginText = "Hace ";
    if (days > 0) {
      lastLoginText += `${days} dias`;
    }
    if (hours > 0) {
      if (days > 0) {
        lastLoginText += `, `;
      }

      lastLoginText += `${hours} horas`;
    }
    if (minutes > 0) {
      if (hours > 0 || (hours === 0 && days > 0)) {
        lastLoginText += `, `;
      }
      lastLoginText += `${minutes} minutos`;
    }
    if (seconds > 0) {
      if (
        minutes > 0 ||
        (minutes === 0 && hours > 0) ||
        (minutes === 0 && hours === 0 && days > 0)
      ) {
        lastLoginText += `, `;
      }
      lastLoginText += `${seconds} segundos`;
    }

    return lastLoginText;
  },
  formatSeconds: function(seconds) {
    //seconds to DD:hh:mm:ss
    //days
    const days = seconds / (24 * 3600);
    const daysRounded = Math.floor(days);
    //hours
    const secsRemainingHours = seconds - daysRounded * (3600 * 24);
    const hours = secsRemainingHours / 3600;
    const hoursRounded = Math.floor(hours);
    //minutes
    const secsRemainingMinutes = secsRemainingHours - hoursRounded * 3600;
    const minutes = secsRemainingMinutes / 60;
    const minutesRounded = Math.floor(minutes);
    //seconds
    const secsReaminingSeconds = secsRemainingMinutes - minutesRounded * 60;

    return [daysRounded, hoursRounded, minutesRounded, secsReaminingSeconds];
  },
  calculateDateWithHour: function(date, req) {
    console.log(date);
    const date1 = moment(date).format("YYYY-MM-DD HH:mm:ss");
    console.log(date1);

    console.log(req.user.timezone);
    var dateTz = moment(date)
      .tz(req.user.timezone)
      .format("YYYY-MM-DD HH:mm:ss");
    console.log(dateTz);
    
    return dateTz;
  },
  isValidBirthdateDate: function(date) {
    //Valid format and not greater than today's date
    let validFormat = moment(date, "YYYY-MM-DD", true).isValid();
    if (validFormat) {
      let validNotGreaterThanToday = moment(
        date,
        "YYYY-MM-DD",
        true
      ).isSameOrBefore(moment.utc().format("YYYY-MM-DD"));
      if (validNotGreaterThanToday) {
        return true;
      }
    }
    return false;
  },
  formatRegistrationDate: function(date) {
    return moment.utc(date).format("YYYY-MM-DD"); //UTC
  },
  formatMongodbDate: function(date) {
    return moment.utc(date).format("YYYY-MM-DD"); //UTC
  },
  subtractYearsToTodayDate: function(age) {
    return moment()
      .utc()
      .subtract(age, "years")
      .format("YYYY-MM-DD");
  },
  getCurrentTimeUTC: function() {
    const currentDate = moment()
      .utc()
      .toDate();

    return currentDate;
  },
  convertDateStringToObject: function(stringDate) {
    //const isValid = self.isValidDateChat(stringDate);
    //if (isValid) {
    const date = moment(stringDate)
      .utc()
      .toDate();

    return date;
    // }
    // return "";
  },
  isValidDateChat: function(date) {
    const validFormat = moment(
      date,
      "YYYY-MM-DDTHH:mm:ss.SSSZ",
      true
    ).isValid();

    if (validFormat) {
      return true;
    }
    return false;
  }
};

module.exports = self;
