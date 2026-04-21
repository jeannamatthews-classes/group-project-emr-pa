import { useEffect, useState } from "react";

import {
  fetchAuthenticatedAssetBlob,
  isProtectedAssetUrl,
  resolveAssetUrl,
} from "../services/authApi";

type AuthenticatedAssetState = {
  assetUrl: string | null;
  error: Error | null;
  loading: boolean;
};

export function useAuthenticatedAssetUrl(
  fileUrl: string | null | undefined
): AuthenticatedAssetState {
  const [state, setState] = useState<AuthenticatedAssetState>({
    assetUrl: fileUrl && !isProtectedAssetUrl(fileUrl) ? resolveAssetUrl(fileUrl) : null,
    error: null,
    loading: false,
  });

  useEffect(() => {
    if (!fileUrl) {
      setState({ assetUrl: null, error: null, loading: false });
      return;
    }

    if (!isProtectedAssetUrl(fileUrl)) {
      setState({
        assetUrl: resolveAssetUrl(fileUrl),
        error: null,
        loading: false,
      });
      return;
    }

    const controller = new AbortController();
    let objectUrl: string | null = null;

    setState({ assetUrl: null, error: null, loading: true });

    void fetchAuthenticatedAssetBlob(fileUrl, controller.signal)
      .then((blob) => {
        if (controller.signal.aborted) return;

        objectUrl = URL.createObjectURL(blob);
        setState({ assetUrl: objectUrl, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        setState({
          assetUrl: null,
          error: error instanceof Error ? error : new Error("Failed to load file."),
          loading: false,
        });
      });

    return () => {
      controller.abort();

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileUrl]);

  return state;
}
