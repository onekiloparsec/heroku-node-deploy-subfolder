const core = require("@actions/core");
const { execSync } = require("child_process");

// Support Functions
const createCatFile = ({ email, api_key }) => `cat >~/.netrc <<EOF
machine api.heroku.com
    login ${email}
    password ${api_key}
machine git.heroku.com
    login ${email}
    password ${api_key}
EOF`;

// Input Variables
let heroku = {};
heroku.api_key = core.getInput("api_key");
heroku.email = core.getInput("email");
heroku.app_name = core.getInput("app_name");
heroku.branch = core.getInput("branch");
heroku.subfolder = core.getInput("subfolder");

try {
  const isShallow = execSync("git rev-parse --is-shallow-repository").toString();
  if (isShallow === "true\n") {
    execSync("git fetch --prune --unshallow");
    console.log("Successfully unshallowed repo.");
  }

  execSync(createCatFile(heroku));
  console.log("Successfully wrote to ~./netrc");

  execSync("heroku login");
  console.log("Successfully logged into heroku");

  execSync(`heroku git:remote --app ${app_name}`);
  console.log("Successfully set remote.");

  execSync(`
    [ \"\`git rev-parse --abbrev-ref HEAD\`\" == \"${branch}\" ] && git push heroku \`git subtree split --prefix ${subfolder} ${branch}\`:master --force || echo \"No deploy, wrong branch.\""
  `)
  console.log("Deploy successful.");

  core.setOutput("status", `Successfully deployed heroku app from branch ${heroku.branch}`);
} catch (err) {
  core.setFailed(err.toString());
}
