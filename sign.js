require('dotenv').config()

exports.default = async function(configuration) {
    const TIMESTAMP = process.env.SIGNING_TIMESTAMP;
    const SIGNING_PATH = process.env.SIGNING_PATH;

    if (!TIMESTAMP || !SIGNING_PATH) {
      console.log("Skipping signing: SIGNING_TIMESTAMP or SIGNING_PATH not set");
      return;
    }

    console.log("Signing with timestamp: " + TIMESTAMP);
    console.log("Signing path: " + SIGNING_PATH);

    require("child_process").execSync(
      `signtool sign /tr ${TIMESTAMP} /td sha256 /fd sha256 /a "${configuration.path}"`,
      {cwd: SIGNING_PATH}
    );

    await new Promise(resolve => setTimeout(resolve, 5000));
  };