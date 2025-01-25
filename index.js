const core = require('@actions/core');
const github = require('@actions/github');

try {
  console.log('test');
} catch (error) {
  core.setFailed(error.message);
}