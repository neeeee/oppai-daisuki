const b = require("bcryptjs");
(async () => {
  console.log(
    "match?",
    await b.compare(
      "Password123!",
      "$2b$12$u5.L5Nok4ois1OZnKdtLQepFNVBY0xYmCI0ALVF/qxXBTCTWk0PSi",
    ),
  );
})();
