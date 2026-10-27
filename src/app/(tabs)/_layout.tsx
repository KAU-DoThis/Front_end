import { Tabs } from 'expo-router';

import { TabBar } from '@/shared/components/layout/TabBar';

export default function TabsLayout() {
    return (
        <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
            <Tabs.Screen name="index" />
            <Tabs.Screen name="transactions" />
            <Tabs.Screen name="saving" />
            <Tabs.Screen name="report" />
        </Tabs>
    );
}
