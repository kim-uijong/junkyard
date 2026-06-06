import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { Main } from '../src/screens/Main';

export const Route = createRoute('/', { component: Page });

function Page() {
  const navigation = Route.useNavigation();
  return <Main onGoExchange={() => navigation.navigate('/exchange')} />;
}
