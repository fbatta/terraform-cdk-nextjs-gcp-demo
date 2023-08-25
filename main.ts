import { Construct } from "constructs";
import { App, TerraformStack, GcsBackend } from "cdktf";
import { DockerProvider } from "@cdktf/provider-docker/lib/provider";
import { GoogleProvider } from "@cdktf/provider-google/lib/provider";
import { Image } from "@cdktf/provider-docker/lib/image";
import { RegistryImage } from "@cdktf/provider-docker/lib/registry-image";
import { CloudRunService } from "@cdktf/provider-google/lib/cloud-run-service";
import { CloudRunServiceIamMember } from "@cdktf/provider-google/lib/cloud-run-service-iam-member";

import * as meta from "./app/package.json";

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
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
        context: `/home/franc/source/terraform-cdk-nextjs-demo/app/.`
      },
    });

    const registryImage = new RegistryImage(this, "next-registry-image", {
      name: nextImage.name
    });

    const nextService = new CloudRunService(this, "next-service", {
      name: "next-service",
      location,
      template: {
        spec: {
          containers: [{
            image: registryImage.name,
            ports: [{ containerPort: 3000 }]
          }],
          containerConcurrency: 1
        }
      }
    });

    new CloudRunServiceIamMember(this, "next-unrestricted", {
      service: nextService.id,
      location,
      member: "allUsers",
      role: "roles/run.invoker"
    });
  }
}

const app = new App();
new MyStack(app, "terraform-cdk-nextjs-demo");
app.synth();
