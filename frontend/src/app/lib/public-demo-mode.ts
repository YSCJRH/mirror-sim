export function isPublicDemoMode() {
  return process.env.MIRROR_PUBLIC_DEMO_MODE === "1";
}

export function anonymousRunsEnabled() {
  return process.env.MIRROR_ALLOW_ANONYMOUS_RUNS === "1";
}

export function hostedModelEnabled() {
  return process.env.MIRROR_HOSTED_MODEL_ENABLED === "1";
}

export function publicDemoMutationsDisabled() {
  return isPublicDemoMode() && !anonymousRunsEnabled();
}

export function publicDemoDisabledMessage(locale: string | null | undefined) {
  if (locale?.startsWith("zh")) {
    return "Phase 1 公网演示是只读预生成 demo，不创建 world、不上传 corpus、不触发模型或新 run。";
  }

  return "The Phase 1 public demo is read-only and precomputed. It does not create worlds, upload corpora, call models, or start new runs.";
}
