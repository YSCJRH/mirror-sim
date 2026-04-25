import type { Metadata } from "next";

import { ButtonLink } from "../../components/button-link";
import { CreateWorldWizard } from "../../components/create-world-wizard";
import { PageHero } from "../../components/page-hero";
import { SurfaceCard } from "../../components/surface-card";
import { WorkbenchTopBar } from "../../components/workbench-top-bar";
import { getAppLocale } from "../../lib/locale";
import { publicDemoMutationsDisabled } from "../../lib/public-demo-mode";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Mirror Create World",
    description:
      "Create a bounded incident world in private beta mode. Phase 1 public demo deployments keep this route disabled."
  };
}

export default async function CreateWorldPage() {
  const locale = await getAppLocale();
  const readOnlyPublicDemo = publicDemoMutationsDisabled();

  return (
    <main className="workbenchPage">
      <WorkbenchTopBar
        locale={locale}
        eyebrow={readOnlyPublicDemo ? "Mirror Public Demo" : "Mirror Engine / Private Beta"}
        items={[
          { href: "/", label: readOnlyPublicDemo ? "Public Demo" : "Launch Hub", active: false },
          { href: "/review", label: "Advanced Review", active: false },
          { href: "/worlds/new", label: "Create World", active: true }
        ]}
      />
      {readOnlyPublicDemo ? (
        <>
          <PageHero
            eyebrow="Read-only Phase 1"
            title="World creation is disabled in the public demo."
            lede="This deployment only serves precomputed Fog Harbor artifacts so anonymous visitors can inspect Mirror's replay, branch comparison, claims, evidence, and eval summary without accounts, uploads, or model calls."
            actions={
              <>
                <ButtonLink href="/">Open public demo</ButtonLink>
                <ButtonLink href="/review" variant="secondary">
                  Advanced review
                </ButtonLink>
              </>
            }
          />
          <SurfaceCard>
            <h2>Reserved For Later Phases</h2>
            <p>
              Auth, database-backed worlds, object storage, quotas, corpus upload, Hosted GPT, and BYOK are
              intentionally outside Phase 1. This page remains as a private-beta entry point when the public demo
              flags are disabled.
            </p>
          </SurfaceCard>
        </>
      ) : (
        <CreateWorldWizard locale={locale} />
      )}
    </main>
  );
}
