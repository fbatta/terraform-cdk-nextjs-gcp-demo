import { App } from "cdktf";

import CloudRunStack from "./CloudRunStack";
import SecretsStack from "./SecretsStack";

const app = new App();
const secretsStack = new SecretsStack(app, 'terraform-cdk-nextjs-demo-secrets');
new CloudRunStack(app, "terraform-cdk-nextjs-demo", {
    azureClientSecretId: secretsStack.azureClientSecret.id,
    nextAuthSecretId: secretsStack.nextAuthSecret.id
});
app.synth();
