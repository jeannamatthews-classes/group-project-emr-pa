import { useEffect, useState } from "react";

import {
  fetchAuthenticatedAssetBlob,
  isProtectedAssetUrl,
  resolveAssetUrl,
} from "../services/authApi";

type ProtectedAssetLoadState = {
  sourceUrl: string | null;
  assetUrl: string | null;
  error: Error | null;
};

type AuthenticatedAssetState = {
  assetUrl: string | null;
  error: Error | null;
  loading: boolean;
};

export function useAuthenticatedAssetUrl(
  fileUrl: string | null | undefined
): AuthenticatedAssetState {
  const [protectedState, setProtectedState] = useState<ProtectedAssetLoadState>({
    sourceUrl: null,
    assetUrl: null,
    error: null,
  });

  const isProtectedAsset = Boolean(fileUrl && isProtectedAssetUrl(fileUrl));

  useEffect(() => {
    if (!fileUrl || !isProtectedAsset) {
      return;
    }

    const controller = new AbortController();
    let objectUrl: string | null = null;

    void fetchAuthenticatedAssetBlob(fileUrl, controller.signal)
      .then((blob) => {
        if (controller.signal.aborted) return;

        objectUrl = URL.createObjectURL(blob);
        setProtectedState({ sourceUrl: fileUrl, assetUrl: objectUrl, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        setProtectedState({
          sourceUrl: fileUrl,
          assetUrl: null,
          error: error instanceof Error ? error : new Error("Failed to load file."),
        });
      });

    return () => {
      controller.abort();

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileUrl, isProtectedAsset]);

  if (!fileUrl) {
    return { assetUrl: null, error: null, loading: false };
  }

  if (!isProtectedAsset) {
    return {
      assetUrl: resolveAssetUrl(fileUrl),
      error: null,
      loading: false,
    };
  }

  const isCurrentUrlResolved = protectedState.sourceUrl === fileUrl;

  return {
    assetUrl: isCurrentUrlResolved ? protectedState.assetUrl : null,
    error: isCurrentUrlResolved ? protectedState.error : null,
    loading:
      !isCurrentUrlResolved ||
      (isCurrentUrlResolved &&
        protectedState.assetUrl === null &&
        protectedState.error === null),
  };
}
