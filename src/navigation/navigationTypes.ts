import { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: undefined;
  EmployeeFlow: undefined;
  ManagerFlow: undefined;
  Shared: undefined;
};

export type EmployeeTabsParamList = {
  EmployeeHome: undefined;
  EmployeeSchedule: undefined;
  EmployeeProfile: undefined;
};

export type ManagerTabsParamList = {
  ManagerDashboard: undefined;
  ManagerEmployees: undefined;
  ManagerProfile: undefined;
};

export type SharedStackParamList = {
  Profile: undefined;
  Settings: undefined;
};

// For type-safe navigation hooks
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}