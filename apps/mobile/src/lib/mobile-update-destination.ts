import type { MobileInstallUpdateSource } from "./mobile-release";

type MobileUpdateDestinationDependencies = {
  linking: {
    openURL: (url: string) => Promise<unknown>;
  };
};

export type MobileUpdateDestinationResult = { status: "opened" };

export const openMobileInstallUpdateSource = async (
  source: MobileInstallUpdateSource,
  dependencies: MobileUpdateDestinationDependencies
): Promise<MobileUpdateDestinationResult> => {
  await dependencies.linking.openURL(source.url);
  return { status: "opened" };
};
