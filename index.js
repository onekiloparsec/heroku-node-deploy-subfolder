const core = require("@actions/core");
const { execSync } = require("child_process");

const createNetrcFile = (email, api_key) => `cat >~/.netrc <<EOF
machine api.heroku.com
    login ${email}
    password ${api_key}
machine git.heroku.com
    login ${email}
    password ${api_key}
EOF`;

// Input Variables
const api_key = core.getInput("api_key");
const email = core.getInput("email");
const app_name = core.getInput("app_name");
const branch = core.getInput("branch");
const subfolder = core.getInput("subfolder");

try {
  const isShallow = execSync("git rev-parse --is-shallow-repository").toString();
  if (isShallow === "true\n") {
    execSync("git fetch --prune --unshallow");
    console.log("Successfully unshallowed repo.");
  }

  execSync(createNetrcFile(email, api_key));
  console.log("Successfully wrote to ~./netrc");

  execSync("heroku login");
  execSync(`heroku info -a ${app_name}`);
  console.log("Successfully logged into heroku");

  execSync(`heroku git:remote -a ${app_name}`);
  console.log(`Successfully set remote for ${app_name}.`);
    
  execSync(`
    [ \"\`git rev-parse --abbrev-ref HEAD\`\" == \"${branch}\" ] && git push heroku \`git subtree split --prefix=${subfolder} master\`:master --force || echo \"No deploy, wrong branch.\"
  `, {shell: '/bin/bash'})
  console.log("Deploy successful.");

  core.setOutput("status", `Successfully deployed heroku app from branch ${branch}`);
} catch (err) {
  core.setFailed(err.toString());
}
