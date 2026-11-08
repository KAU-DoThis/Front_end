import { ConnectAccountScreen } from '@/features/connection/screens/ConnectAccountScreen';
import { useOnboardingConnectStep } from '@/features/onboarding/hooks/useOnboardingConnectStep';

export default function ConnectRoute() {
    const { onConnected, onExit } = useOnboardingConnectStep();

    return <ConnectAccountScreen onConnected={onConnected} onExit={onExit} />;
}
