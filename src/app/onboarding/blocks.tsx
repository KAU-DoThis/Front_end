import { BlockSetupScreen } from '@/features/block/screens/BlockSetupScreen';
import { useOnboardingBlockSetupStep } from '@/features/onboarding/hooks/useOnboardingBlockSetupStep';

export default function BlockSetupRoute() {
    const { missingInstitutionNames, onComplete, onExit } = useOnboardingBlockSetupStep();

    return (
        <BlockSetupScreen
            missingInstitutionNames={missingInstitutionNames}
            onComplete={onComplete}
            onExit={onExit}
        />
    );
}
