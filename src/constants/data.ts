import { NavItem } from '@/types';
import { IconHistory, IconLayoutDashboard } from '@tabler/icons-react';

//Info: The following data is used for the sidebar navigation.
export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard/overview',
    isActive: false,
    icon: IconLayoutDashboard,
    items: [] // Empty array as there are no child items for Dashboard
  },
  {
    title: 'Job History',
    url: '/dashboard/job-history',
    isActive: false,
    icon: IconHistory,
    items: [] // Empty array as there are no child items for Job History
  }
];
