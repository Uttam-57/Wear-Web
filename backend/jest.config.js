export default {
  testEnvironment: "node",
  transform: {},
  testMatch: ["**/src/tests/**/*.test.js"],
  setupFilesAfterEnv: ["./src/tests/setup.js"],
  forceExit: true,
  detectOpenHandles: true,
  moduleDirectories: ["node_modules", "src"],
};