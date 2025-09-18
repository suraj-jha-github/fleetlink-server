function calculateRideDuration(fromPincode, toPincode) {
  if (!fromPincode || !toPincode) {
    throw new Error('Both fromPincode and toPincode are required');
  }
  const pincodeRegex = /^\d{6}$/;
  if (!pincodeRegex.test(fromPincode) || !pincodeRegex.test(toPincode)) {
    throw new Error('Pincodes must be exactly 6 digits');
  }
  const fromNum = parseInt(fromPincode);
  const toNum = parseInt(toPincode);
  const durationHours = Math.abs(toNum - fromNum) % 24;
  return Math.max(durationHours, 1);
}
function calculateBookingEndTime(startTime, durationHours) {
  const start = new Date(startTime);
  const end = new Date(start.getTime() + (durationHours * 60 * 60 * 1000));
  return end;
}
function timeRangesOverlap(start1, end1, start2, end2) {
  return start1 < end2 && start2 < end1;
}
function isValidBookingTime(startTime) {
  const now = new Date();
  const bookingStart = new Date(startTime);
  return bookingStart > now;
}
module.exports = {
  calculateRideDuration,
  calculateBookingEndTime,
  timeRangesOverlap,
  isValidBookingTime
};