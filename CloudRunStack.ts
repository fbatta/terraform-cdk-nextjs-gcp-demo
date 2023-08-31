import { Construct } from "constructs";
import { TerraformStack, GcsBackend } from "cdktf";
import { DockerProvider } from "@cdktf/provider-docker/lib/provider";
import { GoogleProvider } from "@cdktf/provider-google/lib/provider";
import { Image } from "@cdktf/provider-docker/lib/image";
import { RegistryImage } from "@cdktf/provider-docker/lib/registry-image";
import { CloudRunV2Service } from "@cdktf/provider-google/lib/cloud-run-v2-service";
import { CloudRunV2ServiceIamBinding } from "@cdktf/provider-google/lib/cloud-run-v2-service-iam-binding";
import * as meta from "./app/package.json";

export interface CloudRunStackConfig {
  azureClientSecretId: string;
  nextAuthSecretId: string;
}

export default class CloudRunStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: CloudRunStackConfig) {
    super(scope, id);

    new GcsBackend(this, {
      // eslint-disable-next-line @typescript-eslint/no-extra-non-null-assertion
      bucket: process.env.BUCKET_NAME!!,
      prefix: "terraform/state"
    });

    new DockerProvider(this, "docker", {
      registryAuth: [{
        address: "gcr.io",
        username: "oauth2accesstoken",
        password: process.env.GCR_ACCESS_TOKEN
      }]
    });

    const gcpProvider = new GoogleProvider(this, "gcp", {
      project: process.env.GCP_PROJECT_ID,
      region: process.env.GCP_REGION
    });

    const location = gcpProvider.region || "us-central1";

    const nextImage = new Image(this, "next-build", {
      name: `gcr.io/${gcpProvider.project}/next:v${meta.version}`,
      buildAttribute: {
        context: `${__dirname}/app`
      },
    });

    const registryImage = new RegistryImage(this, "next-registry-image", {
      name: nextImage.name
    });

    const nextService = new CloudRunV2Service(this, "next-service", {
      name: "next-service",
      location,
      template: {
        containers: [{
          image: registryImage.name,
          ports: [{ containerPort: 3000 }],
          env: [{
            name: "NEXTAUTH_URL",
            value: "https://next-service-qndl5dtzsa-uc.a.run.app"
          }, {
            name: "AZURE_CLIENT_ID",
            value: "ddd698ba-1a17-4f0d-a6c1-11c23e367be3"
          }, {
            name: "AZURE_AD_TENANT_ID",
            value: "0b3fc178-b730-4e8b-9843-e81259237b77"
          }, {
            name: "AZURE_CLIENT_SECRET",
            valueSource: {
              secretKeyRef: {
                version: "latest",
                secret: config.azureClientSecretId
              }
            }
          }, {
            name: "NEXTAUTH_SECRET",
            valueSource: {
              secretKeyRef: {
                version: "latest",
                secret: config.nextAuthSecretId
              }
            }
          }]
        }],
      }
    });

    new CloudRunV2ServiceIamBinding(this, "next-unrestricted", {
      name: nextService.name,
      location,
      members: ["allUsers"],
      role: "roles/run.invoker"
    });
  }
}
