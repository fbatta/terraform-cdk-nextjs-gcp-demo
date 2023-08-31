import { Construct } from "constructs";
import { TerraformStack, GcsBackend } from "cdktf";
import { GoogleProvider } from "@cdktf/provider-google/lib/provider";

import { SecretManagerSecret } from "@cdktf/provider-google/lib/secret-manager-secret"
import { SecretManagerSecretVersion } from "@cdktf/provider-google/lib/secret-manager-secret-version"

export default class SecretsStack extends TerraformStack {
  public azureClientSecret: SecretManagerSecret;
  public nextAuthSecret: SecretManagerSecret;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    new GcsBackend(this, {
      // eslint-disable-next-line @typescript-eslint/no-extra-non-null-assertion
      bucket: process.env.BUCKET_NAME!!,
      prefix: "terraform/secrets/state"
    });

    new GoogleProvider(this, "gcp", {
      project: process.env.GCP_PROJECT_ID,
      region: process.env.GCP_REGION
    });

    this.azureClientSecret = new SecretManagerSecret(this, 'azure-client-secret', {
      secretId: "azure-client-secret",
      replication: {
        automatic: true
      }
    });

    this.nextAuthSecret = new SecretManagerSecret(this, 'next-auth-secret', {
      secretId: "next-auth-secret",
      replication: {
        automatic: true
      }
    });

    new SecretManagerSecretVersion(this, 'azure-client-secret-version', {
      secret: this.azureClientSecret.id,
      secretData: process.env.AZURE_CLIENT_SECRET!
    });

    new SecretManagerSecretVersion(this, 'next-auth-secret-version', {
      secret: this.nextAuthSecret.id,
      secretData: process.env.NEXTAUTH_SECRET!
    });
  }
}
