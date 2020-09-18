/**
 * Unit tests
 *
 */

const { isValidBirthdateDate } = require("../helpers/moment");

describe("pass different dates to birthdate date validation function", () => {
  //valid date
  test("should return true", () => {
    const result = isValidBirthdateDate("1990-08-24");
    expect(result).toBeTruthy();
  });

  //invalid dates
  test("should return false", () => {
    const result = isValidBirthdateDate(null);
    expect(result).toBeFalsy();
  });

  test("should return false", () => {
    const result = isValidBirthdateDate("a");
    expect(result).toBeFalsy();
  });

  test("should return false", () => {
    const result = isValidBirthdateDate("2111-08-24");
    expect(result).toBeFalsy();
  });

  test("should return false", () => {
    const result = isValidBirthdateDate("1990-14-24");
    expect(result).toBeFalsy();
  });

  test("should return false", () => {
    const result = isValidBirthdateDate("1990-a-24");
    expect(result).toBeFalsy();
  });
});
