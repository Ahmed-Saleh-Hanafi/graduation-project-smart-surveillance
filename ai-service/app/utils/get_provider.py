import onnxruntime as ort
from typing import TypedDict, Literal


class ProviderConfig(TypedDict):
    """
    Configuration details for the selected ONNX Runtime execution provider.

    Attributes:
        device_id:
            GPU device index (0 for GPU) or -1 for CPU fallback.
        provider:
            ONNX Runtime provider name.
        device:
            Human-readable device type ("cuda" or "cpu").
    """
    device_id: int
    provider: str
    device: Literal["cuda", "cpu"]


# Provider priority list
PROVIDERS: list[str] = [
    "CUDAExecutionProvider",
    "AzureExecutionProvider",
    "CPUExecutionProvider",
]


def get_provider(provider_idx: int = 0) -> ProviderConfig:
    """
    Select an ONNX Runtime execution provider using a priority index.

    Available provider options:
        0 -> CUDAExecutionProvider
             Best for NVIDIA GPU acceleration (fastest for AI inference).

        1 -> AzureExecutionProvider
             Cloud-based Azure acceleration provider.

        2 -> CPUExecutionProvider
             Standard CPU fallback (works everywhere, slower).

    Args:
        provider_idx:
            Index of the preferred provider from PROVIDERS list.

            Supported values:
                0 = CUDAExecutionProvider
                1 = AzureExecutionProvider
                2 = CPUExecutionProvider

            Default:
                0 (CUDAExecutionProvider)

    Returns:
        ProviderConfig:
            Dictionary containing:
                device_id:
                    0 for GPU/cloud providers
                    -1 for CPU fallback

                provider:
                    Active ONNX Runtime provider name

                device:
                    "cuda" for GPU/cloud acceleration
                    "cpu" for CPU fallback

    Raises:
        ValueError:
            If provider_idx is outside the valid range.

    Fallback Behavior:
        If the selected provider is unavailable on the current machine,
        the function automatically falls back to CPUExecutionProvider.

    Examples:
        >>> get_provider(0)
        {
            "device_id": 0,
            "provider": "CUDAExecutionProvider",
            "device": "cuda"
        }

        >>> get_provider(1)
        {
            "device_id": 0,
            "provider": "AzureExecutionProvider",
            "device": "cuda"
        }

        >>> get_provider(2)
        {
            "device_id": -1,
            "provider": "CPUExecutionProvider",
            "device": "cpu"
        }

    Notes:
        - Use `ort.get_available_providers()` to inspect installed providers.
        - CUDAExecutionProvider requires `onnxruntime-gpu`.
        - CPUExecutionProvider is always the safest fallback.
    """
    if not 0 <= provider_idx < len(PROVIDERS):
        raise ValueError(
            f"Invalid provider_idx={provider_idx}. "
            f"Must be between 0 and {len(PROVIDERS) - 1}."
        )

    preferred_provider: str = PROVIDERS[provider_idx]
    available_providers: list[str] = ort.get_available_providers()

    if preferred_provider in available_providers:
        is_cpu: bool = preferred_provider == "CPUExecutionProvider"

        return {
            "device_id": -1 if is_cpu else 0,
            "provider": preferred_provider,
            "device": "cpu" if is_cpu else "cuda",
        }

    # Fallback to CPU if preferred provider is unavailable
    return {
        "device_id": -1,
        "provider": "CPUExecutionProvider",
        "device": "cpu",
    }