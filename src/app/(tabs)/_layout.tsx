import { Tabs } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';

import { CreateTabButton } from '@/components/navigation/create-tab-button';
import { Icon, type IconName } from '@/components/ui';
import { useTheme } from '@/theme';

function tabIcon(active: IconName, inactive: IconName) {
  function TabIcon({ focused, color, size }: { focused: boolean; color: unknown; size: number }) {
    return <Icon name={focused ? active : inactive} color={String(color)} size={size} />;
  }
  return TabIcon;
}

export default function TabsLayout() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { colors } = theme;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.tabBar, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: t('tabs.home'), tabBarIcon: tabIcon('home', 'home-outline') }}
      />
      <Tabs.Screen
        name="explore"
        options={{ title: t('tabs.explore'), tabBarIcon: tabIcon('compass', 'compass-outline') }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: t('tabs.create'),
          tabBarButton: (props) => <CreateTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{ title: t('tabs.collection'), tabBarIcon: tabIcon('albums', 'albums-outline') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('tabs.profile'), tabBarIcon: tabIcon('person-circle', 'person-circle-outline') }}
      />
    </Tabs>
  );
}
