/**
 * Integration tests
 *
 */
const { validationResult } = require("express-validator");
const httpMocks = require("node-mocks-http");
const { validateAllButUsername } = require("../helpers/validation");
const { testExpressValidatorMiddleware } = require("../helpers/validatorUtils");

describe("mock http request to pass different dates to express-validator middleware", () => {
  test("should not contain an object with birthdate value", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      url: "/createprofile",
      body: {
        birthdate: "1990-08-24" //valid date
      }
    });
    const res = httpMocks.createResponse();

    await testExpressValidatorMiddleware(req, res, validateAllButUsername());

    const result = validationResult(req);

    expect(result.errors).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          param: "birthdate"
        })
      ])
    );
  });

  test("should contain an object with birthdate value", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      url: "/createprofile",
      body: {
        birthdate: "2111-08-24" //invalid date
      }
    });
    const res = httpMocks.createResponse();

    await testExpressValidatorMiddleware(req, res, validateAllButUsername());

    const result = validationResult(req);
    console.log(result);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          param: "birthdate"
        })
      ])
    );
  });
});
