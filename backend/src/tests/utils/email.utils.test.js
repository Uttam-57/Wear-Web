import { sendEmail, passwordResetTemplate, deliveryOtpTemplate } from "../../utils/email.utils.js";

describe("Email Utils", () => {
  const previousEnv = process.env.NODE_ENV;

  beforeAll(() => {
    process.env.NODE_ENV = "test";
  });

  afterAll(() => {
    process.env.NODE_ENV = previousEnv;
  });

  it("should skip sending email in test environment", async () => {
    await expect(sendEmail("test@example.com", "Subject", "<p>Hi</p>")).resolves.toBeUndefined();
  });

  it("should render password reset template with link", () => {
    const link = "https://wearweb.test/reset?token=abc123";
    const html = passwordResetTemplate(link);

    expect(html).toContain(link);
    expect(html).toContain("Reset Your Password");
  });

  it("should render delivery OTP template with otp and order id", () => {
    const html = deliveryOtpTemplate("123456", { orderId: "ORD123" });

    expect(html).toContain("123456");
    expect(html).toContain("ORD123");
  });
});
