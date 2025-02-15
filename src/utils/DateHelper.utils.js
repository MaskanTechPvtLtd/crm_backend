import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Converts a UTC timestamp to local timestamp in the given timezone.
 * @param {string|Date} utcTimestamp - The UTC timestamp to convert.
 * @param {string} timeZone - The timezone to convert to (default: "Asia/Kolkata").
 * @returns {Date} Local timestamp as a JavaScript Date object.
 */
export const convertUTCToLocal = (utcTimestamp, timeZone = "Asia/Kolkata") => {
    return dayjs.utc(utcTimestamp).tz(timeZone).toDate();
};
