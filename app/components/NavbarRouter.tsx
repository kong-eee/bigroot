'use client';

import { useUiTheme } from '@/lib/theme-context';
import Navbar from './Navbar';
import NavbarClassic from './NavbarClassic';

export default function NavbarRouter() {
  const { theme } = useUiTheme();
  return theme === 'classic' ? <NavbarClassic /> : <Navbar />;
}
