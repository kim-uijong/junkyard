import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { Exchange } from '../src/screens/Exchange';

export const Route = createRoute('/exchange', { component: Page });

function Page() {
  const navigation = Route.useNavigation();
  return <Exchange onBack={() => navigation.goBack()} />;
}
