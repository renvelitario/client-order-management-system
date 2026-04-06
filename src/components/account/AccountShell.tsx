import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

import '../../styles/pages/account/account-shell.css';

type AccountShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

const AccountShell = ({ title, description, children }: AccountShellProps) => (
  <section className="account-shell" aria-labelledby="account-shell-title">
    <header className="account-shell-header">
      <h1 id="account-shell-title">{title}</h1>
      <p>{description}</p>
    </header>

    <nav className="account-shell-nav" aria-label="Account settings navigation">
      <NavLink
        to="/account/profile"
        className={({ isActive }) => `account-shell-nav-item${isActive ? ' is-active' : ''}`}
      >
        Profile
      </NavLink>
      <NavLink
        to="/account/security"
        className={({ isActive }) => `account-shell-nav-item${isActive ? ' is-active' : ''}`}
      >
        Security
      </NavLink>
      <NavLink
        to="/account/session"
        className={({ isActive }) => `account-shell-nav-item${isActive ? ' is-active' : ''}`}
      >
        Sessions
      </NavLink>
    </nav>

    <div className="account-shell-content">{children}</div>
  </section>
);

export default AccountShell;
